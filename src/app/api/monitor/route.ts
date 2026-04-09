import { NextResponse } from 'next/server';

// ─── GET /api/monitor — Monitoring Data ──────────────────────────────────
// Returns simulated daily metrics, bleeders, winners, fatigue data

export async function GET() {
  const metrics = {
    totalSpend: 147.50,
    avgCTR: 1.8,
    avgCPC: 0.89,
    activeCampaigns: 3,
    totalImpressions: 16584,
    totalClicks: 298,
    totalConversions: 23,
  };

  const briefing = {
    date: new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    summary:
      'Overall campaign health is GOOD. 3 winners identified for scaling. 3 bleeders need attention. Budget pacing is on track.',
    topInsights: [
      '"Cost Savings v1" is outperforming all others with 3.2% CTR — consider scaling',
      'Ad Set A is driving 62% of total conversions at lowest CPC',
      'Frequency fatigue detected in 2 ads — creative refresh recommended',
      'Total spend is within 5% of daily target — on pace',
    ],
    recommendedActions: [
      'Scale "Cost Savings v1" budget by 30%',
      'Pause "Social Proof v3" — frequency too high',
      'Create 2 new creative variations for Ad Set B',
      'Review audience targeting for Ad Set C',
    ],
    spendPacing: 47,
    healthScore: 72,
  };

  const alerts = [
    {
      id: 'al-1',
      type: 'BLEEDER',
      severity: 'critical',
      title: 'Bleeder Detected: Time Savings v2',
      message: 'CTR dropped to 0.6% with $42.30 spend. Consider pausing.',
      timestamp: new Date().toISOString(),
      adId: 'ad-1',
      actionRequired: true,
    },
    {
      id: 'al-2',
      type: 'WINNER',
      severity: 'success',
      title: 'Winner Found: Cost Savings v1',
      message: 'CTR at 3.2% with $0.45 CPC. Scale budget by 30%.',
      timestamp: new Date().toISOString(),
      adId: 'ad-2',
      actionRequired: true,
    },
    {
      id: 'al-3',
      type: 'FATIGUE',
      severity: 'warning',
      title: 'Creative Fatigue: Time Savings v2',
      message: 'Frequency at 4.2 after 14 days. Rotate creative.',
      timestamp: new Date().toISOString(),
      adId: 'ad-1',
      actionRequired: true,
    },
    {
      id: 'al-4',
      type: 'BUDGET',
      severity: 'info',
      title: 'Spend Pacing On Track',
      message: 'Campaign spend is within 5% of daily target.',
      timestamp: new Date().toISOString(),
      actionRequired: false,
    },
  ];

  return NextResponse.json({ metrics, briefing, alerts });
}
