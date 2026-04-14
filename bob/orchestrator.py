#!/usr/bin/env python3
"""
Bob for Ads — Orchestrator
===========================
Brain (creative-ad-agent) → Hands (meta-ads-ai-agent) → Mouth (meta-ads-kit)

Usage:
  python orchestrator.py run --url https://client.com --brand "Brand"
  python orchestrator.py run --url ... --brand ... --skip-deploy
  python orchestrator.py run --url ... --brand ... --skip-monitor
  python orchestrator.py monitor
  python orchestrator.py status
  python orchestrator.py slack-test
"""

import os, sys, json, time, uuid, argparse, subprocess, requests
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

BOB_DIR = Path(__file__).parent.resolve()
PROJECT_DIR = BOB_DIR.parent.resolve()
DATA_DIR = BOB_DIR / "data"
LOG_DIR = BOB_DIR / "logs"
ADAPTERS_DIR = BOB_DIR / "adapters"
BRAIN_DIR = PROJECT_DIR / "creative-ad-agent"
HANDS_DIR = PROJECT_DIR / "meta-ads-ai-agent"
MOUTH_DIR = PROJECT_DIR / "meta-ads-kit"
PIPELINE_FILE = DATA_DIR / "pipeline.json"
CONCEPTS_FILE = DATA_DIR / "concepts.json"
DEPLOYMENT_FILE = DATA_DIR / "deployment.json"
MONITOR_FILE = DATA_DIR / "monitor.json"


class Logger:
    C = {'reset':'\033[0m','bold':'\033[1m','red':'\033[91m','green':'\033[92m',
         'yellow':'\033[93m','blue':'\033[94m','magenta':'\033[95m','cyan':'\033[96m','dim':'\033[2m'}

    def __init__(self, name):
        self.name = name
        self.log_file = LOG_DIR / f"{datetime.now().strftime('%Y%m%d')}.log"

    def _w(self, msg, color='reset'):
        ts = datetime.now().strftime('%H:%M:%S')
        print(f"{self.C['dim']}{ts}{self.C['reset']} {self.C['bold']}{self.C[color]}[{self.name}]{self.C['reset']} {msg}")
        with open(self.log_file, 'a') as f:
            f.write(f"{ts} [{self.name}] {msg}\n")

    def info(self, m): self._w(m, 'cyan')
    def ok(self, m): self._w(m, 'green')
    def warn(self, m): self._w(m, 'yellow')
    def error(self, m): self._w(m, 'red')
    def step(self, m): self._w(m, 'magenta')
    def header(self, m): print(f"\n{self.C['bold']}{'='*60}\n  {m}\n{'='*60}{self.C['reset']}")


def load_env():
    env_file = BOB_DIR / ".env"
    if not env_file.exists():
        example = BOB_DIR / ".env.example"
        if example.exists():
            import shutil; shutil.copy(example, env_file)
            print("  Created .env from .env.example — fill in your API keys!")
        else:
            print("  No .env found. Create bob/.env with your API keys.")
        sys.exit(1)
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, _, v = line.partition('=')
                os.environ.setdefault(k.strip(), v.strip())


def get_env(key, required=True):
    val = os.environ.get(key)
    if required and not val:
        raise ValueError(f"Missing required env var: {key}")
    return val


class PipelineState:
    def __init__(self, log):
        self.log = log; self.data = {}; self._load()

    def _load(self):
        if PIPELINE_FILE.exists():
            with open(PIPELINE_FILE) as f: self.data = json.load(f)

    def save(self):
        PIPELINE_FILE.parent.mkdir(parents=True, exist_ok=True)
        self.data['updated_at'] = datetime.now(timezone.utc).isoformat()
        with open(PIPELINE_FILE, 'w') as f: json.dump(self.data, f, indent=2)

    def init(self, url, brand):
        self.data = {
            'run_id': f"bob-{uuid.uuid4().hex[:8]}", 'url': url, 'brand': brand,
            'status': 'initialized',
            'brain': {'status':'pending','started_at':None,'completed_at':None},
            'hands': {'status':'pending','started_at':None,'completed_at':None},
            'mouth': {'status':'pending','started_at':None,'completed_at':None},
            'created_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat(),
        }
        self.save()

    def update_stage(self, stage, status, **kw):
        self.data[stage].update({'status': status, **kw})
        self.save()


