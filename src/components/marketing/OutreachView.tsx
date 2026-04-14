'use client';
import { useState, useMemo } from 'react';
import { useMarketingStore } from '@/store/useMarketingStore';
import type { Lead } from '@/types/marketing';

type OutreachTab = 'email' | 'linkedin' | 'bulk';

export default function OutreachView() {
  const { leads, projects, updateLead, deleteLead } = useMarketingStore();
  const [activeTab, setActiveTab] = useState<OutreachTab>('email');
  const [selectedProduct, setSelectedProduct] = useState(projects[0]?.id || '');
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatedMessages, setGeneratedMessages] = useState<Record<string, { subject: string; body: string; html: string }>>({});
  const [sending, setSending] = useState<string | null>(null);
  const [sendResults, setSendResults] = useState<Record<string, { success: boolean; provider?: string; error?: string }>>({});
  const [generationErrors, setGenerationErrors] = useState<Record<string, string>>({});
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);
  const [emailConfig, setEmailConfig] = useState<'unconfigured' | 'resend' | 'gmail' | 'checking'>('checking');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // LinkedIn state
  const [liGenerating, setLiGenerating] = useState<string | null>(null);
  const [liMessages, setLiMessages] = useState<Record<string, { connectionRequest: string; followUp1: string; followUp2: string }>>({});
  const [liErrors, setLiErrors] = useState<Record<string, string>>({});

  const product = projects.find((p) => p.id === selectedProduct);

  // Check email config on mount
  useMemo(() => {
    fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: '', subject: '', html: '' }) })
      .then(r => r.json())
      .then(data => {
        if (data.success === false && data.error?.includes('No email provider')) setEmailConfig('unconfigured');
        else if (data.provider === 'resend') setEmailConfig('resend');
        else setEmailConfig('resend'); // Assume configured if no specific error
      })
      .catch(() => setEmailConfig('unconfigured'));
  }, []);

  const activeLeads = useMemo(() => leads.filter((l) => l.status !== 'converted' && l.status !== 'lost' && l.status !== 'bounced' && l.email), [leads]);
  const linkedinLeads = useMemo(() => leads.filter((l) => l.status !== 'converted' && l.status !== 'lost' && l.status !== 'bounced'), [leads]);

  const generateEmail = async (lead: Lead, step: number) => {
    if (!product) {
      setGenerationErrors((prev) => ({ ...prev, [`${lead.id}-${step}`]: 'Select a product first (dropdown at top right)' }));
      return;
    }
    setGenerating(lead.id);
    setGenerationErrors((prev) => ({ ...prev, [`${lead.id}-${step}`]: '' }));
    try {
      const res = await fetch('/api/outreach/generate-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead, product, step }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedMessages((prev) => ({ ...prev, [`${lead.id}-${step}`]: data }));
      } else {
        setGenerationErrors((prev) => ({ ...prev, [`${lead.id}-${step}`]: data.error || 'Failed to generate email' }));
      }
    } catch {
      setGenerationErrors((prev) => ({ ...prev, [`${lead.id}-${step}`]: 'Network error — could not reach API' }));
    } finally { setGenerating(null); }
  };

  const generateLinkedin = async (lead: Lead) => {
    if (!product) {
      setLiErrors((prev) => ({ ...prev, [lead.id]: 'Select a product first (dropdown at top right)' }));
      return;
    }
    setLiGenerating(lead.id);
    setLiErrors((prev) => ({ ...prev, [lead.id]: '' }));
    try {
      const res = await fetch('/api/linkedin/outreach', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: lead.company, domain: lead.domain, industry: lead.industry,
          employeeCount: lead.employeeCount, leadTitle: lead.title,
          productName: product.name, productUrl: product.gumroadUrl || product.url, productPrice: String(product.price),
        }),
      });
      const data = await res.json();
      if (data.success && data.messages) {
        setLiMessages((prev) => ({ ...prev, [lead.id]: data.messages }));
      } else {
        setLiErrors((prev) => ({ ...prev, [lead.id]: data.error || 'Failed to generate LinkedIn messages' }));
      }
    } catch {
      setLiErrors((prev) => ({ ...prev, [lead.id]: 'Network error — could not reach API' }));
    } finally { setLiGenerating(null); }
  };

  const sendEmail = async (lead: Lead, step: number) => {
    const msgKey = `${lead.id}-${step}`;
    const msg = generatedMessages[msgKey];
    if (!msg) return;

    setSending(lead.id);
    setSendResults((prev) => ({ ...prev, [lead.id]: { success: false, error: '' } }));
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: lead.email, subject: msg.subject, html: msg.html }),
      });
      const data = await res.json();

      if (data.success) {
        const history = [...(lead.messageHistory || []), {
          type: 'email', channel: 'email', content: msg.body,
          sentAt: new Date().toISOString(), status: 'sent', messageId: data.messageId,
        }];
        updateLead(lead.id, {
          emailSequenceStep: step, status: step === 1 ? 'contacted' : lead.status,
          lastContactedAt: new Date().toISOString(),
          nextAction: step < 3 ? `email${step + 1}` : 'close',
          nextActionDate: new Date(Date.now() + (step < 3 ? (step === 1 ? 3 : 7) : 14) * 86400000).toISOString(),
          messageHistory: history,
        });
        setSendResults((prev) => ({ ...prev, [lead.id]: { success: true, provider: data.provider } }));
      } else {
        setSendResults((prev) => ({ ...prev, [lead.id]: { success: false, error: data.error || 'Send failed' } }));
      }
    } catch {
      setSendResults((prev) => ({ ...prev, [lead.id]: { success: false, error: 'Network error' } }));
    } finally { setSending(null); }
  };

  const markEmailSent = (lead: Lead, step: number) => {
    const msgKey = `${lead.id}-${step}`;
    const msg = generatedMessages[msgKey];
    const history = [...(lead.messageHistory || []), {
      type: 'email', channel: 'email', content: msg?.body || '',
      sentAt: new Date().toISOString(), status: 'sent',
    }];
    updateLead(lead.id, {
      emailSequenceStep: step, status: step === 1 ? 'contacted' : lead.status,
      lastContactedAt: new Date().toISOString(),
      nextAction: step < 3 ? `email${step + 1}` : 'close',
      nextActionDate: new Date(Date.now() + (step < 3 ? (step === 1 ? 3 : 7) : 14) * 86400000).toISOString(),
      messageHistory: history,
    });
    setSendResults((prev) => ({ ...prev, [lead.id]: { success: true, provider: 'manual' } }));
  };

  const markLinkedinSent = (lead: Lead, type: 'connect' | 'dm') => {
    const msg = liMessages[lead.id];
    const history = [...(lead.messageHistory || []), {
      type: type === 'connect' ? 'linkedin_connect' : 'linkedin_dm',
      channel: 'linkedin', content: type === 'connect' ? msg?.connectionRequest || '' : msg?.followUp1 || '',
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

  const copy = (text: string) => { navigator.clipboard.writeText(text); };

  const handleDelete = (leadId: string) => {
    if (confirmDelete === leadId) {
      deleteLead(leadId);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(leadId);
      setTimeout(() => setConfirmDelete(null), 4000);
    }
  };

  const bulkGenerateEmails = async () => {
    setBulkGenerating(true);
    const targets = activeLeads.filter((l) => selectedLeads.has(l.id));
    for (const lead of targets) { await generateEmail(lead, 1); }
    setBulkGenerating(false);
  };

  const bulkSendEmails = async () => {
    setBulkSending(true);
    const targets = activeLeads.filter((l) => selectedLeads.has(l.id) && generatedMessages[`${l.id}-1`]);
    for (const lead of targets) { await sendEmail(lead, 1); }
    setBulkSending(false);
  };

  const toggleLeadSelection = (id: string) => {
    const next = new Set(selectedLeads);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedLeads(next);
  };

  const sentToday = leads.filter((l) => l.lastContactedAt && new Date(l.lastContactedAt).toDateString() === new Date().toDateString()).length;
  const totalReady = Object.keys(generatedMessages).length;
  const productLink = product?.gumroadUrl || product?.url || '';

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Outreach</h1>
          <p className="text-xs text-zinc-500 mt-1">Generate AI emails with Gumroad links, send directly, track results.</p>
        </div>
        <div className="flex items-center gap-3">
          {!product && (
            <span className="text-[10px] px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
              ⚠️ Select a product above to generate messages
            </span>
          )}
          {emailConfig !== 'checking' && emailConfig !== 'unconfigured' && (
            <span className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ✅ Email ready to send
            </span>
          )}
          <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}
            className={`bg-[#0f0f0f] border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/40 ${product ? 'border-[#2a2a2a] text-zinc-300' : 'border-red-500/40 text-red-400 font-bold'}`}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
          </select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Leads w/ Email', value: activeLeads.length, color: 'text-blue-400' },
          { label: 'Generated', value: totalReady, color: 'text-emerald-400' },
          { label: 'Sent Today', value: sentToday, color: 'text-amber-400' },
          { label: 'Product', value: product ? `$${product.price}` : '—', color: 'text-purple-400' },
        ].map((s) => (
          <div key={s.label} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-3 text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-zinc-600 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([['email', `📧 Emails (${activeLeads.length})`], ['linkedin', `💼 LinkedIn (${linkedinLeads.length})`], ['bulk', `⚡ Bulk Actions`]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === id ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#141414] text-zinc-500 border border-[#1f1f1f] hover:text-zinc-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ========== EMAIL TAB ========== */}
      {activeTab === 'email' && (
        <div className="space-y-2 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
          {activeLeads.length === 0 ? (
            <div className="text-center py-16 text-zinc-600">
              <p className="text-2xl mb-2">📧</p>
              <p className="text-sm">No leads with emails yet.</p>
              <p className="text-xs text-zinc-700 mt-1">Go to Find Leads to add some, then Enrich to set emails.</p>
            </div>
          ) : (
            activeLeads.map((lead) => {
              const currentStep = (lead.emailSequenceStep || 0);
              const nextStep = currentStep + 1;
              const msgKey = `${lead.id}-${nextStep}`;
              const msg = generatedMessages[msgKey];
              const isGenerating = generating === lead.id;
              const isSending = sending === lead.id;
              const sendResult = sendResults[lead.id];
              const genError = generationErrors[msgKey];

              return (
                <div key={lead.id} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">
                        {lead.name?.split(' ').map((n) => n[0]).join('') || '??'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{lead.name || 'Unknown'}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{lead.title} at {lead.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">Step {currentStep}/3</span>
                      <span className="text-[9px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded max-w-[180px] truncate">{lead.email}</span>
                      <button onClick={() => handleDelete(lead.id)}
                        className={`px-1.5 py-0.5 rounded border text-[10px] transition-colors ${
                          confirmDelete === lead.id
                            ? 'bg-red-500 text-white font-bold border-red-500'
                            : 'text-red-400/40 hover:text-red-400 border-transparent hover:border-red-500/10 hover:bg-red-500/5'
                        }`}
                        title="Delete lead">
                        {confirmDelete === lead.id ? 'Sure?' : '🗑'}
                      </button>
                    </div>
                  </div>

                  {/* Generation error */}
                  {genError && (
                    <div className="bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2 mb-3">
                      <p className="text-[10px] text-red-400">❌ {genError}</p>
                    </div>
                  )}

                  {msg ? (
                    <div className="bg-[#0f0f0f] border border-emerald-500/15 rounded-lg p-3 mb-3">
                      <p className="text-[10px] font-bold text-emerald-400 mb-1">Subject: {msg.subject}</p>
                      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                      {msg.body?.includes(productLink) ? (
                        <p className="text-[9px] text-emerald-500 mt-1">✅ Gumroad link included</p>
                      ) : (
                        <p className="text-[9px] text-amber-500 mt-1">⚠️ Link missing — add: {productLink}</p>
                      )}
                      <div className="flex justify-end mt-2 gap-2">
                        <button onClick={() => copy(msg.body)} className="text-[10px] text-zinc-500 hover:text-white font-medium px-2 py-1">📋 Copy</button>
                        <button onClick={() => { markEmailSent(lead, nextStep); }}
                          className="text-[10px] text-zinc-400 hover:text-white font-medium px-2 py-1">
                          ✓ Mark Sent Manually
                        </button>
                        <button onClick={() => sendEmail(lead, nextStep)} disabled={isSending}
                          className="text-[10px] font-bold px-3 py-1 rounded bg-emerald-500 text-black hover:bg-emerald-400 transition-colors disabled:opacity-50">
                          {isSending ? '⏳ Sending...' : '🚀 Send Now'}
                        </button>
                      </div>
                      {sendResult && (
                        <p className={`text-[9px] mt-1 ${sendResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                          {sendResult.success ? `✅ Sent${sendResult.provider === 'manual' ? ' (marked manually)' : ` via ${sendResult.provider}`}` : `❌ ${sendResult.error}`}
                        </p>
                      )}
                    </div>
                  ) : (
                    <button onClick={() => generateEmail(lead, nextStep)} disabled={isGenerating || !product}
                      className="w-full py-2.5 rounded-lg border border-dashed border-[#2a2a2a] text-xs text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors mb-3 disabled:opacity-50">
                      {isGenerating ? '⚡ Generating...' : !product ? '⚠️ Select a product first' : `⚡ Generate Email ${nextStep}/3 (with Gumroad link)`}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========== LINKEDIN TAB ========== */}
      {activeTab === 'linkedin' && (
        <div className="space-y-2 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
          {!product && (
            <div className="bg-red-500/5 border border-red-500/15 rounded-lg p-3 mb-3">
              <p className="text-xs text-red-400 font-bold">⚠️ Select a product from the dropdown above to generate LinkedIn messages</p>
            </div>
          )}
          {linkedinLeads.length === 0 ? (
            <div className="text-center py-16 text-zinc-600">
              <p className="text-2xl mb-2">💼</p>
              <p className="text-sm">No leads yet.</p>
              <p className="text-xs text-zinc-700 mt-1">Go to Find Leads to add some first.</p>
            </div>
          ) : (
            linkedinLeads.slice(0, 20).map((lead) => {
              const liMsg = liMessages[lead.id];
              const isLiGen = liGenerating === lead.id;
              const liError = liErrors[lead.id];

              return (
                <div key={lead.id} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">
                        {lead.name?.split(' ').map((n) => n[0]).join('') || '??'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{lead.name || 'Unknown'}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{lead.title || 'Unknown role'} at {lead.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        lead.linkedinStatus === 'none' ? 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20' :
                        lead.linkedinStatus === 'connection_sent' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                        lead.linkedinStatus === 'connected' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' :
                        'text-sky-400 bg-sky-400/10 border-sky-400/20'
                      }`}>{lead.linkedinStatus.replace(/_/g, ' ')}</span>
                      <a href={`https://www.linkedin.com/sales/search?keywords=${encodeURIComponent((lead.name || '') + ' ' + lead.company)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-sky-400 hover:text-sky-300 font-medium">🔗 Find</a>
                      <button onClick={() => handleDelete(lead.id)}
                        className={`px-1.5 py-0.5 rounded border text-[10px] transition-colors ${
                          confirmDelete === lead.id
                            ? 'bg-red-500 text-white font-bold border-red-500'
                            : 'text-red-400/40 hover:text-red-400 border-transparent hover:border-red-500/10 hover:bg-red-500/5'
                        }`}
                        title="Delete lead">
                        {confirmDelete === lead.id ? 'Sure?' : '🗑'}
                      </button>
                    </div>
                  </div>

                  {/* LinkedIn error */}
                  {liError && (
                    <div className="bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2 mb-3">
                      <p className="text-[10px] text-red-400">❌ {liError}</p>
                    </div>
                  )}

                  {liMsg ? (
                    <div className="space-y-2 mb-3">
                      <div className="bg-[#0f0f0f] border border-sky-500/15 rounded-lg p-3">
                        <p className="text-[10px] font-bold text-sky-400 mb-1">
                          💼 Connection Request ({(liMsg.connectionRequest || '').length}/300 chars)
                          {(liMsg.connectionRequest || '').length > 300 && <span className="text-red-400 ml-1">⚠️ Too long for connection note!</span>}
                        </p>
                        <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{liMsg.connectionRequest}</p>
                        <div className="flex justify-end mt-2 gap-2">
                          <button onClick={() => copy(liMsg.connectionRequest)} className="text-[10px] text-zinc-500 hover:text-white">📋 Copy</button>
                          {lead.linkedinStatus === 'none' && (
                            <button onClick={() => { copy(liMsg.connectionRequest); markLinkedinSent(lead, 'connect'); }}
                              className="text-[10px] text-sky-400 font-medium">✓ Copy & Mark Sent</button>
                          )}
                        </div>
                      </div>
                      {liMsg.followUp1 && (
                        <div className="bg-[#0f0f0f] border border-sky-500/15 rounded-lg p-3">
                          <p className="text-[10px] font-bold text-sky-400 mb-1">📨 Follow-up DM (after connection accepted)</p>
                          <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{liMsg.followUp1}</p>
                          {productLink && (
                            <p className="text-[9px] text-emerald-500 mt-1">✅ Product: {product.name} — {productLink}</p>
                          )}
                          <div className="flex justify-end mt-2 gap-2">
                            <button onClick={() => copy(liMsg.followUp1)} className="text-[10px] text-zinc-500 hover:text-white">📋 Copy</button>
                            {lead.linkedinStatus === 'connected' && (
                              <button onClick={() => { copy(liMsg.followUp1); markLinkedinSent(lead, 'dm'); }}
                                className="text-[10px] text-sky-400 font-medium">✓ Copy & Mark Sent</button>
                            )}
                          </div>
                        </div>
                      )}
                      {liMsg.followUp2 && (
                        <div className="bg-[#0f0f0f] border border-sky-500/15 rounded-lg p-3">
                          <p className="text-[10px] font-bold text-sky-400 mb-1">📨 Follow-up #2 (5-7 days later)</p>
                          <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{liMsg.followUp2}</p>
                          <div className="flex justify-end mt-2">
                            <button onClick={() => copy(liMsg.followUp2)} className="text-[10px] text-zinc-500 hover:text-white">📋 Copy</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button onClick={() => generateLinkedin(lead)} disabled={isLiGen || !product}
                      className="w-full py-2.5 rounded-lg border border-dashed border-[#2a2a2a] text-xs text-zinc-500 hover:text-sky-400 hover:border-sky-500/30 transition-colors mb-3 disabled:opacity-50">
                      {isLiGen ? '⚡ Generating...' : !product ? '⚠️ Select a product first' : '⚡ Generate LinkedIn Messages (connection + 2 follow-ups)'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========== BULK TAB ========== */}
      {activeTab === 'bulk' && (
        <div className="space-y-4">
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-2">Bulk Email: Generate & Send</h3>
            <p className="text-xs text-zinc-500 mb-4">Select leads with emails, generate personalized cold emails, then send all at once.</p>

            {!product && (
              <div className="bg-red-500/5 border border-red-500/15 rounded-lg p-3 mb-4">
                <p className="text-xs text-red-400 font-bold">⚠️ Select a product from the dropdown at the top right first</p>
              </div>
            )}

            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <button onClick={() => setSelectedLeads(new Set(activeLeads.map((l) => l.id)))}
                className="px-3 py-1.5 rounded-lg bg-[#0f0f0f] text-[10px] text-zinc-500 hover:text-white border border-[#2a2a2a]">
                Select All ({activeLeads.length})
              </button>
              <button onClick={() => setSelectedLeads(new Set())}
                className="px-3 py-1.5 rounded-lg bg-[#0f0f0f] text-[10px] text-zinc-500 hover:text-white border border-[#2a2a2a]">
                Clear
              </button>
              <span className="text-[10px] text-zinc-600">{selectedLeads.size} selected</span>
              <div className="flex-1" />
              <button onClick={bulkGenerateEmails} disabled={bulkGenerating || selectedLeads.size === 0 || !product}
                className="px-4 py-2 rounded-lg bg-[#0f0f0f] text-xs font-medium text-zinc-300 hover:text-white border border-[#2a2a2a] disabled:opacity-50">
                {bulkGenerating ? `⏳ Generating ${selectedLeads.size}...` : `⚡ Generate ${selectedLeads.size} Emails`}
              </button>
              <button onClick={bulkSendEmails} disabled={bulkSending || selectedLeads.size === 0 || totalReady === 0}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-50">
                {bulkSending ? `⏳ Sending ${selectedLeads.size}...` : `🚀 Send ${selectedLeads.size} Emails`}
              </button>
            </div>

            <div className="space-y-1 max-h-64 overflow-y-auto">
              {activeLeads.filter((l) => selectedLeads.has(l.id)).map((lead) => {
                const msgKey = `${lead.id}-1`;
                const hasMsg = !!generatedMessages[msgKey];
                const sr = sendResults[lead.id];
                const ge = generationErrors[msgKey];
                return (
                  <div key={lead.id} className="flex items-center justify-between bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-[11px] text-zinc-300 truncate">{lead.name || 'Unknown'}</p>
                      <span className="text-[9px] text-zinc-600 truncate">{lead.company}</span>
                    </div>
                    {ge ? (
                      <span className="text-[9px] text-red-400 font-medium">❌ Error</span>
                    ) : sr?.success ? (
                      <span className="text-[9px] text-emerald-400 font-medium">✅ Sent</span>
                    ) : hasMsg ? (
                      <span className="text-[9px] text-amber-400 font-medium">Ready</span>
                    ) : (
                      <span className="text-[9px] text-zinc-600">Pending...</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
