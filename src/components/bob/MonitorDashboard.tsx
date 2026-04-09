'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useBobStore } from '@/store/useBobStore';
import { formatCurrency, formatPercent, formatNumber, getHealthColor, delay } from '@/lib/bob-utils';
import SlackButton from './SlackButtons';
import {
  DollarSign,
  MousePointerClick,
  Target,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  Activity,
  RefreshCw,
  Clock,
  Zap,
} from 'lucide-react';
import type { Bleeder, Winner, FatigueAlert, DailyBriefing, MonitorMetrics } from '@/types/bob';

// ─── Simulated Data ──────────────────────────────────────────────────

const simMetrics: MonitorMetrics = {
  totalSpend: 147.50,
  avgCTR: 1.8,
  avgCPC: 0.89,
  activeCampaigns: 3,
  totalImpressions: 16584,
  totalClicks: 298,
  totalConversions: 23,
};

const simBleeders: Bleeder[] = [
  { id: 'ad-1', name: 'Time Savings v2', adSetId: 'as_A', spend: 42.30, ctr: 0.6, frequency: 4.2, cpc: 1.42, reason: 'High spend with CTR below 1%' },
  { id: 'ad-3', name: 'Easy Setup v1', adSetId: 'as_B', spend: 28.10, ctr: 0.8, frequency: 3.8, cpc: 1.15, reason: 'CTR declining for 3 consecutive days' },
  { id: 'ad-7', name: 'Social Proof v3', adSetId: 'as_C', spend: 19.50, ctr: 0.4, frequency: 5.1, cpc: 1.65, reason: 'Frequency too high, audience exhausted' },
];

const simWinners: Winner[] = [
  { id: 'ad-2', name: 'Cost Savings v1', adSetId: 'as_A', spend: 35.20, ctr: 3.2, cpc: 0.45, clicks: 78, conversions: 12, recommendation: 'Scale budget by 30%' },
  { id: 'ad-5', name: 'Automation v2', adSetId: 'as_B', spend: 22.80, ctr: 2.8, cpc: 0.52, clicks: 44, conversions: 6, recommendation: 'Expand to lookalike audiences' },
  { id: 'ad-8', name: 'Authority v1', adSetId: 'as_C', spend: 18.90, ctr: 2.4, cpc: 0.58, clicks: 33, conversions: 3, recommendation: 'Test new creative variations' },
];

const simFatigue: FatigueAlert[] = [
  { id: 'fat-1', adName: 'Time Savings v2', ctrTrend: 'DECLINING', frequency: 4.2, daysRunning: 14, recommendation: 'Rotate creative immediately' },
  { id: 'fat-2', adName: 'Easy Setup v1', ctrTrend: 'DECLINING', frequency: 3.8, daysRunning: 11, recommendation: 'Consider pausing and testing new angle' },
];

