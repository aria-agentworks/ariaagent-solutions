'use client';
import { useState, useMemo } from 'react';
import { useMarketingStore } from '@/store/useMarketingStore';
import type { Lead } from '@/types/marketing';

type OutreachTab = 'email' | 'linkedin' | 'bulk';

export default function OutreachView() {
  const { leads, projects, emailSequences, updateLead } = useMarketingStore();
  const [activeTab, setActiveTab] = useState<OutreachTab>('email');
  const [selectedProduct, setSelectedProduct] = useState(projects[0]?.id || '');
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatedMessages, setGeneratedMessages] = useState<Record<string, { subject: string; body: string }>>({});
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [bulkGenerating, setBulkGenerating] = useState(false);

  // LinkedIn state
  const [liGenerating, setLiGenerating] = useState<string | null>(null);
  const [liMessages, setLiMessages] = useState<Record<string, { connect: string; followup: string }>>({});

  const activeLeads = useMemo(() => {
    return leads.filter((l) => {
      if (l.status === 'converted' || l.status === 'lost' || l.status === 'bounced') return false;
      if (!l.email) return false;
      return true;
    });
  }, [leads]);

  const linkedinLeads = useMemo(() => {
    return leads.filter((l) => {
      if (l.status === 'converted' || l.status === 'lost' || l.status === 'bounced') return false;
      return true;
    });
  }, [leads]);

  const product = projects.find((p) => p.id === selectedProduct);
  const sequence = emailSequences.find((s) => s.productId === selectedProduct);

  // Generate email for a single lead
  const generateEmail = async (lead: Lead, step: number) => {
    setGenerating(lead.id);
    try {
      const res = await fetch('/api/outreach/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead, product, step }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedMessages((prev) => ({ ...prev, [`${lead.id}-${step}`]: data }));
      }
    } catch {
      // silent fail
    } finally {
      setGenerating(null);
    }
  };

  // Generate LinkedIn message
  const generateLinkedin = async (lead: Lead) => {
    setLiGenerating(lead.id);
    try {
      const res = await fetch('/api/linkedin/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: lead.company, domain: lead.domain, industry: lead.industry,
          employeeCount: lead.employeeCount, leadTitle: lead.title,
          productName: product?.name, productUrl: product?.url, productPrice: String(product?.price),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLiMessages((prev) => ({ ...prev, [lead.id]: data.messages }));
      }
    } catch {
      // silent fail
    } finally {
      setLiGenerating(null);
    }
  };

  const markEmailSent = (lead: Lead, step: number) => {
    const msgKey = `${lead.id}-${step}`;
    const msg = generatedMessages[msgKey];
    const history = [...lead.messageHistory, {
      type: 'email', channel: 'email', content: msg?.body || '',
      sentAt: new Date().toISOString(), status: 'sent',
    }];
    updateLead(lead.id, {
      emailSequenceStep: step,
      status: step === 1 ? 'contacted' : lead.status,
      lastContactedAt: new Date().toISOString(),
      nextAction: step === 1 ? 'email2' : step === 2 ? 'email3' : 'close',
      nextActionDate: new Date(Date.now() + (sequence?.steps[step]?.delayDays || 3) * 86400000).toISOString(),
      messageHistory: history,
    });
  };

  const markLinkedinSent = (lead: Lead, type: 'connect' | 'dm') => {
    const msg = liMessages[lead.id];
    const history = [...lead.messageHistory, {
      type: type === 'connect' ? 'linkedin_connect' : 'linkedin_dm',
      channel: 'linkedin', content: type === 'connect' ? msg?.connect || '' : msg?.followup || '',
      sentAt: new Date().toISOString(), status: 'sent',
    }];
    updateLead(lead.id, {
      linkedinStatus: type === 'connect' ? 'connection_sent' : 'dm_sent',
      lastContactedAt: new Date().toISOString(),
      nextAction: type === 'connect' ? 'linkedin_dm' : 'followup',
      nextActionDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      messageHistory: history,
    });
  };

  const copy = (text: string) => navigator.clipboard.writeText(text);

  // Bulk generate emails
  const bulkGenerateEmails = async () => {
    setBulkGenerating(true);
    const targets = activeLeads.filter((l) => selectedLeads.has(l.id));
    for (const lead of targets) {
      await generateEmail(lead, 1);
    }
    setBulkGenerating(false);
  };

  const toggleLeadSelection = (id: string) => {
    const next = new Set(selectedLeads);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLeads(next);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Outreach</h1>
          <p className="text-xs text-zinc-500 mt-1">AI-powered email sequences and LinkedIn outreach.</p>
        </div>
        <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}
          className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/40">
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([['email', '📧 Email Sequences'], ['linkedin', '💼 LinkedIn'], ['bulk', '⚡ Bulk Actions']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === id ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#141414] text-zinc-500 border border-[#1f1f1f] hover:text-zinc-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Sequence preview */}
      {sequence && activeTab === 'email' && (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
          <h3 className="text-xs font-semibold text-white mb-3">Email Sequence: {sequence.name}</h3>
          <div className="flex gap-3">
            {sequence.steps.map((step) => (
              <div key={step.step} className="flex-1 bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-emerald-400">Step {step.step}</span>
                  <span className="text-[9px] text-zinc-600">+{step.delayDays}d</span>
                </div>
                <p className="text-[10px] text-zinc-400">{step.subject}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email Tab */}
      {activeTab === 'email' && (
        <div className="space-y-2 max-h-[calc(100vh-360px)] overflow-y-auto pr-1">
          {activeLeads.length === 0 ? (
            <div className="text-center py-16 text-zinc-600">
              <p className="text-2xl mb-2">📧</p>
              <p className="text-sm">No leads with emails ready for outreach.</p>
              <p className="text-xs text-zinc-700 mt-1">Add leads and enrich their emails first.</p>
            </div>
          ) : (
            activeLeads.map((lead) => {
              const currentStep = lead.emailSequenceStep || 0;
              const nextStep = currentStep + 1;
              const msgKey = `${lead.id}-${nextStep}`;
              const msg = generatedMessages[msgKey];
              const isGenerating = generating === lead.id;

              return (
                <div key={lead.id} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">
                        {lead.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{lead.name}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{lead.title} at {lead.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">Step {currentStep}/3</span>
                      <span className="text-[9px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">{lead.email}</span>
                    </div>
                  </div>

                  {/* Generated message */}
                  {msg ? (
                    <div className="bg-[#0f0f0f] border border-emerald-500/15 rounded-lg p-3 mb-3">
                      <p className="text-[10px] font-bold text-emerald-400 mb-1">Subject: {msg.subject}</p>
                      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                      <div className="flex justify-end mt-2 gap-3">
                        <button onClick={() => copy(msg.body)} className="text-[10px] text-zinc-500 hover:text-white font-medium">📋 Copy</button>
                        <button onClick={() => { copy(msg.body); markEmailSent(lead, nextStep); }}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium">✓ Copy &amp; Mark Sent</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => generateEmail(lead, nextStep)} disabled={isGenerating || !product}
                      className="w-full py-2.5 rounded-lg border border-dashed border-[#2a2a2a] text-xs text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors mb-3 disabled:opacity-50">
                      {isGenerating ? '⚡ Generating...' : `⚡ Generate Email ${nextStep} of 3`}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* LinkedIn Tab */}
      {activeTab === 'linkedin' && (
        <div className="space-y-2 max-h-[calc(100vh-360px)] overflow-y-auto pr-1">
          {linkedinLeads.slice(0, 20).map((lead) => {
            const liMsg = liMessages[lead.id];
            const isLiGen = liGenerating === lead.id;

            return (
              <div key={lead.id} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">
                      {lead.name ? lead.name.split(' ').map((n) => n[0]).join('') : '??'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{lead.name || 'Unknown'}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{lead.title} at {lead.company}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    lead.linkedinStatus === 'none' ? 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20' :
                    lead.linkedinStatus === 'connection_sent' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                    lead.linkedinStatus === 'connected' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' :
                    lead.linkedinStatus === 'dm_sent' ? 'text-sky-400 bg-sky-400/10 border-sky-400/20' :
                    'text-green-400 bg-green-400/10 border-green-400/20'
                  }`}>{lead.linkedinStatus.replace(/_/g, ' ')}</span>
                </div>

                {liMsg ? (
                  <div className="space-y-2 mb-3">
                    <div className="bg-[#0f0f0f] border border-sky-500/15 rounded-lg p-3">
                      <p className="text-[10px] font-bold text-sky-400 mb-1">💼 Connection Request</p>
                      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{liMsg.connectionRequest}</p>
                      <div className="flex justify-end mt-2 gap-3">
                        <button onClick={() => copy(liMsg.connectionRequest)} className="text-[10px] text-zinc-500 hover:text-white font-medium">📋 Copy</button>
                        {lead.linkedinStatus === 'none' && (
                          <button onClick={() => { copy(liMsg.connectionRequest); markLinkedinSent(lead, 'connect'); }}
                            className="text-[10px] text-sky-400 hover:text-sky-300 font-medium">✓ Mark Sent</button>
                        )}
                      </div>
                    </div>
                    {liMsg.followUp1 && (
                      <div className="bg-[#0f0f0f] border border-sky-500/15 rounded-lg p-3">
                        <p className="text-[10px] font-bold text-sky-400 mb-1">📨 Follow-up DM</p>
                        <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{liMsg.followUp1}</p>
                        <div className="flex justify-end mt-2 gap-3">
                          <button onClick={() => copy(liMsg.followUp1)} className="text-[10px] text-zinc-500 hover:text-white font-medium">📋 Copy</button>
                          {lead.linkedinStatus === 'connected' && (
                            <button onClick={() => { copy(liMsg.followUp1); markLinkedinSent(lead, 'dm'); }}
                              className="text-[10px] text-sky-400 hover:text-sky-300 font-medium">✓ Mark Sent</button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button onClick={() => generateLinkedin(lead)} disabled={isLiGen || !product}
                    className="w-full py-2.5 rounded-lg border border-dashed border-[#2a2a2a] text-xs text-zinc-500 hover:text-sky-400 hover:border-sky-500/30 transition-colors mb-3 disabled:opacity-50">
                    {isLiGen ? '⚡ Generating...' : '⚡ Generate LinkedIn Messages'}
                  </button>
                )}

                {/* LinkedIn search link */}
                <a href={`https://www.linkedin.com/sales/search?keywords=${encodeURIComponent(lead.company)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-[10px] text-zinc-600 hover:text-sky-400 transition-colors">
                  🔗 Search {lead.company} on LinkedIn Sales Navigator →
                </a>
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk Actions Tab */}
      {activeTab === 'bulk' && (
        <div className="space-y-4">
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-2">Bulk Email Generation</h3>
            <p className="text-xs text-zinc-500 mb-4">Select leads and generate personalized first emails for all of them at once.</p>

            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setSelectedLeads(new Set(activeLeads.map((l) => l.id)))}
                className="px-3 py-1.5 rounded-lg bg-[#0f0f0f] text-[10px] text-zinc-500 hover:text-white border border-[#2a2a2a] transition-colors">
                Select All ({activeLeads.length})
              </button>
              <button onClick={() => setSelectedLeads(new Set())}
                className="px-3 py-1.5 rounded-lg bg-[#0f0f0f] text-[10px] text-zinc-500 hover:text-white border border-[#2a2a2a] transition-colors">
                Clear
              </button>
              <span className="text-[10px] text-zinc-600">{selectedLeads.size} selected</span>
              <div className="flex-1" />
              <button onClick={bulkGenerateEmails} disabled={bulkGenerating || selectedLeads.size === 0}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-xs font-semibold text-black hover:bg-emerald-400 transition-colors disabled:opacity-50">
                {bulkGenerating ? '⏳ Generating...' : `⚡ Generate ${selectedLeads.size} Emails`}
              </button>
            </div>

            {/* Selected leads preview */}
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {activeLeads.filter((l) => selectedLeads.has(l.id)).map((lead) => {
                const msgKey = `${lead.id}-1`;
                const hasMsg = !!generatedMessages[msgKey];
                return (
                  <div key={lead.id} className="flex items-center justify-between bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-[11px] text-zinc-300 truncate">{lead.name}</p>
                      <span className="text-[9px] text-zinc-600 truncate">{lead.company}</span>
                    </div>
                    {hasMsg ? <span className="text-[9px] text-emerald-400 font-medium">✓ Ready</span> : <span className="text-[9px] text-zinc-600">Pending...</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Ready to Send</p>
              <p className="text-2xl font-bold text-emerald-400">{Object.keys(generatedMessages).length}</p>
            </div>
            <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Emails Sent Today</p>
              <p className="text-2xl font-bold text-amber-400">{leads.filter((l) => l.lastContactedAt && new Date(l.lastContactedAt).toDateString() === new Date().toDateString()).length}</p>
            </div>
            <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">LinkedIn Pending</p>
              <p className="text-2xl font-bold text-sky-400">{leads.filter((l) => l.linkedinStatus === 'none').length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
