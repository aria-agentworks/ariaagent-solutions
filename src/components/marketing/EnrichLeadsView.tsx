'use client';
import { useMemo, useState } from 'react';
import { useMarketingStore } from '@/store/useMarketingStore';
import type { Lead } from '@/types/marketing';

export default function EnrichLeadsView() {
  const { leads, updateLead, deleteLead } = useMarketingStore();
  const [enriching, setEnriching] = useState<string | null>(null);
  const [enrichResults, setEnrichResults] = useState<Record<string, {
    contacts: Array<{ name: string; title: string; confidence: string; source: string }>;
    emails: string[];
    linkedinUrl: string;
    companyWebsite: string;
    note: string;
  }>>({});
  const [enrichErrors, setEnrichErrors] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'no-email' | 'no-linkedin' | 'all'>('no-email');
  const [bulkEnriching, setBulkEnriching] = useState(false);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Manual input states
  const [manualEmails, setManualEmails] = useState<Record<string, string>>({});
  const [manualNames, setManualNames] = useState<Record<string, string>>({});
  const [manualTitles, setManualTitles] = useState<Record<string, string>>({});

  const needsEnrichment = useMemo(() => {
    return leads.filter((l) => {
      if (l.status === 'converted' || l.status === 'lost' || l.status === 'bounced') return false;
      if (search && !l.company.toLowerCase().includes(search.toLowerCase()) && !(l.name || '').toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === 'no-email') return !l.email;
      if (filter === 'no-linkedin') return l.linkedinStatus === 'none';
      return !l.email || l.linkedinStatus === 'none';
    });
  }, [leads, filter, search]);

  const enrichLead = async (lead: Lead) => {
    setEnriching(lead.id);
    setEnrichErrors((prev) => ({ ...prev, [lead.id]: '' }));
    try {
      const res = await fetch('/api/scrape/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          company: lead.company,
          domain: lead.domain,
          name: lead.name || manualNames[lead.id] || '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEnrichResults((prev) => ({ ...prev, [lead.id]: data }));
        if ((!data.contacts || data.contacts.length === 0) && (!data.emails || data.emails.length === 0)) {
          setEnrichErrors((prev) => ({ ...prev, [lead.id]: data.note || 'No contacts or emails found. Enter a name manually and try again.' }));
        }
      } else {
        setEnrichErrors((prev) => ({ ...prev, [lead.id]: data.error || 'Enrichment failed' }));
      }
    } catch (err) {
      setEnrichErrors((prev) => ({ ...prev, [lead.id]: 'Network error — could not reach enrichment API' }));
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

  const applyManualEmail = (leadId: string) => {
    const email = manualEmails[leadId];
    if (email && email.includes('@')) {
      applyEmail(leadId, email);
      setManualEmails((prev) => ({ ...prev, [leadId]: '' }));
    }
  };

  const applyContact = (leadId: string, contactName: string, contactTitle: string) => {
    updateLead(leadId, { name: contactName, title: contactTitle || 'Decision Maker', nextAction: 'enrich' });
    // Clear enrichment results so user can re-enrich with the new name for emails
    setEnrichResults((prev) => { const next = { ...prev }; delete next[leadId]; return next; });
  };

  const applyManualName = (leadId: string) => {
    const name = manualNames[leadId];
    const title = manualTitles[leadId] || '';
    if (name && name.includes(' ')) {
      updateLead(leadId, { name, title });
      setEnrichResults((prev) => { const next = { ...prev }; delete next[leadId]; return next; });
      setEnrichErrors((prev) => { const next = { ...prev }; delete next[leadId]; return next; });
    }
  };

  const handleDelete = (leadId: string) => {
    if (confirmDelete === leadId) {
      deleteLead(leadId);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(leadId);
      setTimeout(() => setConfirmDelete(null), 4000);
    }
  };

  const totalLeads = leads.length;
  const noEmail = leads.filter((l) => !l.email && l.status !== 'converted' && l.status !== 'lost' && l.status !== 'bounced').length;
  const noLinkedin = leads.filter((l) => l.linkedinStatus === 'none' && l.status !== 'converted' && l.status !== 'lost' && l.status !== 'bounced').length;
  const enrichRate = totalLeads > 0 ? (((totalLeads - noEmail) / totalLeads) * 100).toFixed(0) : '0';

  const confidenceColor = (c: string) => {
    if (c === 'high') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (c === 'medium') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Enrich Leads</h1>
          <p className="text-xs text-zinc-500 mt-1">Find real contact names, emails, and LinkedIn profiles using AI web search.</p>
        </div>
        <div className="flex gap-2">
          {needsEnrichment.length > 0 && (
            <button onClick={bulkEnrich} disabled={bulkEnriching}
              className="px-4 py-2 rounded-lg bg-emerald-500 text-xs font-semibold text-black hover:bg-emerald-400 transition-colors disabled:opacity-50">
              {bulkEnriching ? '⏳ Enriching...' : `✨ Bulk Enrich (up to ${Math.min(needsEnrichment.length, 10)})`}
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
          <p className="text-2xl font-bold text-purple-400">{noEmail}</p>
        </div>
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Needs LinkedIn</p>
          <p className="text-2xl font-bold text-sky-400">{noLinkedin}</p>
        </div>
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Enrichment Rate</p>
          <p className="text-2xl font-bold text-emerald-400">{enrichRate}%</p>
        </div>
      </div>

      {/* Lead List */}
      <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto pr-1">
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
            const error = enrichErrors[lead.id];

            return (
              <div key={lead.id} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
                      {lead.name ? lead.name.split(' ').map((n) => n[0]).join('') : '??'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">{lead.name || 'Unknown Contact'}</p>
                        {!lead.name && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold">NO NAME</span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate">{lead.title ? `${lead.title} at ` : ''}{lead.company}{lead.domain ? ` · ${lead.domain}` : ''}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded capitalize">{lead.source.replace(/_/g, ' ')}</span>
                        {lead.industry && <span className="text-[9px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">{lead.industry}</span>}
                        {lead.location && <span className="text-[9px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">{lead.location}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!lead.email && <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[9px] font-bold text-purple-400">No Email</span>}
                    {lead.linkedinStatus === 'none' && <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-[9px] font-bold text-sky-400">No LinkedIn</span>}
                    <button onClick={() => handleDelete(lead.id)}
                      className={`px-2 py-0.5 rounded-lg border text-[10px] transition-colors ${
                        confirmDelete === lead.id
                          ? 'bg-red-500 text-white font-bold border-red-500'
                          : 'bg-red-500/5 border-red-500/10 text-red-400/60 hover:text-red-400 hover:bg-red-500/10'
                      }`}
                      title="Delete lead">
                      {confirmDelete === lead.id ? 'Delete?' : '🗑'}
                    </button>
                  </div>
                </div>

                {/* Manual name + title input (if no name) */}
                {!lead.name && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 mb-3">
                    <p className="text-[10px] font-bold text-amber-400 mb-2">⚠️ Contact name required for email generation</p>
                    <div className="flex gap-2">
                      <input
                        value={manualNames[lead.id] || ''}
                        onChange={(e) => setManualNames((prev) => ({ ...prev, [lead.id]: e.target.value }))}
                        placeholder="Full name (e.g. Sarah Chen)"
                        className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/40"
                      />
                      <input
                        value={manualTitles[lead.id] || ''}
                        onChange={(e) => setManualTitles((prev) => ({ ...prev, [lead.id]: e.target.value }))}
                        placeholder="Title (e.g. CFO)"
                        className="w-36 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/40"
                      />
                      <button
                        onClick={() => applyManualName(lead.id)}
                        disabled={!manualNames[lead.id] || !manualNames[lead.id].includes(' ')}
                        className="px-4 py-2 rounded-lg bg-amber-500 text-xs font-semibold text-black hover:bg-amber-400 transition-colors disabled:opacity-50 shrink-0">
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* Manual email input — always available when no email */}
                {!lead.email && (
                  <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-3 mb-3">
                    <p className="text-[10px] font-bold text-zinc-400 mb-2">📧 Enter email manually (if you know it)</p>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={manualEmails[lead.id] || ''}
                        onChange={(e) => setManualEmails((prev) => ({ ...prev, [lead.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && applyManualEmail(lead.id)}
                        placeholder="e.g. john.smith@company.com"
                        className="flex-1 bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40"
                      />
                      <button
                        onClick={() => applyManualEmail(lead.id)}
                        disabled={!manualEmails[lead.id] || !manualEmails[lead.id].includes('@')}
                        className="px-4 py-2 rounded-lg bg-emerald-500 text-xs font-semibold text-black hover:bg-emerald-400 transition-colors disabled:opacity-50 shrink-0">
                        Apply
                      </button>
                    </div>
                  </div>
                )}

                {/* Enrichment Results */}
                {result && (
                  <div className="space-y-3 mb-3">
                    {/* Found contacts (when no name was provided) */}
                    {result.contacts && result.contacts.length > 0 && (
                      <div className="bg-[#0f0f0f] border border-emerald-500/15 rounded-lg p-3">
                        <p className="text-[10px] font-bold text-emerald-400 mb-2">👤 Found {result.contacts.length} Contact(s) — click to apply</p>
                        <div className="space-y-1.5">
                          {result.contacts.map((contact, i) => (
                            <button key={i} onClick={() => applyContact(lead.id, contact.name, contact.title)}
                              className="w-full flex items-center justify-between px-3 py-2 rounded bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors text-left">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-white">{contact.name}</span>
                                  <span className={`text-[8px] px-1.5 py-0.5 rounded border font-bold ${confidenceColor(contact.confidence)}`}>
                                    {contact.confidence}
                                  </span>
                                </div>
                                <p className="text-[10px] text-zinc-500 truncate">{contact.title}</p>
                              </div>
                              <span className="text-[9px] text-emerald-400 font-medium shrink-0 ml-2">Apply</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Email patterns (when name IS provided) */}
                    {result.emails && result.emails.length > 0 && (
                      <div className="bg-[#0f0f0f] border border-purple-500/15 rounded-lg p-3">
                        <p className="text-[10px] font-bold text-purple-400 mb-2">📧 Email Patterns — click to apply</p>
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
                        <div className="flex gap-3 mt-2">
                          <button onClick={() => updateLead(lead.id, { linkedinStatus: 'connection_sent' })}
                            className="text-[9px] text-sky-400 hover:text-sky-300 font-medium">
                            → Mark Connection Sent
                          </button>
                          <button onClick={() => updateLead(lead.id, { linkedinStatus: 'connected' })}
                            className="text-[9px] text-emerald-400 hover:text-emerald-300 font-medium">
                            → Already Connected
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Info note */}
                    {result.note && (
                      <p className="text-[10px] text-zinc-500 bg-zinc-800/30 rounded-lg px-3 py-2">{result.note}</p>
                    )}
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <p className="text-[10px] text-red-400 mb-3 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2">{error}</p>
                )}

                {/* Actions */}
                {!result && (
                  <div className="flex gap-2">
                    <button onClick={() => enrichLead(lead)} disabled={isEnriching}
                      className="flex-1 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-400 hover:bg-purple-500/20 transition-colors disabled:opacity-50">
                      {isEnriching ? '⏳ Searching...' : lead.name ? '✨ Find Email Patterns' : '🔍 Find Contacts & Emails'}
                    </button>
                    <button onClick={() => skipEnrichment(lead.id)}
                      className="px-4 py-2 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                      Skip
                    </button>
                  </div>
                )}

                {/* Re-enrich button when results shown */}
                {result && (
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setEnrichResults((prev) => { const next = { ...prev }; delete next[lead.id]; return next; });
                      setEnrichErrors((prev) => { const next = { ...prev }; delete next[lead.id]; return next; });
                    }}
                      className="px-4 py-2 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                      ↻ New Search
                    </button>
                    {lead.name && !lead.email && (
                      <button onClick={() => enrichLead(lead)} disabled={isEnriching}
                        className="flex-1 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-400 hover:bg-purple-500/20 transition-colors disabled:opacity-50">
                        {isEnriching ? '⏳ Searching...' : '✨ Generate Email Patterns'}
                      </button>
                    )}
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
