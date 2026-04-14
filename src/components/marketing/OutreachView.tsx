'use client';
import { useState, useMemo } from 'react';
import { useMarketingStore } from '@/store/useMarketingStore';
import type { Lead } from '@/types/marketing';

type OutreachTab = 'email' | 'linkedin' | 'bulk';

export default function OutreachView() {
  const { leads, projects, updateLead } = useMarketingStore();
  const [activeTab, setActiveTab] = useState<OutreachTab>('email');
  const [selectedProduct, setSelectedProduct] = useState(projects[0]?.id || '');
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatedMessages, setGeneratedMessages] = useState<Record<string, { subject: string; body: string; html: string }>>({});
  const [sending, setSending] = useState<string | null>(null);
  const [sendResults, setSendResults] = useState<Record<string, { success: boolean; provider?: string; error?: string }>>({});
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);
  const [emailConfig, setEmailConfig] = useState<'unconfigured' | 'resend' | 'gmail' | 'checking'>('checking');

  // LinkedIn state
  const [liGenerating, setLiGenerating] = useState<string | null>(null);
  const [liMessages, setLiMessages] = useState<Record<string, { connectionRequest: string; followUp1: string; followUp2: string }>>({});

  // Check email config on mount
  useMemo(() => {
    fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: '', subject: '', html: '' }) })
      .then(r => r.json())
      .then(data => {
        if (data.success === false && data.setupGuide) setEmailConfig('unconfigured');
        else if (data.provider === 'resend') setEmailConfig('resend');
        else setEmailConfig('gmail');
      })
      .catch(() => setEmailConfig('unconfigured'));
  }, []);

  const activeLeads = useMemo(() => leads.filter((l) => l.status !== 'converted' && l.status !== 'lost' && l.status !== 'bounced' && l.email), [leads]);
  const linkedinLeads = useMemo(() => leads.filter((l) => l.status !== 'converted' && l.status !== 'lost' && l.status !== 'bounced'), [leads]);
  const product = projects.find((p) => p.id === selectedProduct);

  const generateEmail = async (lead: Lead, step: number) => {
    setGenerating(lead.id);
    try {
      const res = await fetch('/api/outreach/generate-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead, product, step }),
      });
      const data = await res.json();
      if (data.success) setGeneratedMessages((prev) => ({ ...prev, [`${lead.id}-${step}`]: data }));
    } catch { /* silent */ } finally { setGenerating(null); }
  };

  const generateLinkedin = async (lead: Lead) => {
    setLiGenerating(lead.id);
    try {
      const res = await fetch('/api/linkedin/outreach', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: lead.company, domain: lead.domain, industry: lead.industry,
          employeeCount: lead.employeeCount, leadTitle: lead.title,
          productName: product?.name, productUrl: product?.url, productPrice: String(product?.price),
        }),
      });
      const data = await res.json();
      if (data.success) setLiMessages((prev) => ({ ...prev, [lead.id]: data.messages }));
    } catch { /* silent */ } finally { setLiGenerating(null); }
  };

  const sendEmail = async (lead: Lead, step: number) => {
    const msgKey = `${lead.id}-${step}`;
    const msg = generatedMessages[msgKey];
    if (!msg) return;

    setSending(lead.id);
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
        setSendResults((prev) => ({ ...prev, [lead.id]: { success: false, error: data.error } }));
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

  const copy = (text: string) => navigator.clipboard.writeText(text);

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
          {emailConfig === 'unconfigured' && (
            <span className="text-[10px] px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              ⚠️ Email not configured — <a href="https://resend.com/signup" target="_blank" className="underline">Set up Resend (free)</a>
            </span>
          )}
          {emailConfig !== 'unconfigured' && emailConfig !== 'checking' && (
            <span className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ✅ {emailConfig === 'resend' ? 'Resend' : 'Gmail'} connected — ready to send
            </span>
          )}
          <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}
            className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/40">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
          </select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Leads w/ Email', value: activeLeads.length, color: 'text-blue-400' },
          { label: 'Ready to Send', value: totalReady, color: 'text-emerald-400' },
          { label: 'Sent Today', value: sentToday, color: 'text-amber-400' },
          { label: 'Product Link', value: productLink ? '✅ Set' : '—', color: 'text-purple-400' },
        ].map((s) => (
          <div key={s.label} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-3 text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-zinc-600 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([['email', `📧 Emails`], ['linkedin', '💼 LinkedIn'], ['bulk', `⚡ Bulk Actions`]] as const).map(([id, label]) => (
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
              <p className="text-xs text-zinc-700 mt-1">Go to Find Leads → import or enrich leads first.</p>
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

              return (
                <div key={lead.id} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">
                        {lead.name?.split(' ').map((n) => n[0]).join('') || '??'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{lead.name}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{lead.title} at {lead.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">Step {currentStep}/3</span>
                      <span className="text-[9px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded max-w-[180px] truncate">{lead.email}</span>
                    </div>
                  </div>

                  {msg ? (
                    <div className="bg-[#0f0f0f] border border-emerald-500/15 rounded-lg p-3 mb-3">
                      <p className="text-[10px] font-bold text-emerald-400 mb-1">Subject: {msg.subject}</p>
                      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                      {/* Verify link is there */}
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
                        {emailConfig !== 'unconfigured' && (
                          <button onClick={() => sendEmail(lead, nextStep)} disabled={isSending}
                            className="text-[10px] font-bold px-3 py-1 rounded bg-emerald-500 text-black hover:bg-emerald-400 transition-colors disabled:opacity-50">
                            {isSending ? '⏳ Sending...' : '🚀 Send Now'}
                          </button>
                        )}
                      </div>
                      {sendResult && (
                        <p className={`text-[9px] mt-1 ${sendResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                          {sendResult.success ? `✅ Sent via ${sendResult.provider}` : `❌ ${sendResult.error}`}
                        </p>
                      )}
                    </div>
                  ) : (
                    <button onClick={() => generateEmail(lead, nextStep)} disabled={isGenerating || !product}
                      className="w-full py-2.5 rounded-lg border border-dashed border-[#2a2a2a] text-xs text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors mb-3 disabled:opacity-50">
                      {isGenerating ? '⚡ Generating...' : `⚡ Generate Email ${nextStep}/3 (with Gumroad link)`}
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
          {linkedinLeads.slice(0, 20).map((lead) => {
            const liMsg = liMessages[lead.id];
            const isLiGen = liGenerating === lead.id;

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
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      lead.linkedinStatus === 'none' ? 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20' :
                      lead.linkedinStatus === 'connection_sent' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                      lead.linkedinStatus === 'connected' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' :
                      'text-sky-400 bg-sky-400/10 border-sky-400/20'
                    }`}>{lead.linkedinStatus.replace(/_/g, ' ')}</span>
                    <a href={`https://www.linkedin.com/sales/search?keywords=${encodeURIComponent(lead.name + ' ' + lead.company)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-sky-400 hover:text-sky-300 font-medium">🔗 Find</a>
                  </div>
                </div>

                {liMsg ? (
                  <div className="space-y-2 mb-3">
                    <div className="bg-[#0f0f0f] border border-sky-500/15 rounded-lg p-3">
                      <p className="text-[10px] font-bold text-sky-400 mb-1">💼 Connection Request ({(liMsg.connectionRequest || '').length}/300 chars)</p>
                      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{liMsg.connectionRequest}</p>
                      <div className="flex justify-end mt-2 gap-2">
                        <button onClick={() => copy(liMsg.connectionRequest)} className="text-[10px] text-zinc-500 hover:text-white">📋 Copy</button>
                        {lead.linkedinStatus === 'none' && (
                          <button onClick={() => { copy(liMsg.connectionRequest); markLinkedinSent(lead, 'connect'); }}
                            className="text-[10px] text-sky-400 font-medium">✓ Mark Sent</button>
                        )}
                      </div>
                    </div>
                    {liMsg.followUp1 && (
                      <div className="bg-[#0f0f0f] border border-sky-500/15 rounded-lg p-3">
                        <p className="text-[10px] font-bold text-sky-400 mb-1">📨 Follow-up DM</p>
                        <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{liMsg.followUp1}</p>
                        {productLink && (
                          <p className="text-[9px] text-emerald-500 mt-1">✅ Link: {productLink}</p>
                        )}
                        <div className="flex justify-end mt-2 gap-2">
                          <button onClick={() => copy(liMsg.followUp1)} className="text-[10px] text-zinc-500 hover:text-white">📋 Copy</button>
                          {lead.linkedinStatus === 'connected' && (
                            <button onClick={() => { copy(liMsg.followUp1); markLinkedinSent(lead, 'dm'); }}
                              className="text-[10px] text-sky-400 font-medium">✓ Mark Sent</button>
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
              </div>
            );
          })}
        </div>
      )}

      {/* ========== BULK TAB ========== */}
      {activeTab === 'bulk' && (
        <div className="space-y-4">
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-2">Bulk Email: Generate & Send</h3>
            <p className="text-xs text-zinc-500 mb-4">Select leads, generate personalized emails, then send all at once. Every email includes the Gumroad buy link.</p>

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
              <button onClick={bulkGenerateEmails} disabled={bulkGenerating || selectedLeads.size === 0}
                className="px-4 py-2 rounded-lg bg-[#0f0f0f] text-xs font-medium text-zinc-300 hover:text-white border border-[#2a2a2a] disabled:opacity-50">
                {bulkGenerating ? '⏳ Generating...' : `⚡ Generate ${selectedLeads.size} Emails`}
              </button>
              {emailConfig !== 'unconfigured' && (
                <button onClick={bulkSendEmails} disabled={bulkSending || selectedLeads.size === 0 || totalReady === 0}
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-50">
                  {bulkSending ? '⏳ Sending...' : `🚀 Send ${selectedLeads.size} Emails`}
                </button>
              )}
            </div>

            <div className="space-y-1 max-h-64 overflow-y-auto">
              {activeLeads.filter((l) => selectedLeads.has(l.id)).map((lead) => {
                const msgKey = `${lead.id}-1`;
                const hasMsg = !!generatedMessages[msgKey];
                const sr = sendResults[lead.id];
                return (
                  <div key={lead.id} className="flex items-center justify-between bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-[11px] text-zinc-300 truncate">{lead.name}</p>
                      <span className="text-[9px] text-zinc-600 truncate">{lead.company}</span>
                    </div>
                    {sr?.success ? (
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

          {emailConfig === 'unconfigured' && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
              <h4 className="text-xs font-bold text-amber-400 mb-2">Setup: Connect Your Email to Send Directly</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-semibold text-white mb-1">Option 1: Resend (Recommended — Free 3,000 emails/mo)</p>
                  <ol className="text-[10px] text-zinc-400 space-y-0.5 list-decimal list-inside">
                    <li>Sign up at <a href="https://resend.com/signup" target="_blank" className="text-emerald-400 underline">resend.com</a></li>
                    <li>Go to API Keys → Create API Key</li>
                    <li>Add to your .env.local: <code className="bg-zinc-800 px-1 rounded text-emerald-400">RESEND_API_KEY=re_xxxxx</code></li>
                    <li>Redeploy — emails will send directly</li>
                  </ol>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-white mb-1">Option 2: Gmail (Free, 500 emails/day)</p>
                  <ol className="text-[10px] text-zinc-400 space-y-0.5 list-decimal list-inside">
                    <li>Google &quot;Gmail App Password&quot; → create one</li>
                    <li>Add to .env.local: <code className="bg-zinc-800 px-1 rounded text-emerald-400">GMAIL_USER=you@gmail.com</code> + <code className="bg-zinc-800 px-1 rounded text-emerald-400">GMAIL_APP_PASSWORD=xxxx</code></li>
                  </ol>
                </div>
                <p className="text-[10px] text-zinc-600">Until email is configured, you can still generate messages and copy-paste them manually.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
