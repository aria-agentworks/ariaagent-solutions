#!/usr/bin/env python3
"""
Bob for Ads — Hands Adapter
Takes Brain concepts → generates images/video via Replicate → deploys as live Meta ads.
"""
import os, sys, json, requests, replicate
from datetime import datetime
from pathlib import Path

config_path = os.environ.get('BOB_CONFIG')
if not config_path or not Path(config_path).exists():
    print("ERROR: BOB_CONFIG env var not set"); sys.exit(1)
with open(config_path) as f: config = json.load(f)

CONCEPTS = config['concepts']; BRAND = config['brand']
FB_ACCESS_TOKEN = config['fb_access_token']; AD_ACCOUNT_ID = config['ad_account_id']
PAGE_ID = config['page_id']; REPLICATE_API_TOKEN = config['replicate_api_token']
LANDING_PAGE_URL = config.get('landing_page_url','')
DAILY_BUDGET = config.get('daily_budget_per_adset',5)
os.environ['REPLICATE_API_TOKEN'] = REPLICATE_API_TOKEN
DATA_DIR = Path(config_path).parent; DEPLOYMENT_FILE = DATA_DIR / "deployment.json"


class HandsAdapter:
    def __init__(self):
        self.ad_account_id = AD_ACCOUNT_ID; self.fb_access_token = FB_ACCESS_TOKEN
        self.page_id = PAGE_ID; self.results = []; self.tmp_files = []

    def cleanup(self):
        for f in self.tmp_files:
            try: os.remove(f)
            except: pass

    def generate_image(self, prompt, output_path):
        try:
            print(f"      Generating image...")
            output = replicate.run("black-forest-labs/flux-1.1-pro",
                input={"prompt":prompt,"aspect_ratio":"9:16","output_format":"jpg","output_quality":90})
            r = requests.get(output[0] if isinstance(output,list) else str(output), timeout=60)
            with open(output_path,'wb') as f: f.write(r.content)
            print(f"      Image OK ({len(r.content)/1024:.0f}KB)"); return True
        except Exception as e: print(f"      Image fail: {e}"); return False

    def animate_image(self, image_path, motion_prompt, output_path):
        try:
            print(f"      Animating video...")
            with open(image_path,'rb') as img:
                output = replicate.run("minimax/hailuo-02",
                    input={"first_frame_image":img,"prompt":motion_prompt or "Subtle camera movement","duration":6,"resolution":"512p"})
            r = requests.get(output[0] if isinstance(output,list) else str(output), timeout=120)
            with open(output_path,'wb') as f: f.write(r.content)
            print(f"      Video OK ({len(r.content)/1024:.0f}KB)"); return True
        except Exception as e: print(f"      Video fail: {e}"); return False

    def create_thumbnail(self, video_path, thumb_path):
        import subprocess as sp
        try: sp.run(f"ffmpeg -i {video_path} -vframes 1 -q:v 2 {thumb_path} -y",shell=True,capture_output=True,timeout=10); return os.path.exists(thumb_path)
        except: return False

    def upload_video(self, video_path, title):
        try:
            url = f"https://graph.facebook.com/v18.0/{self.ad_account_id}/advideos"
            with open(video_path,'rb') as vf:
                r = requests.post(url,data={'access_token':self.fb_access_token,'title':title},files={'source':vf},timeout=120)
            if r.status_code==200: vid=r.json()['id']; print(f"      Video uploaded: {vid}"); return vid
            print(f"      Upload fail: {r.status_code}"); return None
        except Exception as e: print(f"      Upload err: {e}"); return None

    def upload_thumbnail(self, thumb_path):
        try:
            url = f"https://graph.facebook.com/v18.0/{self.ad_account_id}/adimages"
            with open(thumb_path,'rb') as img:
                r = requests.post(url,data={'access_token':self.fb_access_token},files={thumb_path:img},timeout=60)
            if r.status_code==200:
                images=r.json().get('images',{})
                if images: k=list(images.keys())[0]; h=images[k]['hash']; print(f"      Thumb: {h}"); return h
        except: pass
        return None

    def upload_image(self, image_path):
        try:
            url = f"https://graph.facebook.com/v18.0/{self.ad_account_id}/adimages"
            with open(image_path,'rb') as img:
                r = requests.post(url,data={'access_token':self.fb_access_token},files={image_path:img},timeout=60)
            if r.status_code==200:
                images=r.json().get('images',{})
                if images: k=list(images.keys())[0]; h=images[k]['hash']; print(f"      Image hash: {h}"); return h
        except: pass
        return None

    def create_campaign(self, name, objective='OUTCOME_TRAFFIC'):
        url = f"https://graph.facebook.com/v18.0/{self.ad_account_id}/campaigns"
        try:
            r = requests.post(url,data={'access_token':self.fb_access_token,'name':name,'objective':objective,'status':'ACTIVE','special_ad_categories':'[]'},timeout=30)
            if r.status_code==200: return r.json()['id']
        except: pass
        return None

    def create_adset(self, campaign_id, name, budget_cents=500):
        url = f"https://graph.facebook.com/v18.0/{self.ad_account_id}/adsets"
        targeting = json.dumps({'geo_locations':{'countries':['US']},'age_min':25,'age_max':65,
            'publisher_platforms':['facebook','instagram'],'facebook_positions':['feed'],'instagram_positions':['stream']})
        try:
            r = requests.post(url,data={'access_token':self.fb_access_token,'name':name,'campaign_id':campaign_id,
                'daily_budget':budget_cents,'billing_event':'IMPRESSIONS','optimization_goal':'LINK_CLICKS',
                'bid_strategy':'LOWEST_COST_WITHOUT_CAP','status':'ACTIVE','targeting':targeting},timeout=30)
            if r.status_code==200: return r.json()['id']
        except: pass
        return None

    def create_video_creative(self, video_id, image_hash, headline, copy):
        url = f"https://graph.facebook.com/v18.0/{self.ad_account_id}/adcreatives"
        spec = json.dumps({'page_id':self.page_id,'video_data':{'video_id':video_id,'image_hash':image_hash,
            'title':headline,'message':copy,'call_to_action':{'type':'LEARN_MORE','value':{'link':LANDING_PAGE_URL}}}})
        try:
            r = requests.post(url,data={'access_token':self.fb_access_token,'name':f'Creative - {headline}','object_story_spec':spec},timeout=30)
            if r.status_code==200: return r.json()['id']
        except: pass
        return None

    def create_image_creative(self, image_hash, headline, copy):
        url = f"https://graph.facebook.com/v18.0/{self.ad_account_id}/adcreatives"
        spec = json.dumps({'page_id':self.page_id,'image_data':{'image_hash':image_hash,
            'title':headline,'message':copy,'call_to_action':{'type':'LEARN_MORE','value':{'link':LANDING_PAGE_URL}}}})
        try:
            r = requests.post(url,data={'access_token':self.fb_access_token,'name':f'Creative - {headline}','object_story_spec':spec},timeout=30)
            if r.status_code==200: return r.json()['id']
        except: pass
        return None

    def create_ad(self, adset_id, creative_id, name):
        url = f"https://graph.facebook.com/v18.0/{self.ad_account_id}/ads"
        try:
            r = requests.post(url,data={'access_token':self.fb_access_token,'name':name,'adset_id':adset_id,
                'creative':json.dumps({'creative_id':creative_id}),'status':'ACTIVE'},timeout=30)
            if r.status_code==200: return r.json()['id']
        except: pass
        return None

    def deploy_all(self):
        print(f"\n{'='*60}\n  HANDS: Deploying {len(CONCEPTS)} concepts for {BRAND}\n  3x3 CBO | ${DAILY_BUDGET}/day per ad set\n{'='*60}")

        ts = datetime.now().strftime('%Y%m%d_%H%M')
        campaigns = {}
        groups = [('A',f"{BRAND} - Hooks A"),('B',f"{BRAND} - Hooks B"),('C',f"{BRAND} - Hooks C")]
        for prefix, name in groups:
            print(f"\n  Campaign: {name}")
            cid = self.create_campaign(name)
            if cid: campaigns[prefix]=cid; print(f"    ID: {cid}")
            else: print(f"    FAILED")

        if not campaigns:
            print("\n  ERROR: No campaigns created. Check FB_ACCESS_TOKEN + AD_ACCOUNT_ID.")
            return {'error':'No campaigns','ads':[]}

        for i, c in enumerate(CONCEPTS):
            cid = c.get('id',f"X{i+1}")
            prefix = cid[0] if cid[0] in campaigns else list(campaigns.keys())[0]
            campaign_id = campaigns.get(prefix)
            if not campaign_id: continue

            print(f"\n  [{cid}] {c.get('headline',c.get('hook','?'))[:55]}")
            img_p = f"/tmp/bob_{cid}.jpg"; vid_p = f"/tmp/bob_{cid}.mp4"; thb_p = f"/tmp/bob_{cid}_t.jpg"
            self.tmp_files.extend([img_p,vid_p,thb_p])

            # Generate image
            prompt = c.get('image_prompt',f"Professional ad for {BRAND}: {c.get('headline','')}")
            if not self.generate_image(prompt, img_p):
                self.generate_image(f"Professional product photo, {BRAND}, clean background", img_p)

            # Try video
            motion = c.get('video_motion_prompt','')
            has_video = False
            if motion and os.path.exists(img_p):
                if self.animate_image(img_p, motion, vid_p):
                    has_video = os.path.exists(vid_p) and os.path.getsize(vid_p) > 1000

            # Upload media
            if has_video:
                self.create_thumbnail(vid_p, thb_p)
                video_id = self.upload_video(vid_p, f"{BRAND} {cid}")
                if not video_id: continue
                image_hash = self.upload_thumbnail(thb_p) if os.path.exists(thb_p) else None
                if not image_hash: continue
            else:
                print(f"      Image-only creative")
                image_hash = self.upload_image(img_p)
                if not image_hash: continue
                video_id = None

            # Create ad set
            adset_id = self.create_adset(campaign_id, f"{BRAND} {cid}", DAILY_BUDGET*100)
            if not adset_id: continue
            print(f"      Ad set: {adset_id}")

            # Create creative
            headline = c.get('headline',f"{BRAND} {cid}")[:40]
            copy = c.get('body_copy','')[:125]
            if has_video and video_id and image_hash:
                creative_id = self.create_video_creative(video_id, image_hash, headline, copy)
            else:
                creative_id = self.create_image_creative(image_hash, headline, copy)
            if not creative_id: continue
            print(f"      Creative: {creative_id}")

            # Create ad
            ad_id = self.create_ad(adset_id, creative_id, f"{BRAND} {cid}")
            if not ad_id: continue
            print(f"      Ad LIVE: {ad_id}")

            self.results.append({'concept_id':cid,'campaign_id':campaign_id,'adset_id':adset_id,
                'creative_id':creative_id,'ad_id':ad_id,'headline':headline,'has_video':has_video,'status':'ACTIVE'})

        print(f"\n{'='*60}\n  DEPLOYMENT COMPLETE\n{'='*60}")
        print(f"  Campaigns: {len(campaigns)} | Ads: {len(self.results)}/{len(CONCEPTS)} | Budget: ${DAILY_BUDGET*len(self.results)}/day")
        for r in self.results: print(f"    [{r['concept_id']}] Ad {r['ad_id']}")

        deployment = {'run_id':config.get('run_id'),'brand':BRAND,'campaigns':campaigns,
            'campaign_name':f"Bob - {BRAND} {ts}",'total_daily_budget':DAILY_BUDGET*len(self.results),
            'ads_deployed':len(self.results),'ads':self.results,'deployed_at':datetime.utcnow().isoformat()+'Z'}
        with open(DEPLOYMENT_FILE,'w') as f: json.dump(deployment,f,indent=2)
        print(f"\n  Saved: {DEPLOYMENT_FILE}")
        print(f"  View: https://business.facebook.com/adsmanager/manage/campaigns?act={self.ad_account_id}")
        self.cleanup()
        return deployment


if __name__ == '__main__':
    a = HandsAdapter()
    try: result = a.deploy_all()
    except Exception as e: print(f"FATAL: {e}"); sys.exit(1)
    finally: a.cleanup()
