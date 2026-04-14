'use client';
import { useMemo, useState } from 'react';
import { useMarketingStore } from '@/store/useMarketingStore';
import type { Lead } from '@/types/marketing';

export default function EnrichLeadsView() {
  const { leads, updateLead } = useMarketingStore();
  const [enriching, setEnriching] = useState<string | null>(null);
  const [enrichResults, setEnrichResults] = useState<Record<string, { emails: string[]; linkedinUrl: string }>>({});
  const [filter, setFilter] = useState<'no-email' | 'no-linkedin' | 'all'>('no-email');
  const [bulkEnriching, setBulkEnriching] = useState(false);
  const [search, setSearch] = useState('');

  const needsEnrichment = useMemo(() => {
    return leads.filter((l) => {
      if (l.status === 'converted' || l.status === 'lost' || l.status === 'bounced') return false;
      if (search && !l.company.toLowerCase().includes(search.toLowerCase()) && !l.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === 'no-email') return !l.email;
      if (filter === 'no-linkedin') return l.linkedinStatus === 'none';
      return !l.email || l.linkedinStatus === 'none';
    });
  }, [leads, filter, search]);

  const enrichLead = async (lead: Lead) => {
    setEnriching(lead.id);
    try {
      const res = await fetch('/api/scrape/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, company: lead.company, domain: lead.domain, name: lead.name }),
      });
      const data = await res.json();
      if (data.success) {
        setEnrichResults((prev) => ({ ...prev, [lead.id]: data }));
      }
    } catch {
      // silently fail
    } finally {
      setEnriching(null);
    }
  };

  const bulkEnrich = async () => {
    setBulkEnriching(true);
    for (const lead of needsEnrichment.slice(0, 10)) {
      await enrichLead(lead);
    }
    setBulkEnriching(false);
  };

  const applyEmail = (leadId: string, email: string) => {
    updateLead(leadId, { email, status: 'new', nextAction: 'email1' });
  };

  const skipEnrichment = (leadId: string) => {
    updateLead(leadId, { nextAction: 'linkedin_connect' });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Enrich Leads</h1>
          <p className="text-xs text-zinc-500 mt-1">Find emails and LinkedIn profiles for your leads.</p>
        </div>
        <div className="flex gap-2">
          {needsEnrichment.length > 0 && (
            <button onClick={bulkEnrich} disabled={bulkEnriching}
              className="px-4 py-2 rounded-lg bg-emerald-500 text-xs font-semibold text-black hover:bg-emerald-400 transition-colors disabled:opacity-50">
              {bulkEnriching ? '⏳ Enriching...' : `✨ Enrich ${Math.min(needsEnrichment.length, 10)} Leads`}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        {([['no-email', 'No Email'], ['no-linkedin', 'No LinkedIn'], ['all', 'All Needs Enrichment']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${filter === id ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#141414] text-zinc-500 border border-[#1f1f1f] hover:text-zinc-300'}`}>
            {label}
          </button>
        ))}
        <div className="flex-1" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company or name..."
          className="w-48 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Needs Email</p>
          <p className="text-2xl font-bold text-purple-400">{leads.filter((l) => !l.email && l.status !== 'converted' && l.status !== 'lost' && l.status !== 'bounced').length}</p>
        </div>
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Needs LinkedIn</p>
          <p className="text-2xl font-bold text-sky-400">{leads.filter((l) => l.linkedinStatus === 'none' && l.status !== 'converted' && l.status !== 'lost' && l.status !== 'bounced').length}</p>
        </div>
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Enrichment Rate</p>
          <p className="text-2xl font-bold text-emerald-400">{leads.length > 0 ? ((leads.filter((l) => l.email).length / leads.length) * 100).toFixed(0) : 0}%</p>
        </div>
      </div>

      {/* Lead List */}
      <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto pr-1">
        {needsEnrichment.length === 0 ? (
          <div className="text-center py-16 text-zinc-600">
            <p className="text-2xl mb-2">✨</p>
            <p className="text-sm">All leads are enriched!</p>
            <p className="text-xs text-zinc-700 mt-1">Go to Find Leads to add more.</p>
          </div>
        ) : (
          needsEnrichment.map((lead) => {
            const result = enrichResults[lead.id];
            const isEnriching = enriching === lead.id;

            return (
              <div key={lead.id} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
                      {lead.name ? lead.name.split(' ').map((n) => n[0]).join('') : '??'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{lead.name || 'Unknown Contact'}</p>
                      <p className="text-[11px] text-zinc-500 truncate">{lead.title ? `${lead.title} · ` : ''}{lead.company}{lead.domain ? ` · ${lead.domain}` : ''}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded capitalize">{lead.source.replace(/_/g, ' ')}</span>
                        <span className="text-[9px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">{lead.industry}</span>
                        {lead.location && <span className="text-[9px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">{lead.location}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!lead.email && <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[9px] font-bold text-purple-400">No Email</span>}
                    {lead.linkedinStatus === 'none' && <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-[9px] font-bold text-sky-400">No LinkedIn</span>}
                  </div>
                </div>

                {/* Enrichment Results */}
                {result && (
                  <div className="space-y-2 mb-3">
                    {/* Email patterns */}
                    {result.emails.length > 0 && (
                      <div className="bg-[#0f0f0f] border border-purple-500/15 rounded-lg p-3">
                        <p className="text-[10px] font-bold text-purple-400 mb-2">📧 Likely Emails (click to apply)</p>
                        <div className="space-y-1">
                          {result.emails.map((email, i) => (
                            <button key={i} onClick={() => applyEmail(lead.id, email)}
                              className="w-full flex items-center justify-between px-3 py-1.5 rounded bg-purple-500/5 hover:bg-purple-500/10 transition-colors">
                              <span className="text-xs text-zinc-300">{email}</span>
                              <span className="text-[9px] text-purple-400 font-medium">Apply</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* LinkedIn */}
                    {result.linkedinUrl && (
                      <div className="bg-[#0f0f0f] border border-sky-500/15 rounded-lg p-3">
                        <p className="text-[10px] font-bold text-sky-400 mb-2">💼 LinkedIn Search</p>
                        <a href={result.linkedinUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-sky-300 hover:text-sky-200 transition-colors break-all">
                          {result.linkedinUrl}
                        </a>
                        <button onClick={() => updateLead(lead.id, { linkedinStatus: 'connection_sent' })}
                          className="block mt-2 text-[9px] text-sky-400 hover:text-sky-300 font-medium">
                          → Mark as Connection Sent
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                {!result && (
                  <div className="flex gap-2">
                    <button onClick={() => enrichLead(lead)} disabled={isEnriching}
                      className="flex-1 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-400 hover:bg-purple-500/20 transition-colors disabled:opacity-50">
                      {isEnriching ? '⏳ Enriching...' : '✨ Find Email & LinkedIn'}
                    </button>
                    <button onClick={() => skipEnrichment(lead.id)}
                      className="px-4 py-2 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                      Skip
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
