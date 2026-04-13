#!/usr/bin/env python3
"""
Bob for Ads — Slack Bot Server
Receives Slack interactive button actions → executes Meta API calls (pause/scale/kill).

Usage: python slack_bot.py [--port 5000]
Slack setup: Set Request URL to http://your-server:PORT/slack/action
"""
import os, sys, json, hmac, hashlib, time, argparse, requests
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

BOB_DIR = Path(__file__).parent.parent.resolve()
DATA_DIR = BOB_DIR / "data"
SLACK_BOT_TOKEN = os.environ.get('SLACK_BOT_TOKEN','')
SLACK_SIGNING_SECRET = os.environ.get('SLACK_SIGNING_SECRET','')


def load_file(path, default={}):
    try:
        if path.exists():
            with open(path) as f: return json.load(f)
    except: pass
    return default


def meta_request(ad_id, status):
    token = os.environ.get('FB_ACCESS_TOKEN','')
    if not token: return {'success':False,'error':'No FB_ACCESS_TOKEN'}
    try:
        r = requests.post(f"https://graph.facebook.com/v18.0/{ad_id}",
            data={'access_token':token,'status':status},timeout=15)
        return {'success':r.status_code==200,'ad_id':ad_id,'new_status':status}
    except Exception as e: return {'success':False,'error':str(e)}


def handle_action(payload):
    action = payload.get('actions',[{}])[0]
    action_id = action.get('action_id','')
    value = action.get('value','')
    user = payload.get('user',{}).get('name','unknown')
    print(f"  [Slack] {user} → {action_id}")

    if action_id == 'kill_bleeders':
        deployment = load_file(DATA_DIR/"deployment.json")
        killed = 0
        for ad in deployment.get('ads',[]):
            result = meta_request(ad['ad_id'],'PAUSED')
            if result['success']: killed += 1
        return {'status':'ok','action':'kill_bleeders','killed':killed}

    elif action_id == 'scale_winners':
        deployment = load_file(DATA_DIR/"deployment.json")
        budget = int(os.environ.get('DAILY_BUDGET_PER_ADSET','5'))
        scaled = 0
        for ad in deployment.get('ads',[]):
            if ad.get('adset_id'):
                token = os.environ.get('FB_ACCESS_TOKEN','')
                if token:
                    try:
                        r = requests.post(f"https://graph.facebook.com/v18.0/{ad['adset_id']}",
                            data={'access_token':token,'daily_budget':budget*200},timeout=15)
                        if r.status_code==200: scaled += 1
                    except: pass
        return {'status':'ok','action':'scale_winners','scaled':scaled}

    return {'status':'ok','action':action_id}


def verify_signature(ts, body, sig):
    if not SLACK_SIGNING_SECRET: return True
    if abs(time.time()-int(ts))>300: return False
    base = f"v0:{ts}:{body}"
    expected = "v0="+hmac.new(SLACK_SIGNING_SECRET.encode(),base.encode(),hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, sig)


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if '/slack/action' in self.path:
            length = int(self.headers.get('Content-Length',0))
            body = self.rfile.read(length).decode('utf-8')
            ts = self.headers.get('X-Slack-Request-Timestamp','')
            sig = self.headers.get('X-Slack-Signature','')
            if not verify_signature(ts,body,sig):
                self.send_response(403); self.end_headers(); return

            payload = {}
            for part in body.split('&'):
                if '=' in part:
                    k,v = part.split('=',1); payload[k] = requests.utils.unquote(v.replace('+',' '))
            if 'payload' in payload: payload = json.loads(payload['payload'])

            result = handle_action(payload)
            self.send_response(200); self.send_header('Content-Type','application/json'); self.end_headers()
            self.wfile.write(json.dumps(result).encode())

    def do_GET(self):
        if '/health' in self.path:
            self.send_response(200); self.send_header('Content-Type','application/json'); self.end_headers()
            self.wfile.write(json.dumps({'status':'ok','service':'bob-slack-bot'}).encode())

    def log_message(self, fmt, *args): print(f"  [HTTP] {args[0]}")


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--port',type=int,default=int(os.environ.get('BOB_PORT','5000')))
    a = p.parse_args()
    print(f"\n  Bob Slack Bot on :{a.port}")
    print(f"  POST /slack/action — button actions")
    print(f"  GET  /health\n")
    HTTPServer(('0.0.0.0',a.port),Handler).serve_forever()


if __name__=='__main__': main()