class Brain:
    def __init__(self, state, log):
        self.state = state; self.log = log; self.base_url = "http://localhost:3001"

    def _ensure_server(self):
        try:
            r = requests.get(f"{self.base_url}/health", timeout=5)
            if r.status_code == 200:
                self.log.info("Brain server already running"); return True
        except requests.ConnectionError: pass

        self.log.step("Starting Brain server...")
        server_dir = BRAIN_DIR / "server"
        if not (server_dir / "node_modules").exists():
            self.log.step("Installing Brain deps..."); subprocess.run(["npm","install"], cwd=server_dir, capture_output=True)

        env = os.environ.copy()
        if os.environ.get('ANTHROPIC_API_KEY'): env['ANTHROPIC_API_KEY'] = os.environ['ANTHROPIC_API_KEY']
        if os.environ.get('FAL_KEY'): env['FAL_KEY'] = os.environ['FAL_KEY']

        self._server_proc = subprocess.Popen(
            ["npx","ts-node","sdk-server.ts"], cwd=server_dir, env=env,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        for _ in range(30):
            time.sleep(2)
            try:
                r = requests.get(f"{self.base_url}/health", timeout=3)
                if r.status_code == 200:
                    self.log.ok("Brain server started"); return True
            except requests.ConnectionError: continue
        self.log.error("Brain server failed to start"); return False

    def generate(self, url, brand):
        self.state.update_stage('brain','running',started_at=datetime.now(timezone.utc).isoformat())
        if not self._ensure_server(): raise RuntimeError("Brain server not available")

        prompt = (f"Create 6 hook-first Instagram ad concepts for {brand} ({url}). "
                  f"Target cold audience. Use hooks: question, bold claim, pain point, social proof, curiosity, FOMO. "
                  f"Generate images. Return JSON with id (A1-A6), hook, headline, body_copy, image_prompt, target_audience, hook_type.")

        self.log.step("Sending to Brain...")
        try:
            r = requests.post(f"{self.base_url}/generate", json={"prompt":prompt}, timeout=300)
            if r.status_code != 200:
                self.log.error(f"Brain returned {r.status_code}"); raise RuntimeError(f"Brain failed: HTTP {r.status_code}")

            result = r.json()
            concepts = self._extract_concepts(result, url, brand)
            CONCEPTS_FILE.parent.mkdir(parents=True, exist_ok=True)
            with open(CONCEPTS_FILE,'w') as f:
                json.dump({'run_id':self.state.data['run_id'],'url':url,'brand':brand,
                           'generated_at':datetime.now(timezone.utc).isoformat(),
                           'session_id':result.get('sessionId'),'concepts':concepts}, f, indent=2)
            self.log.ok(f"Generated {len(concepts)} concepts -> data/concepts.json")
            self.state.update_stage('brain','completed',completed_at=datetime.now(timezone.utc).isoformat(),concepts_count=len(concepts))
            return concepts
        except requests.Timeout: self.log.error("Brain timed out"); raise

    def _extract_concepts(self, result, url, brand):
        concepts = []
        response = result.get('response',{})
        structured = response.get('structuredData')
        if structured and isinstance(structured, list):
            for i,item in enumerate(structured):
                concepts.append({
                    'id':item.get('id',f"{chr(65+i//3)}{i%3+1}"),
                    'hook_type':item.get('hook_type','curiosity'),
                    'hook':item.get('hook',item.get('headline','')),
                    'headline':item.get('headline',item.get('title',''))[:40],
                    'body_copy':item.get('body_copy',item.get('body',''))[:125],
                    'long_copy':item.get('long_copy',''),
                    'image_prompt':item.get('image_prompt',''),
                    'video_motion_prompt':item.get('video_motion_prompt',''),
                    'target_audience':item.get('target_audience','General'),
                    'image_url':item.get('image_url',''),'status':'concept',
                })
        while len(concepts) < 6:
            concepts.append({'id':f"X{len(concepts)+1}",'hook_type':'curiosity',
                'hook':f'Hook for {brand}','headline':f'{brand} Ad {len(concepts)+1}',
                'body_copy':f'Discover {brand} at {url}','image_prompt':f'Ad for {brand}',
                'video_motion_prompt':'','target_audience':'General','image_url':'','status':'concept'})
        return concepts[:6]


class Hands:
    def __init__(self, state, log):
        self.state = state; self.log = log

    def deploy(self, concepts, brand):
        self.state.update_stage('hands','running',started_at=datetime.now(timezone.utc).isoformat())
        adapter_path = ADAPTERS_DIR / "hands_adapter.py"
        if not adapter_path.exists():
            self.log.error("Hands adapter missing"); raise FileNotFoundError("Install hands adapter")

        deploy_config = {
            'run_id':self.state.data['run_id'],'brand':brand,'concepts':concepts,
            'fb_access_token':get_env('FB_ACCESS_TOKEN'),'ad_account_id':get_env('AD_ACCOUNT_ID'),
            'page_id':get_env('PAGE_ID'),'fb_pixel_id':get_env('FB_PIXEL_ID'),
            'replicate_api_token':get_env('REPLICATE_API_TOKEN'),
            'landing_page_url':get_env('LANDING_PAGE_URL',required=False) or f"https://{brand.replace(' ','').lower()}.com",
            'daily_budget_per_adset':int(get_env('DAILY_BUDGET_PER_ADSET',required=False) or '5'),
        }
        config_file = DATA_DIR / "deploy_config.json"
        with open(config_file,'w') as f: json.dump(deploy_config,f,indent=2)

        self.log.step(f"Deploying {len(concepts)} concepts...")
        env = os.environ.copy(); env['PYTHONPATH']=str(HANDS_DIR); env['BOB_CONFIG']=str(config_file)
        result = subprocess.run([sys.executable,str(adapter_path)],cwd=str(BOB_DIR),env=env,capture_output=True,text=True,timeout=600)

        if result.stdout:
            for line in result.stdout.strip().split('\n'): self.log.info(f"  {line}")
        if result.returncode != 0:
            self.log.error(f"Hands failed: {result.stderr[:300]}")
            self.state.update_stage('hands','failed',error=result.stderr[:500]); raise RuntimeError("Deployment failed")

        deployment = {}
        if DEPLOYMENT_FILE.exists():
            with open(DEPLOYMENT_FILE) as f: deployment = json.load(f)
        self.state.update_stage('hands','completed',completed_at=datetime.now(timezone.utc).isoformat(),
                                campaign_id=deployment.get('campaign_id'),ads_deployed=len(deployment.get('ads',[])))
        self.log.ok(f"Deployed {deployment.get('ads_deployed',0)} ads")
        return deployment


class Mouth:
    def __init__(self, state, log):
        self.state = state; self.log = log

    def check_prerequisites(self):
        try:
            subprocess.run(['social','--version'],capture_output=True,text=True,timeout=5)
            self.log.info("social-cli found"); return True
        except FileNotFoundError:
            self.log.warn("social-cli not found. Install: npm install -g @vishalgojha/social-cli"); return False

    def run_check(self, mode='daily-check'):
        self.state.update_stage('mouth','running',started_at=datetime.now(timezone.utc).isoformat())
        run_script = MOUTH_DIR / "run.sh"
        if not run_script.exists(): raise FileNotFoundError("meta-ads-kit run.sh missing")
        self.log.step(f"Running Mouth: {mode}...")

        env = os.environ.copy()
        account = os.environ.get('AD_ACCOUNT_ID') or os.environ.get('META_AD_ACCOUNT')
        if account: env['META_AD_ACCOUNT'] = account

        result = subprocess.run(['bash',str(run_script),mode],cwd=str(MOUTH_DIR),env=env,capture_output=True,text=True,timeout=120)
        output = result.stdout + result.stderr
        alerts = self._parse_alerts(output)

        MONITOR_FILE.parent.mkdir(parents=True,exist_ok=True)
        with open(MONITOR_FILE,'w') as f:
            json.dump({'run_id':self.state.data.get('run_id'),'mode':mode,'output':output,
                       'exit_code':result.returncode,'alerts':alerts,'ran_at':datetime.now(timezone.utc).isoformat()},f,indent=2)

        self.state.update_stage('mouth','completed',completed_at=datetime.now(timezone.utc).isoformat(),alerts_found=len(alerts))
        self.log.ok(f"Monitor check done: {mode}")
        return output

    def _parse_alerts(self, output):
        alerts = []
        for line in output.split('\n'):
            if '🩸' in line or 'bleeder' in line.lower(): alerts.append({'type':'bleeder','message':line.strip()})
            elif '🏆' in line or 'winner' in line.lower(): alerts.append({'type':'winner','message':line.strip()})
            elif '😴' in line or 'fatigue' in line.lower(): alerts.append({'type':'fatigue','message':line.strip()})
            elif '⚠️' in line: alerts.append({'type':'warning','message':line.strip()})
        return alerts


class SlackNotifier:
    def __init__(self, log):
        self.log = log
        self.token = os.environ.get('SLACK_BOT_TOKEN')
        self.webhook_url = os.environ.get('SLACK_WEBHOOK_URL')
        self.channel = os.environ.get('SLACK_CHANNEL','#bob-ads')

    def is_configured(self): return bool(self.token or self.webhook_url)

    def send(self, text, blocks=None):
        if self.webhook_url: self._webhook(text,blocks)
        elif self.token: self._api(text,blocks)
        else: self.log.warn("Slack not configured")

    def _webhook(self, text, blocks):
        try:
            r = requests.post(self.webhook_url,json={'text':text,'blocks':blocks or []},timeout=10)
            self.log.ok("Slack sent" if r.status_code==200 else f"Slack {r.status_code}")
        except Exception as e: self.log.error(f"Slack: {e}")

    def _api(self, text, blocks):
        try:
            r = requests.post('https://slack.com/api/chat.postMessage',
                headers={'Authorization':f'Bearer {self.token}'},
                json={'channel':self.channel,'text':text,'blocks':blocks or []},timeout=10)
            self.log.ok("Slack sent" if r.json().get('ok') else f"Slack error: {r.json().get('error')}")
        except Exception as e: self.log.error(f"Slack: {e}")

    def pipeline_start(self, url, brand, run_id):
        self.send(f"🚀 Bob pipeline started for {brand}", blocks=[
            {"type":"header","text":{"type":"plain_text","text":"🚀 Bob for Ads — Pipeline Started"}},
            {"type":"section","fields":[
                {"type":"mrkdwn","text":f"*Brand:*\n{brand}"},
                {"type":"mrkdwn","text":f"*Run:*\n`{run_id}`"},
                {"type":"mrkdwn","text":f"*URL:*\n{url}"},
                {"type":"mrkdwn","text":f"*Time:*\n{datetime.now().strftime('%H:%M')}"},
            ]},
        ])

    def concepts_ready(self, concepts, brand):
        lines = [f"• *{c['id']}*: {c.get('hook',c.get('headline',''))[:70]}" for c in concepts[:6]]
        self.send(f"🎨 {brand}: 6 concepts ready", blocks=[
            {"type":"header","text":{"type":"plain_text","text":f"🎨 {brand} — 6 Concepts Ready"}},
            {"type":"section","text":{"type":"mrkdwn","text":"\n".join(lines)}},
            {"type":"divider"},
            {"type":"actions","elements":[
                {"type":"button","text":{"type":"plain_text","text":"✅ Deploy All 6","emoji":True},"style":"primary","action_id":"approve_all_concepts","value":"approve_all"},
                {"type":"button","text":{"type":"plain_text","text":"❌ Cancel","emoji":True},"style":"danger","action_id":"reject_concepts","value":"reject"},
            ]},
        ])

    def deploy_summary(self, deployment, brand):
        cid = deployment.get('campaign_id','?'); n = len(deployment.get('ads',[])); b = n*5
        self.send(f"🎯 {brand}: {n} ads deployed (${b}/day)", blocks=[
            {"type":"header","text":{"type":"plain_text","text":f"🎯 {brand} — Ads Live!"}},
            {"type":"section","fields":[
                {"type":"mrkdwn","text":f"*Campaign:*\n`{cid}`"},
                {"type":"mrkdwn","text":f"*Ads:*\n{n}"},
                {"type":"mrkdwn","text":f"*Budget:*\n${b}/day"},
                {"type":"mrkdwn","text":f"*Grid:*\n3x3 CBO"},
            ]},
        ])

    def monitor_alerts(self, alerts, brand):
        if not alerts: return
        bleeders = [a for a in alerts if a['type']=='bleeder']
        winners = [a for a in alerts if a['type']=='winner']
        blocks = [{"type":"header","text":{"type":"plain_text","text":f"📊 {brand} — Daily Briefing"}}]
        if bleeders:
            blocks.append({"type":"section","text":{"type":"mrkdwn","text":"🩸 *Bleeders*"}})
            for b in bleeders[:5]: blocks.append({"type":"section","text":{"type":"mrkdwn","text":f"> {b['message'][:100]}"}})
        if winners:
            blocks.append({"type":"section","text":{"type":"mrkdwn","text":"🏆 *Winners*"}})
            for w in winners[:5]: blocks.append({"type":"section","text":{"type":"mrkdwn","text":f"> {w['message'][:100]}"}})
        actions = []
        if bleeders: actions.append({"type":"button","text":{"type":"plain_text","text":"🩸 Kill Bleeders","emoji":True},"style":"danger","action_id":"kill_bleeders","value":"kill"})
        if winners: actions.append({"type":"button","text":{"type":"plain_text","text":"🏆 Scale Winners","emoji":True},"style":"primary","action_id":"scale_winners","value":"scale"})
        if actions:
            blocks.append({"type":"divider"})
            blocks.append({"type":"actions","elements":actions})
        self.send(f"📊 {brand}: {len(alerts)} alerts", blocks)

    def test(self):
        self.send("🧪 Bob Test", blocks=[
            {"type":"header","text":{"type":"plain_text","text":"🧪 Bob for Ads — Test"}},
            {"type":"section","text":{"type":"mrkdwn","text":"Bob is connected. Sample buttons:"}},
            {"type":"actions","elements":[
                {"type":"button","text":{"type":"plain_text","text":"✅ Approve"},"style":"primary","action_id":"test_approve","value":"approve"},
                {"type":"button","text":{"type":"plain_text","text":"❌ Kill"},"style":"danger","action_id":"test_kill","value":"kill"},
                {"type":"button","text":{"type":"plain_text","text":"🏆 Scale"},"action_id":"test_scale","value":"scale"},
            ]},
        ])


def run_pipeline(url, brand, skip_deploy=False, skip_monitor=False):
    load_env()
    log = Logger("BOB")
    log.header(f"Bob for Ads — Pipeline")
    log.info(f"URL: {url} | Brand: {brand}")

    state = PipelineState(log); state.init(url, brand)
    slack = SlackNotifier(log)
    if slack.is_configured(): slack.pipeline_start(url, brand, state.data['run_id'])

    # BRAIN
    log.header("Stage 1: Brain — Generate 6 Concepts")
    brain = Brain(state, log)
    try:
        concepts = brain.generate(url, brand)
        for c in concepts: log.info(f"  [{c['id']}] {c.get('hook_type','?'):15s} | {c['hook'][:55]}")
        if slack.is_configured(): slack.concepts_ready(concepts, brand)
    except Exception as e:
        log.error(f"Brain failed: {e}"); return False

    # HANDS
    if not skip_deploy:
        log.header("Stage 2: Hands — Deploy Live Ads")
        hands = Hands(state, log)
        try:
            deployment = hands.deploy(concepts, brand)
            if slack.is_configured(): slack.deploy_summary(deployment, brand)
        except Exception as e:
            log.error(f"Hands failed: {e}"); return False
    else: log.warn("Skipping deploy (--skip-deploy)")

    # MOUTH
    if not skip_monitor:
        log.header("Stage 3: Mouth — Monitor & Alert")
        mouth = Mouth(state, log)
        if mouth.check_prerequisites():
            try:
                output = mouth.run_check('daily-check')
                if MONITOR_FILE.exists():
                    alerts = json.load(open(MONITOR_FILE)).get('alerts',[])
                    if slack.is_configured() and alerts: slack.monitor_alerts(alerts, brand)
            except Exception as e: log.warn(f"Mouth: {e}")
        else: log.warn("social-cli missing — skip Mouth")
    else: log.warn("Skipping monitor (--skip-monitor)")

    log.header("Pipeline Complete!")
    for s,l in [('brain','Brain'),('hands','Hands'),('mouth','Mouth')]:
        icon = {'completed':'✅','running':'🔄','failed':'❌','pending':'⏳'}.get(state.data[s]['status'],'❓')
        log.info(f"  {icon} {l}: {state.data[s]['status']}")
    if slack.is_configured(): slack.send(f"✅ Bob pipeline complete for {brand}")
    return True


def show_status():
    log = Logger("BOB")
    if not PIPELINE_FILE.exists(): log.info("No pipeline run found"); return
    with open(PIPELINE_FILE) as f: data = json.load(f)
    print(f"\n{'='*50}\n  Bob — Pipeline Status\n{'='*50}")
    print(f"  Run:    {data.get('run_id','?')}")
    print(f"  URL:    {data.get('url','?')}")
    print(f"  Brand:  {data.get('brand','?')}")
    for s,l in [('brain','Brain'),('hands','Hands'),('mouth','Mouth')]:
        info = data.get(s,{})
        st = info.get('status','?')
        icon = {'completed':'✅','running':'🔄','failed':'❌','pending':'⏳'}.get(st,'❓')
        print(f"  {icon} {l:10s} {st}")


def main():
    p = argparse.ArgumentParser(description="Bob for Ads — 3-repo pipeline (Brain→Hands→Mouth)")
    sub = p.add_subparsers(dest='cmd')

    r = sub.add_parser('run', help='Run full pipeline')
    r.add_argument('--url', required=True); r.add_argument('--brand', required=True)
    r.add_argument('--skip-deploy', action='store_true'); r.add_argument('--skip-monitor', action='store_true')
    sub.add_parser('monitor', help='Daily check only')
    sub.add_parser('status', help='Show status')
    sub.add_parser('slack-test', help='Test Slack')

    a = p.parse_args()
    if a.cmd == 'run': sys.exit(0 if run_pipeline(a.url, a.brand, a.skip_deploy, a.skip_monitor) else 1)
    elif a.cmd == 'monitor':
        load_env(); mouth = Mouth(PipelineState(Logger("BOB")), Logger("BOB"))
        if mouth.check_prerequisites(): print(mouth.run_check('daily-check'))
    elif a.cmd == 'status': show_status()
    elif a.cmd == 'slack-test': load_env(); SlackNotifier(Logger("BOB")).test()
    else: p.print_help()


if __name__ == '__main__': main()
