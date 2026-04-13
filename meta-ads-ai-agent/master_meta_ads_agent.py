#!/usr/bin/env python3
"""
Master Meta Ads AI Agent - Automated Media Buyer
Generates, tests, and optimizes video ad campaigns automatically
"""

import os
import sys
import time
import json
import requests
import replicate
from datetime import datetime
from typing import List, Dict
import subprocess

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # dotenv not installed, will use system environment variables
    pass

class MasterMetaAdsAgent:
    def __init__(self):
        # API Keys - Load from environment variables
        self.replicate_api_key = os.getenv("REPLICATE_API_TOKEN")
        self.fb_access_token = os.getenv("FB_ACCESS_TOKEN")
        self.fb_pixel_id = os.getenv("FB_PIXEL_ID", "656397773045622")
        self.ad_account_id = os.getenv("AD_ACCOUNT_ID", "act_283244530805042")
        self.fb_page_id = os.getenv("PAGE_ID", "122106081866003922")
        
        # Validate required environment variables
        if not self.replicate_api_key:
            raise ValueError("REPLICATE_API_TOKEN environment variable is required")
        if not self.fb_access_token:
            raise ValueError("FB_ACCESS_TOKEN environment variable is required")
        
        os.environ["REPLICATE_API_TOKEN"] = self.replicate_api_key
        
        # Reference image
        self.reference_image = "/root/mikeefull.001.jpeg"
        
        # Mascot description
        self.mascot_desc = "Professional, attractive woman in late 20s-early 30s, long dark hair styled modern and sleek, wearing super low-cut V-neck dark navy blazer with bright neon green accents, confident friendly smile, tech-savvy professional look"
        
        # Creative variations - different benefits to test
        self.creative_concepts = [
            {
                "name": "Time Savings",
                "image_prompt": "Standing in modern tech office with dark navy and bright green holographic displays showing '20 HOURS SAVED' in glowing text. Pointing excitedly. Professional studio lighting, high quality, photorealistic",
                "motion_prompt": "Cinematic camera push in. She looks directly at camera with confident smile. Holographic display glows brighter. Text pulses. Professional commercial style, smooth motion",
                "ad_copy": "Save 20+ hours every week. Let AI handle your outbound sales.",
                "headline": "Replace Your SDR Team with AI"
            },
            {
                "name": "Cost Savings",
                "image_prompt": "In sleek office with navy and green lighting, holding holographic dollar signs floating around her. Confident expression. Modern corporate aesthetic, high quality, photorealistic",
                "motion_prompt": "Slow zoom in. Dollar signs float and multiply. She gestures confidently. Professional commercial style with dynamic lighting",
                "ad_copy": "Cut sales costs by 90%. $499/mo vs $5K/mo SDR team.",
                "headline": "10x ROI on Your Sales Budget"
            },
            {
                "name": "Results Focus",
                "image_prompt": "Celebrating in modern office with navy and green holographic charts showing upward growth. Arms raised in victory. Professional studio lighting, photorealistic, corporate style",
                "motion_prompt": "She celebrates as charts rise dramatically. Camera circles around. Confetti effect. High-energy commercial style",
                "ad_copy": "Book 10+ qualified calls daily. Guaranteed results or money back.",
                "headline": "10+ Sales Calls Booked Daily"
            },
            {
                "name": "Automation",
                "image_prompt": "At futuristic desk with navy and green AI interface screens. Relaxed, confident pose. Screens show automation workflows. High-tech aesthetic, photorealistic",
                "motion_prompt": "Screens activate sequentially. She leans back confidently. Automation flows visualized. Sleek tech commercial style",
                "ad_copy": "Set it and forget it. AI handles prospecting, outreach, and follow-ups.",
                "headline": "Your 24/7 AI Sales Team"
            },
            {
                "name": "Easy Setup",
                "image_prompt": "Snapping fingers with navy and green sparkle effect. Confident smile. Simple, clean background. Professional lighting, photorealistic",
                "motion_prompt": "Finger snap creates sparkle burst. Everything lights up. Quick, snappy motion. Dynamic commercial style",
                "ad_copy": "Launch in 5 minutes. No technical skills required.",
                "headline": "AI SDR Ready in 5 Minutes"
            }
        ]
    
    def generate_image(self, prompt: str, output_path: str) -> bool:
        """Generate image using Flux Pro"""
        try:
            print(f"      🎨 Generating image...")
            
            output = replicate.run(
                "black-forest-labs/flux-1.1-pro",
                input={
                    "prompt": f"{self.mascot_desc}. {prompt}",
                    "aspect_ratio": "9:16",
                    "output_format": "jpg",
                    "output_quality": 90
                }
            )
            
            image_url = output[0] if isinstance(output, list) else str(output)
            response = requests.get(image_url)
            with open(output_path, 'wb') as f:
                f.write(response.content)
            
            print(f"      ✅ Image generated")
            return True
        except Exception as e:
            print(f"      ❌ Failed: {str(e)}")
            return False
    
    def animate_image(self, image_path: str, motion_prompt: str, output_path: str) -> bool:
        """Animate image to video using Hailuo 2"""
        try:
            print(f"      🎬 Animating to video...")
            
            output = replicate.run(
                "minimax/hailuo-02",
                input={
                    "first_frame_image": open(image_path, "rb"),
                    "prompt": motion_prompt,
                    "duration": 6,
                    "resolution": "512p"
                }
            )
            
            video_url = output[0] if isinstance(output, list) else str(output)
            response = requests.get(video_url)
            with open(output_path, 'wb') as f:
                f.write(response.content)
            
            print(f"      ✅ Video generated ({os.path.getsize(output_path)/1024:.1f}KB)")
            return True
        except Exception as e:
            print(f"      ❌ Failed: {str(e)}")
            return False
    
    def create_thumbnail(self, video_path: str, thumb_path: str) -> bool:
        """Extract thumbnail from video"""
        try:
            cmd = f"ffmpeg -i {video_path} -vframes 1 -q:v 2 {thumb_path} -y 2>/dev/null"
            subprocess.run(cmd, shell=True, capture_output=True)
            return os.path.exists(thumb_path)
        except:
            return False
    
    def upload_video_to_meta(self, video_path: str, title: str) -> str:
        """Upload video to Meta"""
        try:
            url = f"https://graph.facebook.com/v18.0/{self.ad_account_id}/advideos"
            with open(video_path, 'rb') as video_file:
                files = {'source': video_file}
                data = {'access_token': self.fb_access_token, 'title': title}
                response = requests.post(url, data=data, files=files, timeout=120)
                if response.status_code == 200:
                    video_id = response.json()['id']
                    print(f"      ✅ Video uploaded: {video_id}")
                    return video_id
                else:
                    print(f"      ❌ Upload failed: {response.status_code} - {response.text}")
                    return None
        except Exception as e:
            print(f"      ❌ Upload exception: {str(e)}")
            return None
    
    def upload_thumbnail(self, thumb_path: str) -> str:
        """Upload thumbnail to Meta"""
        try:
            url = f"https://graph.facebook.com/v18.0/{self.ad_account_id}/adimages"
            with open(thumb_path, 'rb') as image_file:
                files = {thumb_path: image_file}
                data = {'access_token': self.fb_access_token}
                response = requests.post(url, data=data, files=files, timeout=60)
                if response.status_code == 200:
                    result = response.json()
                    images = result.get('images', {})
                    if images:
                        first_key = list(images.keys())[0]
                        image_hash = images[first_key]['hash']
                        print(f"      ✅ Thumbnail uploaded: {image_hash}")
                        return image_hash
                else:
                    print(f"      ❌ Thumbnail upload failed: {response.status_code} - {response.text}")
                    return None
        except Exception as e:
            print(f"      ❌ Thumbnail exception: {str(e)}")
            return None
    
    def create_campaign(self, name: str) -> str:
        """Create Meta campaign"""
        url = f"https://graph.facebook.com/v18.0/{self.ad_account_id}/campaigns"
        data = {
            'access_token': self.fb_access_token,
            'name': name,
            'objective': 'OUTCOME_TRAFFIC',
            'status': 'ACTIVE',
            'special_ad_categories': json.dumps([])
        }
        try:
            response = requests.post(url, data=data)
            if response.status_code == 200:
                return response.json()['id']
        except:
            pass
        return None
    
    def create_adset(self, campaign_id: str, name: str) -> str:
        """Create ad set with micro-budget targeting"""
        url = f"https://graph.facebook.com/v18.0/{self.ad_account_id}/adsets"
        
        targeting = {
            'geo_locations': {'countries': ['US']},
            'age_min': 25,
            'age_max': 65,
            'publisher_platforms': ['facebook', 'instagram'],
            'facebook_positions': ['feed'],
            'instagram_positions': ['stream']
        }
        
        data = {
            'access_token': self.fb_access_token,
            'name': name,
            'campaign_id': campaign_id,
            'daily_budget': 500,  # $5/day
            'billing_event': 'IMPRESSIONS',
            'optimization_goal': 'LINK_CLICKS',
            'bid_strategy': 'LOWEST_COST_WITHOUT_CAP',
            'status': 'ACTIVE',
            'targeting': json.dumps(targeting)
        }
        
        try:
            response = requests.post(url, data=data)
            if response.status_code == 200:
                return response.json()['id']
        except:
            pass
        return None
    
    def create_ad_creative(self, video_id: str, image_hash: str, campaign_id: str, headline: str, copy: str) -> str:
        """Create ad creative"""
        url = f"https://graph.facebook.com/v18.0/{self.ad_account_id}/adcreatives"
        
        landing_url = f"https://mikee.ai/lead-gen/?utm_source=facebook&utm_medium=paid_social&utm_campaign={campaign_id}"
        
        object_story_spec = {
            'page_id': self.fb_page_id,
            'video_data': {
                'video_id': video_id,
                'image_hash': image_hash,
                'title': headline,
                'message': copy,
                'call_to_action': {
                    'type': 'LEARN_MORE',
                    'value': {'link': landing_url}
                }
            }
        }
        
        data = {
            'access_token': self.fb_access_token,
            'name': f'Creative - {headline}',
            'object_story_spec': json.dumps(object_story_spec)
        }
        
        try:
            response = requests.post(url, data=data)
            if response.status_code == 200:
                return response.json()['id']
        except:
            pass
        return None
    
    def create_ad(self, adset_id: str, creative_id: str, name: str) -> str:
        """Create ad"""
        url = f"https://graph.facebook.com/v18.0/{self.ad_account_id}/ads"
        data = {
            'access_token': self.fb_access_token,
            'name': name,
            'adset_id': adset_id,
            'creative': json.dumps({'creative_id': creative_id}),
            'status': 'ACTIVE'
        }
        
        try:
            response = requests.post(url, data=data)
            if response.status_code == 200:
                return response.json()['id']
        except:
            pass
        return None
    
    def generate_full_campaign(self, num_variations: int = 5):
        """Generate complete campaign with multiple variations"""
        
        print("\n" + "="*80)
        print("🤖 MASTER META ADS AI AGENT")
        print("="*80)
        print(f"📊 Generating {num_variations} video ad variations")
        print(f"💰 Cost: ${0.14 * num_variations:.2f} total")
        print(f"🎯 Strategy: Micro-budget testing ($5/day per ad set)")
        print("="*80)
        
        # Create main campaign
        timestamp = datetime.now().strftime('%Y%m%d_%H%M')
        campaign_name = f"AI Agent Campaign {timestamp}"
        
        print(f"\n🚀 Creating Campaign: {campaign_name}")
        campaign_id = self.create_campaign(campaign_name)
        if not campaign_id:
            print("❌ Campaign creation failed")
            return
        print(f"   ✅ Campaign ID: {campaign_id}")
        
        results = []
        
        # Generate each variation
        for i, concept in enumerate(self.creative_concepts[:num_variations], 1):
            print(f"\n📹 Variation {i}/{num_variations}: {concept['name']}")
            print(f"   " + "-"*60)
            
            # File paths
            image_path = f"/tmp/image_{i}.jpg"
            video_path = f"/tmp/video_{i}.mp4"
            thumb_path = f"/tmp/thumb_{i}.jpg"
            
            # Generate image
            if not self.generate_image(concept['image_prompt'], image_path):
                continue
            
            # Animate to video
            if not self.animate_image(image_path, concept['motion_prompt'], video_path):
                continue
            
            # Create thumbnail
            print(f"      📸 Creating thumbnail...")
            if not self.create_thumbnail(video_path, thumb_path):
                continue
            print(f"      ✅ Thumbnail created")
            
            # Upload to Meta
            print(f"      📤 Uploading to Meta...")
            video_id = self.upload_video_to_meta(video_path, concept['name'])
            if not video_id:
                continue
            
            image_hash = self.upload_thumbnail(thumb_path)
            if not image_hash:
                continue
            print(f"      ✅ Uploaded (Video: {video_id})")
            
            # Create ad set
            print(f"      🎯 Creating ad set...")
            adset_id = self.create_adset(campaign_id, f"{concept['name']} - Ad Set")
            if not adset_id:
                continue
            print(f"      ✅ Ad Set: {adset_id}")
            
            # Create creative
            print(f"      🎨 Creating creative...")
            creative_id = self.create_ad_creative(
                video_id, image_hash, campaign_id,
                concept['headline'], concept['ad_copy']
            )
            if not creative_id:
                continue
            print(f"      ✅ Creative: {creative_id}")
            
            # Create ad
            print(f"      📢 Creating ad...")
            ad_id = self.create_ad(adset_id, creative_id, f"{concept['name']} - Ad")
            if not ad_id:
                continue
            print(f"      ✅ Ad: {ad_id}")
            
            results.append({
                'concept': concept['name'],
                'campaign_id': campaign_id,
                'adset_id': adset_id,
                'ad_id': ad_id
            })
            
            # Cleanup
            for path in [image_path, video_path, thumb_path]:
                if os.path.exists(path):
                    os.remove(path)
        
        # Summary
        print("\n" + "="*80)
        print("✅ CAMPAIGN GENERATION COMPLETE!")
        print("="*80)
        print(f"\n📊 Results:")
        print(f"   Campaign ID: {campaign_id}")
        print(f"   Variations Created: {len(results)}/{num_variations}")
        print(f"   Total Cost: ${0.14 * len(results):.2f}")
        print(f"   Daily Budget: ${5 * len(results)}/day")
        
        print(f"\n📈 Ads Created:")
        for r in results:
            print(f"   • {r['concept']}: Ad Set {r['adset_id']}, Ad {r['ad_id']}")
        
        print(f"\n🔗 View in Meta Ads Manager:")
        print(f"   https://business.facebook.com/adsmanager/manage/campaigns?act={self.ad_account_id}")
        
        print(f"\n💡 Next Steps:")
        print(f"   1. Monitor performance for 24-48 hours")
        print(f"   2. Pause ads with CTR < 1%")
        print(f"   3. Scale winners to $10-20/day")
        print(f"   4. Generate more variations of top performers")


if __name__ == "__main__":
    agent = MasterMetaAdsAgent()
    
    # Generate 5 variations by default
    num_variations = int(sys.argv[1]) if len(sys.argv) > 1 else 5
    agent.generate_full_campaign(num_variations)

