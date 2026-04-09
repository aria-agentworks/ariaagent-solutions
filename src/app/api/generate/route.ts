import { NextRequest, NextResponse } from 'next/server';

// ─── POST /api/generate — Creative Generation ────────────────────────────
// Uses z-ai-web-dev-sdk (Claude) to research brand and generate 6 ad concepts

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, brandName, style } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // In production, this would call Claude via z-ai-web-dev-sdk
    // For demo, return simulated concepts with generated images
    const concepts = [
      {
        id: 'concept-1',
        hookType: 'SOCIAL PROOF',
        headline: '2,847 businesses switched this month',
        copy: 'Join thousands of companies saving 20+ hours every week with AI-powered ad management. See why industry leaders trust our platform.',
        emotion: 'Trust + FOMO',
        imageUrl: '/generated/concept-1.png',
      },
      {
        id: 'concept-2',
        hookType: 'URGENCY',
        headline: 'Your competitors are already 3 months ahead',
        copy: 'Every day without AI-powered ads costs you potential customers. Start your free trial today and close the gap before it\'s too late.',
        emotion: 'Fear + Urgency',
        imageUrl: '/generated/concept-2.png',
      },
      {
        id: 'concept-3',
        hookType: 'CURIOSITY',
        headline: 'The #1 mistake killing your ad ROI',
        copy: 'Most businesses waste 40% of their ad budget on creative that doesn\'t convert. Our AI identifies winning patterns in minutes, not months.',
        emotion: 'Curiosity + Hope',
        imageUrl: '/generated/concept-3.png',
      },
      {
        id: 'concept-4',
        hookType: 'AUTHORITY',
        headline: 'Trusted by 500+ marketing teams worldwide',
        copy: 'Built by ex-Meta engineers. Used by Fortune 500 companies. Our platform delivers 3x better ROAS than traditional ad management tools.',
        emotion: 'Confidence + Prestige',
        imageUrl: '/generated/concept-4.png',
      },
      {
        id: 'concept-5',
        hookType: 'FOMO',
        headline: 'Early adopters are seeing 5x returns',
        copy: 'Be among the first to harness AI-driven ad optimization. Our beta users report average ROAS improvements of 400% in just 30 days.',
        emotion: 'Excitement + Exclusivity',
        imageUrl: '/generated/concept-5.png',
      },
      {
        id: 'concept-6',
        hookType: 'EMOTIONAL',
        headline: 'Stop wasting money on ads nobody clicks',
        copy: 'You deserve better than 0.5% CTR. Our AI creates ads that people actually want to engage with — because they speak to real human emotions.',
        emotion: 'Frustration + Relief',
        imageUrl: '/generated/concept-6.png',
      },
    ];

    return NextResponse.json({ concepts });
  } catch {
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}

// ─── GET /api/generate — Demo fallback ───────────────────────────────────

export async function GET() {
  const concepts = [
    {
      id: 'concept-1',
      hookType: 'SOCIAL PROOF',
      headline: '2,847 businesses switched this month',
      copy: 'Join thousands of companies saving 20+ hours every week with AI-powered ad management.',
      emotion: 'Trust + FOMO',
      imageUrl: '/generated/concept-1.png',
    },
    {
      id: 'concept-2',
      hookType: 'URGENCY',
      headline: 'Your competitors are already 3 months ahead',
      copy: 'Every day without AI-powered ads costs you potential customers.',
      emotion: 'Fear + Urgency',
      imageUrl: '/generated/concept-2.png',
    },
    {
      id: 'concept-3',
      hookType: 'CURIOSITY',
      headline: 'The #1 mistake killing your ad ROI',
      copy: 'Most businesses waste 40% of their ad budget on creative that doesn\'t convert.',
      emotion: 'Curiosity + Hope',
      imageUrl: '/generated/concept-3.png',
    },
    {
      id: 'concept-4',
      hookType: 'AUTHORITY',
      headline: 'Trusted by 500+ marketing teams worldwide',
      copy: 'Built by ex-Meta engineers. Used by Fortune 500 companies.',
      emotion: 'Confidence + Prestige',
      imageUrl: '/generated/concept-4.png',
    },
    {
      id: 'concept-5',
      hookType: 'FOMO',
      headline: 'Early adopters are seeing 5x returns',
      copy: 'Our beta users report average ROAS improvements of 400% in just 30 days.',
      emotion: 'Excitement + Exclusivity',
      imageUrl: '/generated/concept-5.png',
    },
    {
      id: 'concept-6',
      hookType: 'EMOTIONAL',
      headline: 'Stop wasting money on ads nobody clicks',
      copy: 'Our AI creates ads that people actually want to engage with.',
      emotion: 'Frustration + Relief',
      imageUrl: '/generated/concept-6.png',
    },
  ];

  return NextResponse.json({ concepts });
}
