import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const BOB_DIR = process.cwd() + '/bob';
const BRAIN_PORT = 3001;

// ─── POST /api/generate — Creative Generation ────────────────────────────
// Calls real Brain (creative-ad-agent) or returns simulated data

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, brandName, style } = body;
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    const brand = brandName || new URL(url).hostname;

    // Try real Brain server
    try {
      const r = await fetch(`http://localhost:${BRAIN_PORT}/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Create 6 hook-first Instagram ad concepts for ${brand} (${url}). Target cold audience. Use hooks: question, bold claim, pain point, social proof, curiosity, FOMO. Generate images. Return JSON with id (A1-A6), hook, headline, body_copy, image_prompt, target_audience, hook_type.` }),
        signal: AbortSignal.timeout(300_000),
      });
      if (r.ok) {
        const data = await r.json();
        return NextResponse.json({ concepts: getSimulatedConcepts(url, brand), source: 'brain', sessionId: data.sessionId });
      }
    } catch { /* Brain not available, fallback */ }

    // Fallback: check Bob pipeline data
    const conceptsFile = join(BOB_DIR, 'data', 'concepts.json');
    if (existsSync(conceptsFile)) {
      const bobData = JSON.parse(readFileSync(conceptsFile, 'utf-8'));
      if (bobData.concepts?.length > 0) {
        const concepts = bobData.concepts.map((c: any) => ({
          id: c.id, hookType: (c.hook_type || 'curiosity').toUpperCase(),
          headline: c.headline, copy: c.body_copy || c.long_copy || '',
          emotion: c.hook_type || 'curiosity', imageUrl: c.image_url || `/generated/${c.id}.png`,
          hook: c.hook, targetAudience: c.target_audience, status: c.status,
        }));
        return NextResponse.json({ concepts, source: 'bob' });
      }
    }

    return NextResponse.json({ concepts: getSimulatedConcepts(url, brand), source: 'simulated' });
  } catch {
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}

// ─── GET /api/generate ───────────────────────────────────────────────────

export async function GET() {
  const conceptsFile = join(BOB_DIR, 'data', 'concepts.json');
  if (existsSync(conceptsFile)) {
    try {
      const bobData = JSON.parse(readFileSync(conceptsFile, 'utf-8'));
      if (bobData.concepts?.length > 0) {
        return NextResponse.json({ concepts: bobData.concepts, source: 'bob' });
      }
    } catch { /* ignore */ }
  }
  return NextResponse.json({ concepts: getSimulatedConcepts('https://example.com', 'Brand'), source: 'simulated' });
}

function getSimulatedConcepts(url: string, brand: string) {
  return [
    { id:'A1', hookType:'SOCIAL PROOF', headline:'2,847 businesses switched this month', copy:'Join thousands saving 20+ hours/week with AI-powered ad management.', emotion:'Trust+FOMO', imageUrl:'/generated/concept-1.png' },
    { id:'A2', hookType:'URGENCY', headline:'Your competitors are already 3 months ahead', copy:'Every day without AI ads costs you customers. Start today.', emotion:'Fear+Urgency', imageUrl:'/generated/concept-2.png' },
    { id:'B1', hookType:'CURIOSITY', headline:'The #1 mistake killing your ad ROI', copy:'Most businesses waste 40% of ad budget on creative that doesn\'t convert.', emotion:'Curiosity+Hope', imageUrl:'/generated/concept-3.png' },
    { id:'B2', hookType:'AUTHORITY', headline:'Trusted by 500+ marketing teams worldwide', copy:'Built by ex-Meta engineers. Used by Fortune 500 companies. 3x better ROAS.', emotion:'Confidence+Prestige', imageUrl:'/generated/concept-4.png' },
    { id:'C1', hookType:'FOMO', headline:'Early adopters are seeing 5x returns', copy:'Beta users report 400% ROAS improvement in just 30 days.', emotion:'Excitement+Exclusivity', imageUrl:'/generated/concept-5.png' },
    { id:'C2', hookType:'EMOTIONAL', headline:'Stop wasting money on ads nobody clicks', copy:'Our AI creates ads people actually want to engage with.', emotion:'Frustration+Relief', imageUrl:'/generated/concept-6.png' },
  ];
}
