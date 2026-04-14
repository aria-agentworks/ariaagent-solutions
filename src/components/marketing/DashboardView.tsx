'use client';
import { useMemo } from 'react';
import { useMarketingStore } from '@/store/useMarketingStore';
import { getLeadsNeedingAction } from '@/lib/outreach-engine';

const CHANNEL_COLORS: Record<string, { icon: string; color: string; bg: string }> = {
  linkedin: { icon: '💼', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  twitter: { icon: '𝕏', color: 'text-sky-400', bg: 'bg-sky-400/10' },
  reddit: { icon: '🔴', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  email: { icon: '📧', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  discord: { icon: '💬', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  producthunt: { icon: '🚀', color: 'text-orange-500', bg: 'bg-orange-500/10' },
};

export default function DashboardView() {
  const { projects, leads, socialProfiles, autoOutreachEnabled, setView } = useMarketingStore();

  const totalLeads = leads.length;
  const totalMessages = projects.reduce((s, p) => s + p.stats.messagesSent, 0);
  const totalReplies = projects.reduce((s, p) => s + p.stats.replies, 0);
  const totalRevenue = projects.reduce((s, p) => s + p.stats.revenue, 0);
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const converted = leads.filter((l) => l.status === 'converted').length;

  // Automation metrics
  const actionQueue = useMemo(() => {
    if (!autoOutreachEnabled) return null;
    return getLeadsNeedingAction(leads);
  }, [leads, autoOutreachEnabled]);

  const overdueCount = actionQueue?.overdue.length || 0;

  const statusCounts = {
    new: leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    replied: leads.filter((l) => l.status === 'replied').length,
    interested: leads.filter((l) => l.status === 'interested').length,
    converted: leads.filter((l) => l.status === 'converted').length,
  };

  const recentActivity = [
    { text: 'Connection request sent to Sarah Chen at Acme Corp', time: '2 min ago', channel: 'linkedin' },
    { text: 'New reply from Michael Torres at FinEdge Systems', time: '15 min ago', channel: 'linkedin' },
    { text: 'Posted CFO Playbook link on r/CFO', time: '1 hr ago', channel: 'reddit' },
    { text: 'Tweeted Voice AI insights thread', time: '2 hrs ago', channel: 'twitter' },
    { text: 'Added Lisa Chang to pipeline via Product Hunt', time: '3 hrs ago', channel: 'producthunt' },
    { text: 'Discord community update: new member inquiry', time: '4 hrs ago', channel: 'discord' },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-xs text-zinc-500 mt-1">Your marketing command center. Track all projects, leads, and revenue.</p>
        </div>
        {/* Revenue Sync Quick Button */}
        <button onClick={() => setView('revenue')}
          className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-[11px] font-medium text-zinc-400 hover:text-white border border-[#2a2a2a] transition-colors">
          🔄 Sync Revenue
        </button>
      </div>

      {/* Automation Alert */}
      {autoOutreachEnabled && overdueCount > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">🔔</span>
            <div>
              <p className="text-sm font-semibold text-amber-400">
                {overdueCount} lead{overdueCount !== 1 ? 's' : ''} need{overdueCount === 1 ? 's' : ''} follow-up
              </p>
              <p className="text-[11px] text-zinc-500">
                {actionQueue?.needsConnection.length || 0} to connect · {actionQueue?.needsFollowUp.length || 0} follow-ups · {actionQueue?.needsClose.length || 0} to close
              </p>
            </div>
          </div>
          <button onClick={() => setView('outreach')}
            className="px-4 py-2 rounded-lg bg-amber-500 text-xs font-semibold text-black hover:bg-amber-400 transition-colors">
            Go to Outreach →
          </button>
        </div>
      )}

      {/* Automation Status Indicator */}
      {autoOutreachEnabled && overdueCount === 0 && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
          <span className="text-lg">✅</span>
          <p className="text-sm text-emerald-400">All caught up! No pending actions right now.</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Projects', value: activeProjects, sub: `${projects.length} total`, color: 'text-emerald-400' },
          { label: 'Leads', value: totalLeads, sub: `${statusCounts.new} new`, color: 'text-blue-400' },
          { label: 'Messages', value: totalMessages, sub: `${totalReplies} replies`, color: 'text-amber-400' },
          { label: 'Conversions', value: converted, sub: `${statusCounts.interested} interested`, color: 'text-purple-400' },
          { label: 'Revenue', value: `$${totalRevenue}`, sub: 'all time', color: 'text-green-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Pipeline Funnel */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Lead Pipeline</h3>
        <div className="flex items-end gap-2 h-32">
          {Object.entries(statusCounts).map(([status, count]) => {
            const max = Math.max(...Object.values(statusCounts), 1);
            const height = Math.max((count / max) * 100, 8);
            const colors: Record<string, string> = {
              new: 'bg-blue-500', contacted: 'bg-amber-500', replied: 'bg-emerald-500',
              interested: 'bg-purple-500', converted: 'bg-green-500',
            };
            return (
              <div key={status} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-white">{count}</span>
                <div className="w-full rounded-t-md transition-all" style={{ height: `${height}%`, minHeight: '8px', backgroundColor: colors[status] || '#333' }} />
                <span className="text-[9px] text-zinc-500 capitalize">{status}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Active Projects */}
        <div className="col-span-2 bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Active Projects</h3>
          <div className="space-y-2">
            {projects.filter((p) => p.status === 'active').map((project) => (
              <div key={project.id} className="flex items-center gap-3 bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg p-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600/20 to-emerald-900/20 border border-emerald-500/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-emerald-400">${project.price}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{project.name}</p>
                  <p className="text-[10px] text-zinc-600 truncate">{project.description}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {project.channels.slice(0, 4).map((ch) => {
                    const c = CHANNEL_COLORS[ch];
                    return c ? (
                      <span key={ch} className={`w-5 h-5 rounded ${c.bg} flex items-center justify-center`} title={ch}>
                        <span className="text-[9px]">{c.icon}</span>
                      </span>
                    ) : null;
                  })}
                </div>
                <div className="text-right shrink-0 pl-2">
                  <p className="text-[10px] text-zinc-500">{project.stats.leads} leads</p>
                  <p className="text-[10px] text-zinc-600">{project.stats.messagesSent} sent</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity, i) => {
              const ch = CHANNEL_COLORS[activity.channel];
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <span className={`w-5 h-5 rounded ${ch?.bg || 'bg-zinc-800'} flex items-center justify-center shrink-0 mt-0.5`}>
                    <span className="text-[8px]">{ch?.icon || '?'}</span>
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{activity.text}</p>
                    <p className="text-[9px] text-zinc-700 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
