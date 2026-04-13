import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const BOB_DIR = process.cwd() + '/bob';

// ─── GET /api/monitor — Monitoring Data ──────────────────────────────────

export async function GET() {
  try {
    const monitorPath = join(BOB_DIR, 'data', 'monitor.json');
    const deployPath = join(BOB_DIR, 'data', 'deployment.json');

    if (existsSync(monitorPath)) {
      const m = JSON.parse(readFileSync(monitorPath, 'utf-8'));
      const alerts = (m.alerts || []).map((a: any, i: number) => ({
        id: `al-${i+1}`, type: a.type?.toUpperCase() || 'INFO',
        severity: a.type==='bleeder'?'critical':a.type==='winner'?'success':'warning',
        title: `${a.type?.charAt(0).toUpperCase()+a.type?.slice(1)}: ${(a.message||'').slice(0,60)}`,
        message: a.message || 'Alert detected', timestamp: m.ran_at || new Date().toISOString(), actionRequired: a.type !== 'info',
      }));
      return NextResponse.json({ metrics: { totalSpend:0, avgCTR:0, avgCPC:0, activeCampaigns: alerts.length > 0 ? 3 : 0 },
        briefing: { date: new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}),
          summary: (m.output||'').split('\\n').slice(0,3).join(' ') || 'Monitor check completed.',
          topInsights: alerts.slice(0,4).map((a:any) => a.message), recommendedActions: [], healthScore: alerts.some((a:any)=>a.type==='bleeder') ? 40 : 75, spendPacing: 50 },
        alerts, source: 'live' });
    }

    if (existsSync(deployPath)) {
      const d = JSON.parse(readFileSync(deployPath, 'utf-8'));
      return NextResponse.json({ metrics: { totalSpend:0, avgCTR:0, avgCPC:0, activeCampaigns: Object.keys(d.campaigns||{}).length, totalAds: d.ads_deployed||0 },
        briefing: { date: new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}),
          summary: `Campaign deployed with ${d.ads_deployed||0} ads. Waiting for performance data...`,
          topInsights: [`"${d.campaign_name}" is active`, `${d.ads_deployed||0} ads running`], recommendedActions: ['Run daily check in 24-48h'], healthScore: 100, spendPacing: 0 },
        alerts: [], source: 'deployed' });
    }
  } catch { /* fall through to simulated */ }

  return NextResponse.json({
    metrics: { totalSpend:147.50, avgCTR:1.8, avgCPC:0.89, activeCampaigns:3, totalImpressions:16584, totalClicks:298, totalConversions:23 },
    briefing: { date: new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}),
      summary: 'Overall campaign health is GOOD. 3 winners for scaling. 3 bleeders need attention. Budget on track.',
      topInsights: ['"Cost Savings v1" outperforming at 3.2% CTR','Ad Set A driving 62% of conversions','Frequency fatigue in 2 ads','Spend within 5% of target'],
      recommendedActions: ['Scale "Cost Savings v1" by 30%','Pause "Social Proof v3"','Create 2 new variants for Set B'], spendPacing: 47, healthScore: 72 },
    alerts: [
      { id:'al-1', type:'BLEEDER', severity:'critical', title:'Bleeder: Time Savings v2', message:'CTR 0.6% with $42.30 spend', timestamp: new Date().toISOString(), adId:'ad-1', actionRequired:true },
      { id:'al-2', type:'WINNER', severity:'success', title:'Winner: Cost Savings v1', message:'CTR 3.2%, $0.45 CPC', timestamp: new Date().toISOString(), adId:'ad-2', actionRequired:true },
      { id:'al-3', type:'FATIGUE', severity:'warning', title:'Fatigue: Time Savings v2', message:'Frequency 4.2 after 14 days', timestamp: new Date().toISOString(), adId:'ad-1', actionRequired:true },
    ], source: 'simulated' });
}