const simBriefing: DailyBriefing = {
  date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
  summary: 'Overall campaign health is GOOD. 3 winners identified for scaling. 3 bleeders need attention. Budget pacing is on track.',
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

export default function MonitorDashboard() {
  const {
    metrics, setMetrics,
    alerts, setAlerts,
    dailyBriefing, setDailyBriefing,
    isMonitoring, setIsMonitoring,
    addTerminalLine,
  } = useBobStore();

  const [bleeders] = useState<Bleeder[]>(simBleeders);
  const [winners] = useState<Winner[]>(simWinners);
  const [fatigue] = useState<FatigueAlert[]>(simFatigue);
  const [isLoading, setIsLoading] = useState(false);

  const loadMonitoringData = async () => {
    setIsLoading(true);
    addTerminalLine({ type: 'command', text: 'bob monitor --fetch' });

    try {
      const res = await fetch('/api/monitor');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setAlerts(data.alerts);
        setDailyBriefing(data.briefing);
        setIsMonitoring(true);
        addTerminalLine({ type: 'success', text: '✓ Monitoring data loaded' });
      }
    } catch {
      // Fallback to simulated data
      await delay(500);
      setMetrics(simMetrics);
      setDailyBriefing(simBriefing);
      const simAlerts = [
        {
          id: 'al-1', type: 'BLEEDER' as const, severity: 'critical' as const,
          title: 'Bleeder Detected: Time Savings v2',
          message: 'CTR dropped to 0.6% with $42.30 spend. Consider pausing.',
          timestamp: new Date().toISOString(), adId: 'ad-1', actionRequired: true,
        },
        {
          id: 'al-2', type: 'WINNER' as const, severity: 'success' as const,
          title: 'Winner Found: Cost Savings v1',
          message: 'CTR at 3.2% with $0.45 CPC. Scale budget by 30%.',
          timestamp: new Date().toISOString(), adId: 'ad-2', actionRequired: true,
        },
        {
          id: 'al-3', type: 'FATIGUE' as const, severity: 'warning' as const,
          title: 'Creative Fatigue: Time Savings v2',
          message: 'Frequency at 4.2 after 14 days. Rotate creative.',
          timestamp: new Date().toISOString(), adId: 'ad-1', actionRequired: true,
        },
        {
          id: 'al-4', type: 'BUDGET' as const, severity: 'info' as const,
          title: 'Spend Pacing On Track',
          message: 'Campaign spend is within 5% of daily target.',
          timestamp: new Date().toISOString(), actionRequired: false,
        },
      ];
      setAlerts(simAlerts);
      setIsMonitoring(true);
      addTerminalLine({ type: 'success', text: '✓ Monitoring data loaded (simulated)' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!metrics) {
      loadMonitoringData();
    }
  }, []);

  const currentMetrics = metrics || simMetrics;
  const currentBriefing = dailyBriefing || simBriefing;

  const handleAction = async (adId: string, action: 'pause' | 'resume' | 'scale') => {
    addTerminalLine({ type: 'command', text: `bob action --ad ${adId} --${action}` });
    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId, action }),
      });
      if (res.ok) {
        addTerminalLine({ type: 'success', text: `✓ Ad ${adId} ${action}d successfully` });
      }
    } catch {
      addTerminalLine({ type: 'error', text: `✗ Action failed for ${adId}` });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff6b4a]/10 border border-[#ff6b4a]/30">
            <Activity className="h-5 w-5 text-[#ff6b4a]" />
          </div>
          <div>
            <h2
              className="text-lg font-bold text-[#fafafa] leading-none"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            >
              Monitor + Alert
            </h2>
            <p className="text-xs text-[#888888] mt-0.5">
              Real-time campaign performance & automated alerts
            </p>
          </div>
        </div>
        <button
          onClick={loadMonitoringData}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[11px] text-[#888888] hover:text-[#fafafa] hover:border-[#3a3a3a] transition-all"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Spend', value: formatCurrency(currentMetrics.totalSpend), icon: DollarSign, color: '#ff6b4a' },
          { label: 'Avg CTR', value: formatPercent(currentMetrics.avgCTR), icon: MousePointerClick, color: '#4ade80' },
          { label: 'Avg CPC', value: formatCurrency(currentMetrics.avgCPC), icon: Target, color: '#fbbf24' },
          { label: 'Active Campaigns', value: String(currentMetrics.activeCampaigns), icon: BarChart3, color: '#a78bfa' },
        ].map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="metric-card"
          >
            <div className="flex items-center gap-2 mb-2">
              <metric.icon className="h-4 w-4" style={{ color: metric.color }} />
              <span className="text-[10px] text-[#555555] tracking-wider uppercase">{metric.label}</span>
            </div>
            <p className="text-xl font-bold text-[#fafafa] tabular-nums">{metric.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Impressions', value: formatNumber(currentMetrics.totalImpressions) },
          { label: 'Clicks', value: formatNumber(currentMetrics.totalClicks) },
          { label: 'Conversions', value: formatNumber(currentMetrics.totalConversions) },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border border-[#2a2a2a] bg-[#141414] p-3 text-center">
            <p className="text-[10px] text-[#555555] tracking-wider uppercase mb-1">{m.label}</p>
            <p className="text-sm font-bold text-[#fafafa] tabular-nums">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Daily Briefing */}
      <DailyBriefingPanel briefing={currentBriefing} />

      {/* Bleeders & Winners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bleeders */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="h-4 w-4 text-[#ef4444]" />
            <h3 className="text-sm font-bold text-[#fafafa] tracking-wider uppercase">
              Bleeders
            </h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ef4444]/10 text-[#ef4444]">
              {bleeders.length}
            </span>
          </div>
          <div className="space-y-3">
            {bleeders.map((bleeder) => (
              <div key={bleeder.id} className="alert-card-bleeder rounded-lg border border-[#2a2a2a] bg-[#141414] p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-[#fafafa]">{bleeder.name}</p>
                    <p className="text-[10px] text-[#888888] mt-0.5">{bleeder.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#ef4444] tabular-nums">
                      {formatCurrency(bleeder.spend)}
                    </p>
                    <p className="text-[10px] text-[#555555]">spent</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div>
                    <p className="text-[9px] text-[#555555] tracking-wider uppercase">CTR</p>
                    <p className="text-xs font-bold text-[#ef4444] tabular-nums">{formatPercent(bleeder.ctr)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-[#555555] tracking-wider uppercase">CPC</p>
                    <p className="text-xs font-bold text-[#fbbf24] tabular-nums">{formatCurrency(bleeder.cpc)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-[#555555] tracking-wider uppercase">FREQ</p>
                    <p className="text-xs font-bold text-[#fbbf24] tabular-nums">{bleeder.frequency}</p>
                  </div>
                </div>
                <SlackButton variant="pause" onClick={() => handleAction(bleeder.id, 'pause')}>
                  ⏸ PAUSE
                </SlackButton>
              </div>
            ))}
          </div>
        </div>

        {/* Winners */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-[#4ade80]" />
            <h3 className="text-sm font-bold text-[#fafafa] tracking-wider uppercase">
              Winners
            </h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#4ade80]/10 text-[#4ade80]">
              {winners.length}
            </span>
          </div>
          <div className="space-y-3">
            {winners.map((winner) => (
              <div key={winner.id} className="alert-card-winner rounded-lg border border-[#2a2a2a] bg-[#141414] p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-[#fafafa]">{winner.name}</p>
                    <p className="text-[10px] text-[#4ade80] mt-0.5">{winner.recommendation}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#4ade80] tabular-nums">
                      {formatPercent(winner.ctr)}
                    </p>
                    <p className="text-[10px] text-[#555555]">CTR</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div>
                    <p className="text-[9px] text-[#555555] tracking-wider uppercase">CLICKS</p>
                    <p className="text-xs font-bold text-[#fafafa] tabular-nums">{winner.clicks}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-[#555555] tracking-wider uppercase">CPC</p>
                    <p className="text-xs font-bold text-[#4ade80] tabular-nums">{formatCurrency(winner.cpc)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-[#555555] tracking-wider uppercase">CONV</p>
                    <p className="text-xs font-bold text-[#4ade80] tabular-nums">{winner.conversions}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-[#555555] tracking-wider uppercase">SPEND</p>
                    <p className="text-xs font-bold text-[#888888] tabular-nums">{formatCurrency(winner.spend)}</p>
                  </div>
                </div>
                <SlackButton variant="scale" onClick={() => handleAction(winner.id, 'scale')}>
                  🚀 SCALE
                </SlackButton>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fatigue Detection */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-[#fbbf24]" />
          <h3 className="text-sm font-bold text-[#fafafa] tracking-wider uppercase">
            Creative Fatigue
          </h3>
        </div>
        <div className="space-y-3">
          {fatigue.map((f) => (
            <div key={f.id} className="alert-card-fatigue rounded-lg border border-[#2a2a2a] bg-[#141414] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-bold text-[#fafafa]">{f.adName}</p>
                    <p className="text-[10px] text-[#fbbf24] mt-0.5">{f.recommendation}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-[9px] text-[#555555] tracking-wider uppercase">Trend</p>
                      <span className={`text-xs font-bold ${
                        f.ctrTrend === 'DECLINING' ? 'text-[#ef4444]' : f.ctrTrend === 'INCREASING' ? 'text-[#4ade80]' : 'text-[#fbbf24]'
                      }`}>
                        {f.ctrTrend === 'DECLINING' ? '↘' : f.ctrTrend === 'INCREASING' ? '↗' : '→'} {f.ctrTrend}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-[#555555] tracking-wider uppercase">Freq</p>
                      <p className="text-xs font-bold text-[#fbbf24] tabular-nums">{f.frequency}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-[#555555] tracking-wider uppercase">Days</p>
                      <p className="text-xs font-bold text-[#888888] tabular-nums">{f.daysRunning}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alert Cards (Slack-style) */}
      {alerts.length > 0 && <AlertCards alerts={alerts} onAction={handleAction} />}
    </div>
  );
}

// ─── Daily Briefing Panel ────────────────────────────────────────────

function DailyBriefingPanel({ briefing }: { briefing: DailyBriefing }) {
  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-6">
      <div className="flex items-center gap-3 mb-5">
        <Clock className="h-5 w-5 text-[#ff6b4a]" />
        <div>
          <h3
            className="text-base font-bold text-[#fafafa] leading-none"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            Daily Briefing
          </h3>
          <p className="text-[10px] text-[#555555] mt-0.5">{briefing.date}</p>
        </div>
      </div>

      {/* Health Score + Pacing */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] p-4 text-center">
          <p className="text-[10px] text-[#555555] tracking-wider uppercase mb-2">Health Score</p>
          <p className="text-3xl font-bold tabular-nums" style={{ color: getHealthColor(briefing.healthScore) }}>
            {briefing.healthScore}
          </p>
          <p className="text-[10px] text-[#888888] mt-1">/ 100</p>
        </div>
        <div className="rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] p-4 text-center">
          <p className="text-[10px] text-[#555555] tracking-wider uppercase mb-2">Spend Pacing</p>
          <p className="text-3xl font-bold text-[#ff6b4a] tabular-nums">{briefing.spendPacing}%</p>
          <p className="text-[10px] text-[#888888] mt-1">of daily budget</p>
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-[#888888] leading-relaxed mb-4">{briefing.summary}</p>

      {/* Top Insights */}
      <div className="mb-4">
        <p className="text-[10px] text-[#555555] tracking-widest uppercase mb-2 flex items-center gap-1.5">
          <Zap className="h-3 w-3" /> Top Insights
        </p>
        <ul className="space-y-1.5">
          {briefing.topInsights.map((insight, i) => (
            <li key={i} className="text-xs text-[#888888] flex items-start gap-2">
              <span className="text-[#ff6b4a] shrink-0">→</span>
              {insight}
            </li>
          ))}
        </ul>
      </div>

      {/* Recommended Actions */}
      <div>
        <p className="text-[10px] text-[#555555] tracking-widest uppercase mb-2 flex items-center gap-1.5">
          <Shield className="h-3 w-3" /> Recommended Actions
        </p>
        <div className="space-y-1.5">
          {briefing.recommendedActions.map((action, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-[#888888]">
              <SlackButton variant={i === 0 ? 'scale' : 'pause'}>
                {i === 0 ? 'SCALE' : 'REVIEW'}
              </SlackButton>
              {action}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Alert Cards (Slack-style) ────────────────────────────────────────

function AlertCards({ alerts, onAction }: { alerts: { id: string; type: string; severity: string; title: string; message: string; timestamp: string; adId?: string }[]; onAction: (adId: string, action: string) => void }) {
  if (alerts.length === 0) return null;

  const severityColors: Record<string, { bg: string; border: string; icon: string }> = {
    critical: { bg: 'bg-[#ef4444]/5', border: 'border-[#ef4444]/30', icon: '🔴' },
    warning: { bg: 'bg-[#fbbf24]/5', border: 'border-[#fbbf24]/30', icon: '🟡' },
    info: { bg: 'bg-[#38bdf8]/5', border: 'border-[#38bdf8]/30', icon: '🔵' },
    success: { bg: 'bg-[#4ade80]/5', border: 'border-[#4ade80]/30', icon: '🟢' },
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4 text-[#888888]" />
        <h3 className="text-sm font-bold text-[#fafafa] tracking-wider uppercase">
          Notifications
        </h3>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a2a2a] text-[#888888]">
          {alerts.length}
        </span>
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {alerts.map((alert) => {
          const colors = severityColors[alert.severity] || severityColors.info;
          return (
            <div
              key={alert.id}
              className={`${colors.bg} rounded-lg border ${colors.border} p-3`}
            >
              <div className="flex items-start gap-2">
                <span className="text-sm shrink-0">{colors.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#fafafa]">{alert.title}</p>
                  <p className="text-[11px] text-[#888888] mt-0.5">{alert.message}</p>
                  {alert.adId && (
                    <div className="flex items-center gap-2 mt-2">
                      <SlackButton variant="approve" onClick={() => onAction(alert.adId!, 'resume')}>
                        APPROVE
                      </SlackButton>
                      <SlackButton variant="reject" onClick={() => onAction(alert.adId!, 'pause')}>
                        REJECT
                      </SlackButton>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
