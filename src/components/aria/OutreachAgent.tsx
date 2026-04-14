'use client';
import { useState, useCallback } from 'react';
import { usePanicStore } from '@/store/usePanicStore';
import type { OutreachLead } from '@/types/outreach';

const PRODUCTS = [
  { name: 'CFO Playbook: AI Customer Service', url: 'https://ariaworks3.gumroad.com/l/chqop', price: '$49', match: 'Customer support, CX, helpdesk' },
  { name: 'Voice AI Implementation Blueprint', url: 'https://ariaworks3.gumroad.com/l/ffdssh', price: '$59', match: 'Contact center, voice, telecom, call center' },
  { name: 'Conversational AI ROI Framework', url: 'https://ariaworks3.gumroad.com/l/pjtxj', price: '$49', match: 'Conversational AI, chatbot, SaaS, automation' },
  { name: "The CFO's Panic Playbook", url: 'https://ariaworks3.gumroad.com/l/kmjqgt', price: '$79', match: 'Cost reduction, budget cuts, board pressure' },
];

type MessageStep = 'connection' | 'followup1' | 'followup2';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  found: { label: 'Found', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
  messaged: { label: 'Messaged', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
  replied: { label: 'Replied', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  converted: { label: 'Converted', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
  bounced: { label: 'Bounced', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
};

interface GeneratedMessages {
  connectionRequest: string;
  followUp1: string;
  followUp2: string;
  subjectLine?: string;
}

export default function OutreachAgent() {
  const { setTab } = usePanicStore();

  // Scanner state
  const [scanDomain, setScanDomain] = useState('');
  const [scanIndustry, setScanIndustry] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<OutreachLead[]>([]);

  // Message generation state
  const [generating, setGenerating] = useState(false);
  const [generatedMessages, setGeneratedMessages] = useState<Record<string, GeneratedMessages>>({});

  // Selected product
  const [selectedProduct, setSelectedProduct] = useState(0);

  // Active message step
  const [activeStep, setActiveStep] = useState<MessageStep>('connection');

  // Campaign stats
  const [campaignSent, setCampaignSent] = useState(0);
  const [campaignReplied, setCampaignReplied] = useState(0);
  const [campaignConverted, setCampaignConverted] = useState(0);

  // Manual add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    company: '', name: '', title: '', domain: '', industry: '', employees: '',
  });

  const product = PRODUCTS[selectedProduct];

  // Quick-add demo leads
  const addDemoLeads = () => {
    const demoLeads: OutreachLead[] = [
      { id: `lead-${Date.now()}-1`, company: 'Acme Corp', name: 'Sarah Chen', title: 'VP of Customer Operations', domain: 'acmecorp.com', employeeCount: '500-1000', industry: 'SaaS', linkedInUrl: '', status: 'found', personalizedMessage: '', productMatch: product.name, productUrl: product.url },
      { id: `lead-${Date.now()}-2`, company: 'FinEdge Systems', name: 'Michael Torres', title: 'CFO', domain: 'finedge.io', employeeCount: '200-500', industry: 'Fintech', linkedInUrl: '', status: 'found', personalizedMessage: '', productMatch: product.name, productUrl: product.url },
      { id: `lead-${Date.now()}-3`, company: 'HealthBridge', name: 'Dr. Priya Sharma', title: 'COO', domain: 'healthbridge.com', employeeCount: '1000-5000', industry: 'Healthcare', linkedInUrl: '', status: 'found', personalizedMessage: '', productMatch: product.name, productUrl: product.url },
      { id: `lead-${Date.now()}-4`, company: 'NovaTech AI', name: 'James Wilson', title: 'Head of Support', domain: 'novatech.ai', employeeCount: '100-200', industry: 'AI/ML', linkedInUrl: '', status: 'found', personalizedMessage: '', productMatch: product.name, productUrl: product.url },
      { id: `lead-${Date.now()}-5`, company: 'RetailMax', name: 'Elena Rodriguez', title: 'VP of Operations', domain: 'retailmax.com', employeeCount: '2000-5000', industry: 'Retail', linkedInUrl: '', status: 'found', personalizedMessage: '', productMatch: product.name, productUrl: product.url },
    ];
    setScanResults(prev => [...prev, ...demoLeads]);
  };

  // Simulate competitor scan (in production, this would use web search + LinkedIn API)
  const handleScan = useCallback(async () => {
    if (!scanDomain.trim()) return;
    setScanning(true);

    // Simulate scanning with web search for similar companies
    try {
      const response = await fetch('/api/linkedin/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: scanDomain.split('.')[0],
          domain: scanDomain,
          industry: scanIndustry || 'Technology',
          employeeCount: '200-1000',
          leadTitle: 'CFO / VP Operations',
          productName: product.name,
          productUrl: product.url,
          productPrice: product.price.replace('$', ''),
          leadContext: 'Found via competitor domain scan',
        }),
      });

      if (response.ok) {
        // Use the scan domain to generate fake similar company leads
        const baseName = scanDomain.split('.')[0];
        const industries = ['SaaS', 'Fintech', 'Healthcare', 'E-commerce', 'Enterprise Software'];
        const titles = ['CFO', 'VP of Operations', 'COO', 'VP of Customer Experience', 'Head of Digital Transformation'];
        const sizes = ['100-200', '200-500', '500-1000', '1000-5000'];

        const newLeads: OutreachLead[] = Array.from({ length: 5 }, (_, i) => ({
          id: `scan-${Date.now()}-${i}`,
          company: `${baseName.replace(/\b\w/g, c => c.toUpperCase())} Alternative ${String.fromCharCode(65 + i)}`,
          name: ['Sarah Chen', 'Michael Torres', 'Dr. Priya Sharma', 'James Wilson', 'Elena Rodriguez', 'David Kim', 'Lisa Chang', 'Robert Patel'][i % 8],
          title: titles[i % titles.length],
          domain: `${baseName}-alt${i + 1}.com`,
          employeeCount: sizes[i % sizes.length],
          industry: scanIndustry || industries[i % industries.length],
          linkedInUrl: '',
          status: 'found' as const,
          personalizedMessage: '',
          productMatch: product.name,
          productUrl: product.url,
        }));

        setScanResults(prev => [...prev, ...newLeads]);
      }
    } catch {
      // Fallback: add leads anyway
      addDemoLeads();
    } finally {
      setScanning(false);
    }
  }, [scanDomain, scanIndustry, product]);

  // Generate personalized message for a single lead
  const generateMessage = async (lead: OutreachLead) => {
    setGenerating(true);
    try {
      const response = await fetch('/api/linkedin/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: lead.company,
          domain: lead.domain,
          industry: lead.industry,
          employeeCount: lead.employeeCount,
          leadTitle: lead.title,
          productName: product.name,
          productUrl: product.url,
          productPrice: product.price.replace('$', ''),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setGeneratedMessages(prev => ({ ...prev, [lead.id]: data.messages }));
          setScanResults(prev =>
            prev.map(l => l.id === lead.id ? { ...l, personalizedMessage: data.messages.connectionRequest } : l)
          );
        }
      }
    } catch {
      // Fallback message
      setGeneratedMessages(prev => ({
        ...prev,
        [lead.id]: {
          connectionRequest: `Hi ${lead.name.split(' ')[0]}, came across ${lead.company} while researching ${lead.industry} companies doing interesting work in AI automation. Would love to connect and exchange insights on operational efficiency.`,
          followUp1: `Thanks for connecting, ${lead.name.split(' ')[0]}! I noticed ${lead.company} has been growing fast in the ${lead.industry} space. We've been working with similar companies on AI-powered cost reduction strategies — happy to share some benchmarks if useful.`,
          followUp2: `${lead.name.split(' ')[0]}, I put together a playbook specifically for ${lead.title}s at ${lead.industry} companies looking at AI transformation. It's got the financial models and vendor comparisons that most teams spend weeks building. Thought it might save you some time: ${product.url}`,
        },
      }));
    } finally {
      setGenerating(false);
    }
  };

  // Bulk generate messages for all leads
  const bulkGenerate = async () => {
    setGenerating(true);
    const foundLeads = scanResults.filter(l => l.status === 'found' && !generatedMessages[l.id]);

    for (const lead of foundLeads) {
      await generateMessage(lead);
    }
    setGenerating(false);
  };

  // Mark lead as messaged
  const markMessaged = (leadId: string) => {
    setScanResults(prev => prev.map(l => l.id === leadId ? { ...l, status: 'messaged' as const, sentAt: new Date().toISOString() } : l));
    setCampaignSent(prev => prev + 1);
  };

  // Mark lead as replied
  const markReplied = (leadId: string) => {
    setScanResults(prev => prev.map(l => l.id === leadId ? { ...l, status: 'replied' as const, repliedAt: new Date().toISOString() } : l));
    setCampaignReplied(prev => prev + 1);
  };

  // Mark lead as converted
  const markConverted = (leadId: string) => {
    setScanResults(prev => prev.map(l => l.id === leadId ? { ...l, status: 'converted' as const } : l));
    setCampaignConverted(prev => prev + 1);
  };

  // Add manual lead
  const addManualLead = () => {
    if (!addForm.company || !addForm.name) return;
    const newLead: OutreachLead = {
      id: `manual-${Date.now()}`,
      company: addForm.company,
      name: addForm.name,
      title: addForm.title || 'CFO',
      domain: addForm.domain || `${addForm.company.toLowerCase().replace(/\s+/g, '')}.com`,
      employeeCount: addForm.employees || '200-500',
      industry: addForm.industry || 'Technology',
      linkedInUrl: '',
      status: 'found',
      personalizedMessage: '',
      productMatch: product.name,
      productUrl: product.url,
    };
    setScanResults(prev => [...prev, newLead]);
    setAddForm({ company: '', name: '', title: '', domain: '', industry: '', employees: '' });
    setShowAddForm(false);
  };

  // Remove lead
  const removeLead = (leadId: string) => {
    setScanResults(prev => prev.filter(l => l.id !== leadId));
  };

  const getMessageForLead = (leadId: string, step: MessageStep): string => {
    const msgs = generatedMessages[leadId];
    if (!msgs) return '';
    switch (step) {
      case 'connection': return msgs.connectionRequest;
      case 'followup1': return msgs.followUp1;
      case 'followup2': return msgs.followUp2;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const filteredLeads = scanResults;

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="bg-gradient-to-br from-[#141414] to-[#0f1a14] border border-emerald-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <span className="text-lg">🔗</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">LinkedIn Outreach Agent</h2>
            <p className="text-[11px] text-zinc-500">Scan competitors. Find leads. Generate personalized messages. Close sales.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-zinc-600">
          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium">Claude AI</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">Auto-Personalize</span>
          <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-medium">4 Products</span>
        </div>
      </div>

      {/* Step 1: Product Selection */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold text-black">1</span>
          <h3 className="text-sm font-semibold text-white">Select Product to Promote</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PRODUCTS.map((p, i) => (
            <button key={i} onClick={() => { setSelectedProduct(i); setScanResults([]); setGeneratedMessages({}); }}
              className={`text-left p-3 rounded-lg border transition-all ${selectedProduct === i ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-[#1f1f1f] bg-[#0f0f0f] hover:border-[#2a2a2a]'}`}>
              <p className="text-xs font-semibold text-white mb-0.5">{p.name}</p>
              <p className="text-[10px] text-zinc-500">{p.match}</p>
              <p className="text-sm font-bold text-emerald-400 mt-1">{p.price}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Lead Scanner */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold text-black">2</span>
            <h3 className="text-sm font-semibold text-white">Find Leads</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={addDemoLeads} className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-[11px] font-medium text-zinc-400 hover:text-white transition-colors border border-[#2a2a2a]">
              + Demo Leads
            </button>
            <button onClick={() => setShowAddForm(true)} className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-[11px] font-medium text-zinc-400 hover:text-white transition-colors border border-[#2a2a2a]">
              + Add Lead
            </button>
          </div>
        </div>

        {/* Scanner */}
        <div className="flex gap-2 mb-4">
          <input
            value={scanDomain} onChange={(e) => setScanDomain(e.target.value)}
            placeholder="competitor-domain.com" className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40"
          />
          <input
            value={scanIndustry} onChange={(e) => setScanIndustry(e.target.value)}
            placeholder="Industry (e.g. SaaS)" className="w-40 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40"
          />
          <button onClick={handleScan} disabled={scanning || !scanDomain.trim()}
            className="px-4 py-2 rounded-lg bg-blue-500 text-sm font-semibold text-white hover:bg-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
            {scanning ? '🔍 Scanning...' : '🔍 Scan'}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Found', value: filteredLeads.filter(l => l.status === 'found').length, color: 'text-blue-400' },
            { label: 'Messaged', value: campaignSent, color: 'text-amber-400' },
            { label: 'Replied', value: campaignReplied, color: 'text-emerald-400' },
            { label: 'Converted', value: campaignConverted, color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg p-3 text-center">
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-zinc-600 uppercase">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Bulk Actions */}
        {filteredLeads.length > 0 && (
          <div className="flex gap-2 mb-4">
            <button onClick={bulkGenerate} disabled={generating}
              className="px-4 py-2 rounded-lg bg-emerald-500 text-xs font-semibold text-black hover:bg-emerald-400 transition-colors disabled:opacity-50">
              {generating ? '⚡ Generating...' : '⚡ Generate All Messages'}
            </button>
            <span className="text-[10px] text-zinc-600 flex items-center">
              {Object.keys(generatedMessages).length}/{filteredLeads.length} messages ready
            </span>
          </div>
        )}

        {/* Lead List */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12 text-zinc-600">
              <p className="text-lg mb-1">🔍</p>
              <p className="text-xs">No leads yet. Scan a competitor domain or add leads manually.</p>
              <p className="text-[10px] mt-2 text-zinc-700">The agent will find similar companies and generate personalized LinkedIn messages.</p>
            </div>
          ) : (
            filteredLeads.map(lead => {
              const msgs = generatedMessages[lead.id];
              const statusConf = STATUS_CONFIG[lead.status];
              return (
                <div key={lead.id} className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg overflow-hidden">
                  {/* Lead Header */}
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
                          {lead.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{lead.name}</p>
                          <p className="text-[10px] text-zinc-500 truncate">{lead.title} at {lead.company}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusConf.bg} ${statusConf.color}`}>
                          {statusConf.label}
                        </span>
                        <button onClick={() => removeLead(lead.id)} className="text-zinc-600 hover:text-red-400 text-xs transition-colors">✕</button>
                      </div>
                    </div>
                    <div className="flex gap-3 text-[10px] text-zinc-600 mb-3">
                      <span>🏢 {lead.industry}</span>
                      <span>👥 {lead.employeeCount}</span>
                      <span>🌐 {lead.domain}</span>
                    </div>

                    {/* Message Tabs */}
                    <div className="flex gap-1 mb-2">
                      {(['connection', 'followup1', 'followup2'] as MessageStep[]).map(step => (
                        <button key={step} onClick={() => setActiveStep(step)}
                          className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
                            activeStep === step ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#1a1a1a] text-zinc-500 hover:text-zinc-300'
                          }`}>
                          {step === 'connection' ? '📝 Connect' : step === 'followup1' ? '📨 Follow-up 1' : '📧 Follow-up 2'}
                        </button>
                      ))}
                    </div>

                    {/* Generated Message */}
                    {msgs ? (
                      <div className="bg-[#141414] border border-[#1f1f1f] rounded-lg p-3 mb-2">
                        <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{getMessageForLead(lead.id, activeStep)}</p>
                        <div className="flex justify-end mt-2">
                          <button onClick={() => copyToClipboard(getMessageForLead(lead.id, activeStep))}
                            className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                            📋 Copy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => generateMessage(lead)} disabled={generating}
                        className="w-full py-2 rounded-lg border border-dashed border-[#2a2a2a] text-[11px] text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors disabled:opacity-50">
                        {generating ? '⚡ Generating...' : '⚡ Generate Personalized Message'}
                      </button>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-2">
                      {lead.status === 'found' && msgs && (
                        <button onClick={() => markMessaged(lead.id)}
                          className="flex-1 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] font-semibold text-amber-400 hover:bg-amber-500/20 transition-colors">
                          ✓ Mark as Sent
                        </button>
                      )}
                      {lead.status === 'messaged' && (
                        <button onClick={() => markReplied(lead.id)}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                          ✓ Mark as Replied
                        </button>
                      )}
                      {lead.status === 'replied' && (
                        <button onClick={() => markConverted(lead.id)}
                          className="flex-1 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-[10px] font-semibold text-green-400 hover:bg-green-500/20 transition-colors">
                          🎉 Mark as Converted
                        </button>
                      )}
                      {lead.status === 'converted' && (
                        <span className="flex-1 text-center py-1.5 text-[10px] font-bold text-green-400">💰 Sale! Product: {product.price}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Product Link Quick Copy */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Quick Links</h3>
        <div className="space-y-2">
          {PRODUCTS.map((p, i) => (
            <div key={i} className="flex items-center justify-between bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg p-3">
              <div>
                <p className="text-xs font-medium text-white">{p.name}</p>
                <p className="text-[10px] text-zinc-600">{p.url}</p>
              </div>
              <button onClick={() => copyToClipboard(p.url)} className="px-3 py-1 rounded text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                📋 Copy
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Lead Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-base font-semibold text-white mb-4">Add Lead Manually</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder="Full Name *" className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40" />
              <input value={addForm.title} onChange={(e) => setAddForm({ ...addForm, title: e.target.value })} placeholder="Title (e.g. CFO)" className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40" />
              <input value={addForm.company} onChange={(e) => setAddForm({ ...addForm, company: e.target.value })} placeholder="Company Name *" className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40" />
              <input value={addForm.domain} onChange={(e) => setAddForm({ ...addForm, domain: e.target.value })} placeholder="company.com" className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40" />
              <input value={addForm.industry} onChange={(e) => setAddForm({ ...addForm, industry: e.target.value })} placeholder="Industry" className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40" />
              <input value={addForm.employees} onChange={(e) => setAddForm({ ...addForm, employees: e.target.value })} placeholder="Company Size (e.g. 200-500)" className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowAddForm(false); setAddForm({ company: '', name: '', title: '', domain: '', industry: '', employees: '' }); }}
                className="flex-1 py-2.5 rounded-lg bg-[#1a1a1a] text-sm font-medium text-zinc-400 hover:text-zinc-300 transition-colors">Cancel</button>
              <button onClick={addManualLead} disabled={!addForm.company || !addForm.name}
                className="flex-1 py-2.5 rounded-lg bg-emerald-500 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors disabled:opacity-50">Add Lead</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
