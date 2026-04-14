'use client';
import { useState, useEffect, useCallback } from 'react';
import { useMarketingStore } from '@/store/useMarketingStore';
import type { Lead } from '@/types/marketing';
import { getLeadsNeedingAction, getTimeUntilNextAction, markActionComplete, generateAutoReply, ACTION_LABELS } from '@/lib/outreach-engine';

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: 'text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-500/20' },
  contacted: { label: 'Contacted', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
  replied: { label: 'Replied', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  interested: { label: 'Interested', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
  converted: { label: 'Converted', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
  lost: { label: 'Lost', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
};

const CHANNEL_ICONS: Record<string, string> = { linkedin: '💼', twitter: '𝕏', reddit: '🔴', email: '📧', discord: '💬', producthunt: '🚀', manual: '✏️' };

type MsgStep = 'connection' | 'followup1' | 'followup2';

export default function OutreachView() {
  const { projects, leads, addLead, updateLead, getLeadsForProject, getProject, autoOutreachEnabled, toggleAutoOutreach } = useMarketingStore();
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id || '');
  const [generating, setGenerating] = useState(false);
  const [genMessages, setGenMessages] = useState<Record<string, { connectionRequest: string; followUp1: string; followUp2: string }>>({});
  const [activeMsg, setActiveMsg] = useState<MsgStep>('connection');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', title: '', company: '', industry: '', domain: '', employees: '' });
  const [sendingLeadId, setSendingLeadId] = useState<string | null>(null);
  const [actionQueue, setActionQueue] = useState<ReturnType<typeof getLeadsNeedingAction> | null>(null);
  const [showAutoReplies, setShowAutoReplies] = useState<Record<string, string>>({});

  const project = getProject(selectedProject);
  const projectLeads = getLeadsForProject(selectedProject);

  // Recalculate action queue when leads or autoOutreach change
  const refreshActionQueue = useCallback(() => {
    if (autoOutreachEnabled) {
      setActionQueue(getLeadsNeedingAction(projectLeads));
    } else {
      setActionQueue(null);
    }
  }, [projectLeads, autoOutreachEnabled]);

  useEffect(() => {
    refreshActionQueue();
  }, [refreshActionQueue]);

  // Auto-reply generation when lead status is replied/interested
  useEffect(() => {
    for (const lead of projectLeads) {
      if ((lead.status === 'replied' || lead.status === 'interested') && lead.nextAction && !showAutoReplies[lead.id]) {
        const reply = generateAutoReply(lead, project?.name);
        setShowAutoReplies((prev) => ({ ...prev, [lead.id]: reply }));
      }
    }
  }, [projectLeads, project, showAutoReplies]);

  const generateForLead = async (lead: Lead) => {
    if (!project) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/linkedin/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: lead.company, domain: lead.domain, industry: lead.industry,
          employeeCount: lead.employeeCount, leadTitle: lead.title,
          productName: project.name, productUrl: project.url, productPrice: String(project.price),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setGenMessages((p) => ({ ...p, [lead.id]: data.messages }));
          const history = lead.messageHistory || [];
          updateLead(lead.id, {
            generatedMessages: data.messages,
            status: 'contacted',
            lastContactedAt: new Date().toISOString(),
            nextAction: 'followup1',
            nextActionDate: new Date(Date.now() + 3 * 86400000).toISOString(),
            messageHistory: [...history, { step: 'connection', sentAt: new Date().toISOString(), content: 'Connection request generated' }],
          });
        }
      }
    } catch { /* fallback */ } finally { setGenerating(false); }
  };

  const bulkGenerate = async () => {
    const without = projectLeads.filter((l) => !genMessages[l.id]);
    for (const lead of without) { await generateForLead(lead); }
  };

  const addManualLead = () => {
    if (!addForm.name || !addForm.company) return;
    addLead({
      id: `lead-${Date.now()}`, projectId: selectedProject,
      name: addForm.name, title: addForm.title || 'Decision Maker', company: addForm.company,
      domain: addForm.domain || `${addForm.company.toLowerCase().replace(/\s/g, '')}.com`,
      industry: addForm.industry || 'Tech', employeeCount: addForm.employees || '200-500',
      channel: 'manual', status: 'new', notes: '', createdAt: new Date().toISOString().split('T')[0],
      nextAction: 'connect', nextActionDate: new Date().toISOString(),
    });
    setAddForm({ name: '', title: '', company: '', industry: '', domain: '', employees: '' });
    setShowAdd(false);
  };

  const getMsg = (leadId: string, step: MsgStep): string => {
    const m = genMessages[leadId];
    if (!m) return '';
    return step === 'connection' ? m.connectionRequest : step === 'followup1' ? m.followUp1 : m.followUp2;
  };

  const copy = (text: string) => navigator.clipboard.writeText(text);

  const advanceStatus = (lead: Lead) => {
    const flow: Record<string, string> = { new: 'contacted', contacted: 'replied', replied: 'interested', interested: 'converted' };
    const next = flow[lead.status];
    if (next) {
      const history = lead.messageHistory || [];
      updateLead(lead.id, { status: next as Lead['status'], messageHistory: [...history, { step: 'status_change', sentAt: new Date().toISOString(), content: `Status changed to ${next}` }] });
    }
  };

  const markAsSent = (lead: Lead) => {
    setSendingLeadId(lead.id);
    const updates = markActionComplete(lead);
    updateLead(lead.id, updates);
    setTimeout(() => {
      setSendingLeadId(null);
    }, 500);
  };

  const sendAllPending = () => {
    if (!actionQueue) return;
    const overdue = actionQueue.overdue;
    for (const lead of overdue) {
      const updates = markActionComplete(lead);
      updateLead(lead.id, updates);
    }
  };

  const overdueCount = actionQueue?.overdue.length || 0;

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Outreach</h1>
          <p className="text-xs text-zinc-500 mt-1">AI-powered lead generation and personalized messaging.</p>
        </div>
        <div className="flex gap-2">
          {/* Automation Toggle */}
          <button onClick={toggleAutoOutreach}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
              autoOutreachEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-[#1a1a1a] text-zinc-500 border-[#2a2a2a] hover:text-zinc-300'
            }`}>
            {autoOutreachEnabled ? '🤖 Auto: ON' : '🤖 Auto: OFF'}
          </button>
          <button onClick={() => setShowAdd(true)} className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-[11px] font-medium text-zinc-400 hover:text-white border border-[#2a2a2a] transition-colors">+ Add Lead</button>
          {project && <a href={project.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-emerald-500 text-[11px] font-semibold text-black hover:bg-emerald-400 transition-colors">🔗 Copy Product Link</a>}
        </div>
      </div>

      {/* Project Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {projects.map((p) => (
          <button key={p.id} onClick={() => setSelectedProject(p.id)}
            className={`shrink-0 px-4 py-2 rounded-lg text-xs font-medium transition-all ${selectedProject === p.id ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#141414] text-zinc-500 border border-[#1f1f1f] hover:text-zinc-300'}`}>
            {p.type === 'gumroad' ? '$' : '📦'} {p.name.length > 30 ? p.name.slice(0, 30) + '...' : p.name} <span className="ml-1 text-zinc-600">({p.price})</span>
          </button>
        ))}
      </div>

      {/* Stats Bar */}
      {project && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Leads', value: projectLeads.length, color: 'text-blue-400' },
            { label: 'Contacted', value: projectLeads.filter((l) => ['contacted', 'replied', 'interested', 'converted'].includes(l.status)).length, color: 'text-amber-400' },
            { label: 'Replied', value: projectLeads.filter((l) => ['replied', 'interested', 'converted'].includes(l.status)).length, color: 'text-emerald-400' },
            { label: 'Converted', value: projectLeads.filter((l) => l.status === 'converted').length, color: 'text-green-400' },
          ].map((s) => (
            <div key={s.label} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-zinc-600 uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Action Queue (Automation ON) */}
      {autoOutreachEnabled && actionQueue && (
        <div className="bg-[#141414] border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">🤖</span>
              <h3 className="text-sm font-semibold text-white">Action Queue</h3>
              {overdueCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400">
                  {overdueCount} overdue
                </span>
              )}
            </div>
            {overdueCount > 0 && (
              <button onClick={sendAllPending}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-[10px] font-semibold text-black hover:bg-emerald-400 transition-colors">
                ✓ Send All Pending ({overdueCount})
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: 'Connect', count: actionQueue.needsConnection.length, icon: '📤' },
              { label: 'Follow-up', count: actionQueue.needsFollowUp.length, icon: '📨' },
              { label: 'Reply', count: actionQueue.needsReply.length, icon: '💬' },
              { label: 'Close', count: actionQueue.needsClose.length, icon: '💰' },
            ].map((item) => (
              <div key={item.label} className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg p-2 text-center">
                <span className="text-xs">{item.icon}</span>
                <p className="text-sm font-bold text-white">{item.count}</p>
                <p className="text-[9px] text-zinc-600">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Overdue leads mini-list */}
          {actionQueue.overdue.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {actionQueue.overdue.slice(0, 5).map((lead) => (
                <div key={lead.id} className="flex items-center justify-between bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs">{CHANNEL_ICONS[lead.channel]}</span>
                    <p className="text-[11px] text-white truncate">{lead.name}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${STATUS_CFG[lead.status]?.bg || ''} ${STATUS_CFG[lead.status]?.color || ''}`}>{STATUS_CFG[lead.status]?.label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] text-red-400">{getTimeUntilNextAction(lead)}</span>
                    <button onClick={() => markAsSent(lead)} disabled={sendingLeadId === lead.id}
                      className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-semibold text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50">
                      {sendingLeadId === lead.id ? '✓' : 'Mark Sent'}
                    </button>
                  </div>
                </div>
              ))}
              {actionQueue.overdue.length > 5 && (
                <p className="text-[10px] text-zinc-600 text-center pt-1">+{actionQueue.overdue.length - 5} more</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {projectLeads.length > 0 && (
        <div className="flex items-center gap-3">
          <button onClick={bulkGenerate} disabled={generating}
            className="px-4 py-2 rounded-lg bg-emerald-500 text-xs font-semibold text-black hover:bg-emerald-400 transition-colors disabled:opacity-50">
            {generating ? '⚡ Generating...' : '⚡ Generate All Messages'}
          </button>
          <span className="text-[10px] text-zinc-600">{Object.keys(genMessages).length}/{projectLeads.length} messages ready</span>
        </div>
      )}

      {/* Lead List */}
      <div className="space-y-2 max-h-[calc(100vh-360px)] overflow-y-auto pr-1">
        {projectLeads.length === 0 ? (
          <div className="text-center py-16 text-zinc-600">
            <p className="text-2xl mb-2">📤</p>
            <p className="text-sm">No leads for this project yet.</p>
            <button onClick={() => setShowAdd(true)} className="mt-3 text-xs text-emerald-400 hover:text-emerald-300">+ Add your first lead</button>
          </div>
        ) : (
          projectLeads.map((lead) => {
            const sc = STATUS_CFG[lead.status];
            const hasMsg = !!genMessages[lead.id];
            const isOverdue = lead.nextActionDate && new Date(lead.nextActionDate) <= new Date();
            const timeUntil = getTimeUntilNextAction(lead);
            const autoReply = showAutoReplies[lead.id];

            return (
              <div key={lead.id} className={`bg-[#141414] border rounded-xl overflow-hidden ${isOverdue ? 'border-red-500/30' : 'border-[#1f1f1f]'}`}>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
                        {lead.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{lead.name}</p>
                        <p className="text-[11px] text-zinc-500 truncate">{lead.title} at {lead.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {autoOutreachEnabled && lead.nextAction && (
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${isOverdue ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800 text-zinc-500'}`}>
                          {isOverdue ? '⏰ ' : '⏳ '}{timeUntil}
                        </span>
                      )}
                      <span className="text-[10px]">{CHANNEL_ICONS[lead.channel]}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${sc?.bg || ''} ${sc?.color || ''}`}>{sc?.label}</span>
                    </div>
                  </div>

                  {/* Automation: Next Action Label */}
                  {autoOutreachEnabled && lead.nextAction && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] text-zinc-600">Next:</span>
                      <span className="text-[10px] font-medium text-amber-400">{ACTION_LABELS[lead.nextAction]}</span>
                      {lead.messageHistory && lead.messageHistory.length > 0 && (
                        <span className="text-[9px] text-zinc-700">({lead.messageHistory.length} messages)</span>
                      )}
                    </div>
                  )}

                  {/* Auto-reply preview for replied/interested leads */}
                  {autoReply && (lead.status === 'replied' || lead.status === 'interested') && (
                    <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3 mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-emerald-400">🤖 AI Suggested Reply</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{autoReply}</p>
                      <div className="flex justify-end mt-2 gap-2">
                        <button onClick={() => copy(autoReply)} className="text-[10px] text-zinc-500 hover:text-white font-medium">📋 Copy</button>
                        <button onClick={() => { copy(autoReply); markAsSent(lead); }} className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium">✓ Copy & Mark Sent</button>
                      </div>
                    </div>
                  )}

                  {/* Message Tabs */}
                  <div className="flex gap-1 mb-2">
                    {(['connection', 'followup1', 'followup2'] as MsgStep[]).map((step) => (
                      <button key={step} onClick={() => setActiveMsg(step)}
                        className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${activeMsg === step ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#0f0f0f] text-zinc-600 hover:text-zinc-400'}`}>
                        {step === 'connection' ? '📝 Connect' : step === 'followup1' ? '📨 Follow 1' : '📧 Follow 2'}
                      </button>
                    ))}
                  </div>

                  {/* Message Content */}
                  {hasMsg ? (
                    <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg p-3 mb-2">
                      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{getMsg(lead.id, activeMsg)}</p>
                      <div className="flex justify-end mt-2 gap-3">
                        <button onClick={() => { copy(getMsg(lead.id, activeMsg)); markAsSent(lead); }} className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium">✓ Mark as Sent</button>
                        <button onClick={() => copy(getMsg(lead.id, activeMsg))} className="text-[10px] text-zinc-500 hover:text-white font-medium">📋 Copy</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => generateForLead(lead)} disabled={generating}
                      className="w-full py-2 rounded-lg border border-dashed border-[#2a2a2a] text-[11px] text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors mb-2 disabled:opacity-50">
                      {generating ? '⚡ Generating...' : '⚡ Generate Message'}
                    </button>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button onClick={() => advanceStatus(lead)} disabled={lead.status === 'converted' || lead.status === 'lost'}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-30">
                      {lead.status === 'converted' ? '💰 Converted!' : lead.status === 'interested' ? '🎉 Mark Converted' : '→ Next Step'}
                    </button>
                    {autoOutreachEnabled && lead.nextAction && isOverdue && (
                      <button onClick={() => markAsSent(lead)} disabled={sendingLeadId === lead.id}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] font-semibold text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50">
                        ✓ Mark Sent
                      </button>
                    )}
                    {project && (
                      <button onClick={() => copy(project.url)} className="px-3 py-1.5 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] text-[10px] text-zinc-500 hover:text-white transition-colors">📋 Link</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Lead Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-base font-semibold text-white mb-4">Add Lead</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder="Name *" className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40" />
              <input value={addForm.title} onChange={(e) => setAddForm({ ...addForm, title: e.target.value })} placeholder="Title" className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40" />
              <input value={addForm.company} onChange={(e) => setAddForm({ ...addForm, company: e.target.value })} placeholder="Company *" className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40" />
              <input value={addForm.domain} onChange={(e) => setAddForm({ ...addForm, domain: e.target.value })} placeholder="domain.com" className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40" />
              <input value={addForm.industry} onChange={(e) => setAddForm({ ...addForm, industry: e.target.value })} placeholder="Industry" className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40" />
              <input value={addForm.employees} onChange={(e) => setAddForm({ ...addForm, employees: e.target.value })} placeholder="Size (e.g. 200-500)" className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowAdd(false); setAddForm({ name: '', title: '', company: '', industry: '', domain: '', employees: '' }); }} className="flex-1 py-2.5 rounded-lg bg-[#1a1a1a] text-sm font-medium text-zinc-400 hover:text-zinc-300 transition-colors">Cancel</button>
              <button onClick={addManualLead} disabled={!addForm.name || !addForm.company} className="flex-1 py-2.5 rounded-lg bg-emerald-500 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors disabled:opacity-50">Add Lead</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
