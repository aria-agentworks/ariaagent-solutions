'use client';
import { useState, useMemo } from 'react';
import { useMarketingStore } from '@/store/useMarketingStore';
import type { Lead, LeadStatus } from '@/types/marketing';

const PIPELINE_STAGES: Array<{ key: LeadStatus; label: string; color: string; bg: string }> = [
  { key: 'new', label: 'New', color: 'text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-500/20' },
  { key: 'enriching', label: 'Enriching', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  { key: 'contacted', label: 'Contacted', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { key: 'replied', label: 'Replied', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  { key: 'interested', label: 'Interested', color: 'text-violet-400', bg: 'bg-violet-400/10 border-violet-400/20' },
  { key: 'converted', label: 'Converted', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
  { key: 'bounced', label: 'Bounced', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
  { key: 'lost', label: 'Lost', color: 'text-red-400/60', bg: 'bg-red-500/5 border-red-500/10' },
];

const NEXT_STATUS: Partial<Record<LeadStatus, LeadStatus>> = {
  new: 'enriching',
  enriching: 'contacted',
  contacted: 'replied',
  replied: 'interested',
  interested: 'converted',
};

export default function PipelineView() {
  const { leads, updateLead, deleteLead, deleteLeads, projects } = useMarketingStore();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('list');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterProduct, setFilterProduct] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (filterStatus !== 'all' && l.status !== filterStatus) return false;
      if (filterSource !== 'all' && l.source !== filterSource) return false;
      if (filterProduct !== 'all' && l.productId !== filterProduct) return false;
      if (search && !l.company.toLowerCase().includes(search.toLowerCase()) && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.email.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [leads, filterStatus, filterSource, filterProduct, search]);

  const kanbanData = useMemo(() => {
    const data: Record<string, Lead[]> = {};
    PIPELINE_STAGES.forEach((stage) => { data[stage.key] = []; });
    filteredLeads.forEach((l) => {
      if (data[l.status]) data[l.status].push(l);
    });
    return data;
  }, [filteredLeads]);

  const advanceLead = (lead: Lead) => {
    const next = NEXT_STATUS[lead.status];
    if (next) {
      updateLead(lead.id, { status: next });
    }
  };

  const markLost = (lead: Lead) => {
    updateLead(lead.id, { status: 'lost' });
  };

  const saveNotes = (leadId: string) => {
    updateLead(leadId, { notes: editNotes });
    setEditingNotes(null);
  };

  const handleDelete = (leadId: string) => {
    if (confirmDelete === leadId) {
      deleteLead(leadId);
      setConfirmDelete(null);
      setExpandedLead(null);
    } else {
      setConfirmDelete(leadId);
      setTimeout(() => setConfirmDelete(null), 4000);
    }
  };

  const handleBulkDelete = () => {
    if (bulkSelected.size > 0) {
      deleteLeads(Array.from(bulkSelected));
      setBulkSelected(new Set());
      setBulkMode(false);
    }
  };

  const toggleBulkSelect = (id: string) => {
    const next = new Set(bulkSelected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setBulkSelected(next);
  };

  const sources = useMemo(() => {
    const set = new Set(leads.map((l) => l.source));
    return Array.from(set);
  }, [leads]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Pipeline</h1>
          <p className="text-xs text-zinc-500 mt-1">Manage all leads through the sales pipeline.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${viewMode === 'list' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#141414] text-zinc-500 border border-[#1f1f1f]'}`}>
            📋 List
          </button>
          <button onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${viewMode === 'kanban' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#141414] text-zinc-500 border border-[#1f1f1f]'}`}>
            📊 Kanban
          </button>
          <button onClick={() => { setBulkMode(!bulkMode); setBulkSelected(new Set()); }}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${bulkMode ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-[#141414] text-zinc-500 border border-[#1f1f1f]'}`}>
            {bulkMode ? '✕ Cancel' : '🗑 Bulk Delete'}
          </button>
          {bulkMode && bulkSelected.size > 0 && (
            <button onClick={handleBulkDelete}
              className="px-3 py-1.5 rounded-lg bg-red-500 text-[11px] font-semibold text-white hover:bg-red-400 transition-colors">
              🗑 Delete {bulkSelected.size}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, company, email..."
          className="w-56 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/40">
          <option value="all">All Statuses</option>
          {PIPELINE_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)}
          className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/40">
          <option value="all">All Sources</option>
          {sources.map((s) => <option key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)}
          className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/40">
          <option value="all">All Products</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <span className="text-[10px] text-zinc-600">{filteredLeads.length} leads</span>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '500px' }}>
          {PIPELINE_STAGES.map((stage) => {
            const stageLeads = kanbanData[stage.key] || [];
            return (
              <div key={stage.key} className="shrink-0 w-64 bg-[#141414] border border-[#1f1f1f] rounded-xl flex flex-col">
                <div className={`p-3 border-b border-[#1f1f1f] flex items-center justify-between`}>
                  <span className={`text-[11px] font-bold ${stage.color}`}>{stage.label}</span>
                  <span className="text-[10px] font-bold text-zinc-500 bg-[#0f0f0f] rounded-full px-2 py-0.5">{stageLeads.length}</span>
                </div>
                <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                  {stageLeads.map((lead) => (
                    <div key={lead.id} className={`bg-[#0f0f0f] border rounded-lg p-3 hover:border-[#2a2a2a] transition-colors ${bulkSelected.has(lead.id) ? 'border-red-500/50 bg-red-500/5' : 'border-[#1f1f1f]'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {bulkMode && (
                          <button onClick={() => toggleBulkSelect(lead.id)}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${bulkSelected.has(lead.id) ? 'border-red-500 bg-red-500' : 'border-zinc-600'}`}>
                            {bulkSelected.has(lead.id) && <span className="text-[8px] text-white font-bold">✓</span>}
                          </button>
                        )}
                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-zinc-400 shrink-0">
                          {lead.name ? lead.name.split(' ').map((n) => n[0]).join('') : '??'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold text-white truncate">{lead.name || 'Unknown'}</p>
                          <p className="text-[9px] text-zinc-500 truncate">{lead.company}</p>
                        </div>
                        <button onClick={() => handleDelete(lead.id)}
                          className={`text-[10px] shrink-0 px-1.5 py-0.5 rounded transition-colors ${confirmDelete === lead.id ? 'bg-red-500 text-white font-bold' : 'text-zinc-600 hover:text-red-400 hover:bg-red-500/10'}`}
                          title="Delete lead">
                          {confirmDelete === lead.id ? 'Sure?' : '✕'}
                        </button>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap mb-2">
                        <span className="text-[8px] text-zinc-600 bg-zinc-800 px-1 py-0.5 rounded capitalize">{lead.source.replace(/_/g, ' ')}</span>
                        {lead.email && <span className="text-[8px] text-emerald-500">📧</span>}
                        {lead.linkedinStatus !== 'none' && <span className="text-[8px] text-sky-500">💼</span>}
                      </div>
                      {NEXT_STATUS[lead.status] && (
                        <button onClick={() => advanceLead(lead)}
                          className="w-full py-1 rounded bg-emerald-500/10 text-[9px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                          → {PIPELINE_STAGES.find((s) => s.key === NEXT_STATUS[lead.status])?.label}
                        </button>
                      )}
                    </div>
                  ))}
                  {stageLeads.length === 0 && (
                    <p className="text-[10px] text-zinc-700 text-center py-4">No leads</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-16 text-zinc-600">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-sm">No leads match your filters.</p>
            </div>
          ) : (
            filteredLeads.map((lead) => {
              const stage = PIPELINE_STAGES.find((s) => s.key === lead.status) || PIPELINE_STAGES[0];
              const product = projects.find((p) => p.id === lead.productId);
              const isExpanded = expandedLead === lead.id;

              return (
                <div key={lead.id} className={`bg-[#141414] border rounded-xl overflow-hidden transition-all ${isExpanded ? 'border-emerald-500/30' : 'border-[#1f1f1f]'} ${bulkSelected.has(lead.id) ? 'ring-1 ring-red-500/50' : ''}`}>
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      {bulkMode && (
                        <button onClick={() => toggleBulkSelect(lead.id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${bulkSelected.has(lead.id) ? 'border-red-500 bg-red-500' : 'border-zinc-600'}`}>
                          {bulkSelected.has(lead.id) && <span className="text-[9px] text-white font-bold">✓</span>}
                        </button>
                      )}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0 cursor-pointer"
                        onClick={() => setExpandedLead(isExpanded ? null : lead.id)}>
                        {lead.name ? lead.name.split(' ').map((n) => n[0]).join('') : '??'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-white truncate">{lead.name || 'Unknown'}</p>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${stage.bg} ${stage.color}`}>{stage.label}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 truncate">{lead.title ? `${lead.title} · ` : ''}{lead.company}{lead.location ? ` · ${lead.location}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {lead.email && <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">📧</span>}
                        {lead.linkedinStatus !== 'none' && <span className="text-[9px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">💼</span>}
                        {product && <span className="text-[9px] text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded">${product.price}</span>}
                        <span className="text-[9px] text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded capitalize">{lead.source.replace(/_/g, ' ')}</span>
                        {NEXT_STATUS[lead.status] && (
                          <button onClick={() => advanceLead(lead)}
                            className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                            → Advance
                          </button>
                        )}
                        <button onClick={() => handleDelete(lead.id)}
                          className={`px-2 py-1 rounded-lg border text-[10px] transition-colors ${
                            confirmDelete === lead.id
                              ? 'bg-red-500 text-white font-bold border-red-500'
                              : 'bg-red-500/5 border-red-500/10 text-red-400/60 hover:text-red-400 hover:bg-red-500/10'
                          }`}>
                          {confirmDelete === lead.id ? 'Delete?' : '🗑'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-[#1f1f1f] pt-3">
                      <div className="grid grid-cols-4 gap-3 mb-3">
                        {[
                          { label: 'Email', value: lead.email || '—', icon: '📧' },
                          { label: 'Phone', value: lead.phone || '—', icon: '📞' },
                          { label: 'Website', value: lead.website || '—', icon: '🔗' },
                          { label: 'Product', value: product?.name || '—', icon: '📦' },
                          { label: 'Domain', value: lead.domain || '—', icon: '🌐' },
                          { label: 'Industry', value: lead.industry || '—', icon: '🏭' },
                          { label: 'Employees', value: lead.employeeCount || '—', icon: '👥' },
                          { label: 'Channel', value: lead.channel, icon: lead.channel === 'email' ? '📧' : '💼' },
                        ].map((field) => (
                          <div key={field.label}>
                            <p className="text-[9px] text-zinc-600 mb-0.5">{field.icon} {field.label}</p>
                            <p className="text-[11px] text-zinc-300 truncate">{field.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Notes */}
                      <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg p-3 mb-3">
                        <p className="text-[10px] font-bold text-zinc-500 mb-1">📝 Notes</p>
                        {editingNotes === lead.id ? (
                          <div className="space-y-2">
                            <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
                              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40 resize-none"
                              rows={2} placeholder="Add notes..." />
                            <div className="flex gap-2">
                              <button onClick={() => saveNotes(lead.id)} className="text-[10px] text-emerald-400 font-medium">Save</button>
                              <button onClick={() => setEditingNotes(null)} className="text-[10px] text-zinc-500">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <p className="text-xs text-zinc-400">{lead.notes || 'No notes yet.'}</p>
                            <button onClick={() => { setEditNotes(lead.id); setEditNotes(lead.notes); }}
                              className="text-[9px] text-zinc-600 hover:text-zinc-400 shrink-0 ml-2">Edit</button>
                          </div>
                        )}
                      </div>

                      {/* Message History */}
                      {lead.messageHistory.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-zinc-500 mb-2">📜 History</p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {lead.messageHistory.map((msg, i) => (
                              <div key={i} className="flex items-start gap-2 bg-[#0f0f0f] rounded-lg px-3 py-2">
                                <span className="text-[9px] text-zinc-600 shrink-0">{new Date(msg.sentAt).toLocaleDateString()}</span>
                                <div className="min-w-0">
                                  <span className={`text-[9px] font-medium ${msg.status === 'replied' ? 'text-emerald-400' : msg.status === 'bounced' ? 'text-red-400' : 'text-zinc-400'}`}>
                                    {msg.type} · {msg.status}
                                  </span>
                                  <p className="text-[10px] text-zinc-500 truncate">{msg.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
