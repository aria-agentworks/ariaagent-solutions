import { NextRequest, NextResponse } from 'next/server';

// ─── POST /api/deploy — Campaign Deployment ──────────────────────────────
// Simulates Meta Graph API campaign creation

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { concepts, config } = body;

    if (!concepts || concepts.length === 0) {
      return NextResponse.json({ error: 'No concepts provided' }, { status: 400 });
    }

    // Simulate Meta Graph API campaign creation
    const campaignId = `cmp_${Date.now()}_demo`;
    const adSets = ['A', 'B', 'C'].map((letter, setIdx) => {
      const ads = [0, 1, 2].map((_, adIdx) => {
        const conceptIdx = (setIdx * 3 + adIdx) % concepts.length;
        const concept = concepts[conceptIdx];
        return {
          id: `ad_${Date.now()}_${setIdx}_${adIdx}`,
          name: `${concept.hookType} v${adIdx + 1}`,
          conceptId: concept.id,
          status: 'ACTIVE',
          imageUrl: concept.imageUrl,
          headline: concept.headline,
          copy: concept.copy,
        };
      });
      return {
        id: `as_${Date.now()}_${letter}`,
        name: `Ad Set ${letter}`,
        ads,
        status: 'ACTIVE',
        dailyBudget: (config?.dailyBudget || 15) / 3,
      };
    });

    return NextResponse.json({
      campaignId,
      campaignName: config?.name || 'New Campaign',
      status: 'ACTIVE',
      adSets,
      createdAt: new Date().toISOString(),
      dailyBudget: config?.dailyBudget || 15,
    });
  } catch {
    return NextResponse.json({ error: 'Deployment failed' }, { status: 500 });
  }
}
