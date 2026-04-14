'use client';
import { useState } from 'react';
import { useMarketingStore } from '@/store/useMarketingStore';

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: 'text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-500/20' },
  contacted: { label: 'Contacted', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
  replied: { label: 'Replied', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  interested: { label: 'Interested', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
  converted: { label: 'Converted', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
  lost: { label: 'Lost', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
};
const CHANNEL_ICONS: Record<string, string> = { linkedin: '💼', twitter: '𝕏', reddit: '🔴', email: '📧', discord: '💬', producthunt: '🚀', manual: '✏️' };

export default function LeadsView() {
  const { leads, projects, updateLead, deleteLead } = useMarketingStore();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = leads.filter((l) => {
    if (filter !== 'all' && l.status !== filter) return false;
    if (search && !`${l.name} ${l.company} ${l.title}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getProjectName = (pid: string) => projects.find((p) => p.id === pid)?.name || 'Unknown';

  const exportCsv = () => {
    const headers = 'Name,Title,Company,Industry,Channel,Project,Status,Notes\n';
    const rows = leads.map((l) => `"${l.name}","${l.title}","${l.company}","${l.industry}","${l.channel}","${getProjectName(l.projectId)}","${l.status}","${l.notes}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'leads.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Leads</h1>
          <p className="text-xs text-zinc-500 mt-1">All leads across projects. {leads.length} total.</p>
        </div>
        <button onClick={exportCsv} className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-[11px] font-medium text-zinc-400 hover:text-white border border-[#2a2a2a] transition-colors">📥 Export CSV</button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'new', 'contacted', 'replied', 'interested', 'converted', 'lost'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${filter === s ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#141414] text-zinc-600 border border-[#1f1f1f] hover:text-zinc-400'}`}>
            {s === 'all' ? `All (${leads.length})` : `${STATUS_CFG[s]?.label || s} (${leads.filter((l) => l.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leads..." className="w-full max-w-sm bg-[#141414] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40" />

      {/* Lead Table */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1f1f1f]">
                {['Name', 'Company', 'Title', 'Channel', 'Project', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-[10px] font-bold text-zinc-600 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => {
                const sc = STATUS_CFG[lead.status];
                return (
                  <tr key={lead.id} className="border-b border-[#1a1a1a] hover:bg-[#0f0f0f] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-white">{lead.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-zinc-400">{lead.company}</p>
                      <p className="text-[10px] text-zinc-600">{lead.industry} · {lead.employeeCount}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{lead.title}</td>
                    <td className="px-4 py-3"><span className="text-xs">{CHANNEL_ICONS[lead.channel]}</span> <span className="text-[10px] text-zinc-500">{lead.channel}</span></td>
                    <td className="px-4 py-3 text-xs text-zinc-500 max-w-[180px] truncate">{getProjectName(lead.projectId)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${sc?.bg || ''} ${sc?.color || ''}`}>{sc?.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteLead(lead.id)} className="text-[10px] text-zinc-600 hover:text-red-400 transition-colors">Remove</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-zinc-600 text-xs">No leads found.</div>
        )}
      </div>
    </div>
  );
}
