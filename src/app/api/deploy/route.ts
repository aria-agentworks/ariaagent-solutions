import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const BOB_DIR = process.cwd() + '/bob';

// ─── POST /api/deploy — Campaign Deployment ──────────────────────────────
// Reads real deployment data from Bob, falls back to simulation

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { concepts, config } = body;
    if (!concepts?.length) return NextResponse.json({ error: 'No concepts' }, { status: 400 });
    const brand = config?.name || 'Brand';

    // Check for real Bob deployment data
    const deployPath = join(BOB_DIR, 'data', 'deployment.json');
    if (existsSync(deployPath)) {
      try {
        const data = JSON.parse(readFileSync(deployPath, 'utf-8'));
        if (data.ads_deployed > 0) {
          const groups: Record<string, any[]> = {};
          for (const ad of (data.ads || [])) {
            const p = ad.concept_id?.[0] || 'A';
            if (!groups[p]) groups[p] = [];
            groups[p].push(ad);
          }
          const adSets = Object.entries(groups).map(([letter, ads]) => ({
            id: ads[0]?.adset_id || `as_${letter}`, name: `Ad Set ${letter}`,
            ads: ads.map((a: any) => ({ id: a.ad_id, name: a.headline, conceptId: a.concept_id, status: a.status || 'ACTIVE' })),
            status: 'ACTIVE', dailyBudget: 5,
          }));
          return NextResponse.json({
            campaignId: data.campaigns?.A || data.campaign_name, campaignName: data.campaign_name,
            status: 'ACTIVE', adSets, createdAt: data.deployed_at, dailyBudget: data.total_daily_budget, source: 'live',
          });
        }
      } catch { /* parse error, fall through */ }
    }

    // Simulated fallback
    const campaignId = `cmp_${Date.now()}_demo`;
    const adSets = ['A','B','C'].map((letter, si) => ({
      id: `as_${Date.now()}_${letter}`, name: `Ad Set ${letter}`,
      ads: [0,1,2].map((_, ai) => {
        const ci = (si*3+ai) % concepts.length; const c = concepts[ci];
        return { id:`ad_${Date.now()}_${si}_${ai}`, name:`${c.hookType} v${ai+1}`, conceptId:c.id, status:'ACTIVE', imageUrl:c.imageUrl, headline:c.headline, copy:c.copy };
      }),
      status:'ACTIVE', dailyBudget: (config?.dailyBudget || 15) / 3,
    }));
    return NextResponse.json({ campaignId, campaignName: config?.name || 'New Campaign', status:'ACTIVE', adSets, createdAt: new Date().toISOString(), dailyBudget: config?.dailyBudget || 15, source:'simulated' });
  } catch {
    return NextResponse.json({ error: 'Deployment failed' }, { status: 500 });
  }
}
