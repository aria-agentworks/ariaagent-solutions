'use client';
import { useMemo } from 'react';
import { useMarketingStore } from '@/store/useMarketingStore';

export default function DashboardView() {
  const { leads, projects, gumroadSales, setView } = useMarketingStore();

  const totalLeads = leads.length;
  const contacted = leads.filter((l) => ['contacted', 'replied', 'interested', 'converted'].includes(l.status)).length;
  const replied = leads.filter((l) => ['replied', 'interested', 'converted'].includes(l.status)).length;
  const converted = leads.filter((l) => l.status === 'converted').length;
  const bounced = leads.filter((l) => l.status === 'bounced').length;

  const totalRevenue = projects.reduce((s, p) => s + p.stats.revenue, 0) + gumroadSales.reduce((s, sale) => s + sale.price, 0);
  const conversionRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : '0.0';

  const pipelineStages = [
    { key: 'new', label: 'Found', count: leads.filter((l) => l.status === 'new').length, color: '#71717a' },
    { key: 'enriching', label: 'Enriching', count: leads.filter((l) => l.status === 'enriching').length, color: '#a78bfa' },
    { key: 'contacted', label: 'Contacted', count: leads.filter((l) => l.status === 'contacted').length, color: '#f59e0b' },
    { key: 'replied', label: 'Replied', count: leads.filter((l) => l.status === 'replied').length, color: '#10b981' },
    { key: 'interested', label: 'Interested', count: leads.filter((l) => l.status === 'interested').length, color: '#8b5cf6' },
    { key: 'converted', label: 'Converted', count: converted, color: '#22c55e' },
  ];

  const maxPipeline = Math.max(...pipelineStages.map((s) => s.count), 1);

  const urgentLeads = useMemo(() => {
    return leads
      .filter((l) => {
        if (l.status === 'converted' || l.status === 'lost' || l.status === 'bounced') return false;
        if (l.nextActionDate && new Date(l.nextActionDate) <= new Date()) return true;
        if (l.nextAction === 'enrich') return true;
        return false;
      })
      .slice(0, 5);
  }, [leads]);

  const needsEnrichment = leads.filter((l) => !l.email && l.status !== 'converted' && l.status !== 'lost' && l.status !== 'bounced').length;
  const emailStep1 = leads.filter((l) => l.nextAction === 'email1').length;
  const linkedinPending = leads.filter((l) => l.linkedinStatus === 'none' && l.status !== 'converted' && l.status !== 'lost' && l.status !== 'bounced').length;

  const sourceCounts = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach((l) => { map[l.source] = (map[l.source] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  const recentActivity = useMemo(() => {
    const all: Array<{ text: string; time: string; icon: string }> = [];
    leads.forEach((l) => {
      l.messageHistory.forEach((m) => {
        all.push({ text: `${m.type === 'reply' ? '↩ Reply from' : '→ Contacted'} ${l.name} at ${l.company}`, time: m.sentAt, icon: m.channel === 'email' ? '📧' : m.channel === 'linkedin' ? '💼' : '📤' });
      });
    });
    all.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return all.slice(0, 6);
  }, [leads]);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-xs text-zinc-500 mt-1">B2B lead generation & direct outreach overview.</p>
        </div>
        <button onClick={() => setView('revenue')}
          className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-[11px] font-medium text-zinc-400 hover:text-white border border-[#2a2a2a] transition-colors">
          🔄 Sync Revenue
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total Leads', value: totalLeads, sub: `${leads.filter((l) => l.status === 'new').length} new`, color: 'text-zinc-100' },
          { label: 'Outreach Sent', value: contacted, sub: `${replied} replies`, color: 'text-amber-400' },
          { label: 'Replies', value: replied, sub: `${leads.filter((l) => l.status === 'interested').length} interested`, color: 'text-emerald-400' },
          { label: 'Conversions', value: converted, sub: `${conversionRate}% rate`, color: 'text-green-400' },
          { label: 'Revenue', value: `$${totalRevenue.toLocaleString()}`, sub: `${gumroadSales.length} Gumroad sales`, color: 'text-emerald-300' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Pipeline Funnel */}
        <div className="col-span-2 bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Pipeline Funnel</h3>
          <div className="flex items-end gap-3 h-36">
            {pipelineStages.map((stage) => {
              const height = Math.max((stage.count / maxPipeline) * 100, 6);
              return (
                <div key={stage.key} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-white">{stage.count}</span>
                  <div
                    className="w-full rounded-t-md transition-all duration-500"
                    style={{ height: `${height}%`, minHeight: '8px', backgroundColor: stage.color }}
                  />
                  <span className="text-[9px] text-zinc-500 text-center leading-tight">{stage.label}</span>
                </div>
              );
            })}
          </div>
          {bounced > 0 && (
            <p className="text-[10px] text-red-400 mt-3">⚠ {bounced} email{bounced > 1 ? 's' : ''} bounced — review in Pipeline</p>
          )}
        </div>

        {/* Urgent Actions */}
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Urgent Actions</h3>
          <div className="space-y-2 mb-4">
            <button onClick={() => setView('enrich')} className="w-full flex items-center justify-between bg-purple-500/5 border border-purple-500/20 rounded-lg px-3 py-2 hover:bg-purple-500/10 transition-colors">
              <span className="text-[11px] text-purple-300">✨ Needs Enrichment</span>
              <span className="text-[11px] font-bold text-purple-400">{needsEnrichment}</span>
            </button>
            <button onClick={() => setView('outreach')} className="w-full flex items-center justify-between bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2 hover:bg-amber-500/10 transition-colors">
              <span className="text-[11px] text-amber-300">📧 First Email Pending</span>
              <span className="text-[11px] font-bold text-amber-400">{emailStep1}</span>
            </button>
            <button onClick={() => setView('outreach')} className="w-full flex items-center justify-between bg-sky-500/5 border border-sky-500/20 rounded-lg px-3 py-2 hover:bg-sky-500/10 transition-colors">
              <span className="text-[11px] text-sky-300">💼 LinkedIn Pending</span>
              <span className="text-[11px] font-bold text-sky-400">{linkedinPending}</span>
            </button>
          </div>
          {urgentLeads.length > 0 && (
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {urgentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center gap-2 bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[9px] font-bold text-zinc-400 shrink-0">
                    {lead.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium text-zinc-300 truncate">{lead.name}</p>
                    <p className="text-[9px] text-zinc-600 truncate">{lead.nextAction ? lead.nextAction.replace(/_/g, ' ') : '—'} · {lead.company}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Lead Sources */}
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Lead Sources</h3>
          <div className="space-y-3">
            {sourceCounts.map(([source, count]) => {
              const pct = ((count / totalLeads) * 100).toFixed(0);
              return (
                <div key={source}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-zinc-400 capitalize">{source.replace(/_/g, ' ')}</span>
                    <span className="text-[11px] font-bold text-zinc-300">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0f0f0f] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Product Targeting */}
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Products → Leads</h3>
          <div className="space-y-2">
            {projects.map((p) => {
              const leadCount = leads.filter((l) => l.productId === p.id).length;
              return (
                <div key={p.id} className="flex items-center justify-between bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-zinc-300 truncate">{p.name}</p>
                    <p className="text-[9px] text-zinc-600">${p.price}</p>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 shrink-0 ml-2">{leadCount}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.length > 0 ? recentActivity.map((act, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="text-xs mt-0.5">{act.icon}</span>
                <div className="min-w-0">
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{act.text}</p>
                  <p className="text-[9px] text-zinc-700 mt-0.5">{new Date(act.time).toLocaleDateString()}</p>
                </div>
              </div>
            )) : (
              <p className="text-xs text-zinc-600 text-center py-4">No activity yet. Start by finding leads!</p>
            )}
          </div>
        </div>
      </div>

      {/* Empty state when no leads */}
      {totalLeads === 0 && (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-10 text-center">
          <p className="text-3xl mb-3">🔍</p>
          <h3 className="text-base font-semibold text-white mb-2">No leads yet — let's find some real ones</h3>
          <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">
            Search companies on Google Maps (US & Europe), import from Expleo via CSV, or add leads manually.
            All demo data has been removed.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setView('find-leads')}
              className="px-5 py-2.5 rounded-lg bg-emerald-500 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors">
              🔍 Find Leads
            </button>
            <button onClick={() => setView('revenue')}
              className="px-5 py-2.5 rounded-lg bg-[#1a1a1a] text-sm font-medium text-zinc-400 hover:text-white border border-[#2a2a2a] transition-colors">
              📊 Revenue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
