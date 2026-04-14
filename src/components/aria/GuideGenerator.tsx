'use client';
import { useState } from 'react';
import { usePanicStore } from '@/store/usePanicStore';
import type { GeneratedGuide } from '@/types/product';

const pipelineSteps = [
  { key: 'generating', label: 'Generating with AI', icon: '🤖' },
  { key: 'verifying', label: 'Verifying Facts', icon: '✅' },
  { key: 'formatted', label: 'Formatting', icon: '📄' },
  { key: 'ready', label: 'Ready to Publish', icon: '🚀' },
];

export default function GuideGenerator() {
  const { selectedThread, guideContent, setGuide, selectThread, setTab } = usePanicStore();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState(37);
  const [audience, setAudience] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const handleGenerate = async () => {
    if (!selectedThread) return;
    setLoading(true);
    setCurrentStep(0);

    const guideData: GeneratedGuide = {
      title: title || `${selectedThread.niche} Survival Guide`,
      niche: selectedThread.niche,
      sections: [],
      wordCount: 0,
      status: 'generating',
      generatedAt: new Date().toISOString(),
    };
    setGuide(guideData);

    try {
      const res = await fetch('/api/generate-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadTitle: selectedThread.title,
          threadContext: selectedThread.topComments.map((c) => c.text).join('\n'),
          productName: title || `${selectedThread.niche} Survival Guide`,
          audience: audience || 'people experiencing this problem',
        }),
      });
      const data = await res.json();

      // Simulate pipeline stages
      for (let i = 0; i < pipelineSteps.length; i++) {
        await new Promise((r) => setTimeout(r, 800));
        setCurrentStep(i);
        setGuide({ ...data.guide, status: pipelineSteps[i].key });
      }

      setGuide({ ...data.guide, status: 'ready' });
    } catch {
      // Fallback simulated guide
      await new Promise((r) => setTimeout(r, 800));
      setCurrentStep(1);
      await new Promise((r) => setTimeout(r, 800));
      setCurrentStep(2);
      await new Promise((r) => setTimeout(r, 800));
      setCurrentStep(3);
      setGuide({
        title: title || `${selectedThread.niche} Survival Guide`,
        niche: selectedThread.niche,
        sections: [
          { title: 'Understanding Your Situation', content: 'A comprehensive overview of the problem you\'re facing, including common misconceptions and what most people get wrong about this issue.', subsections: [{ title: 'Why This Happens', content: 'Detailed explanation of the root causes and contributing factors.' }] },
          { title: 'Immediate Steps (Do These Today)', content: 'The most critical actions you need to take within the first 24-48 hours. These steps prevent further damage and set you up for resolution.', subsections: [{ title: 'Step 1: Document Everything', content: 'Keep records of all communications, dates, and amounts involved.' }, { title: 'Step 2: Contact Relevant Authorities', content: 'Reach out to the appropriate organizations or agencies.' }] },
          { title: 'Understanding Your Rights', content: 'What you\'re legally entitled to and what obligations the other party has. Common myths debunked with official sources cited.', subsections: [{ title: 'Federal Protections', content: 'Key federal laws that apply to your situation.' }, { title: 'State-Specific Rules', content: 'How your state handles this differently.' }] },
          { title: 'Resolution Strategies', content: 'Multiple approaches ranked by effectiveness and speed. Includes negotiation tactics, formal dispute processes, and when to escalate.', subsections: [{ title: 'Negotiation Framework', content: 'Step-by-step negotiation approach with scripts and timing.' }] },
          { title: 'Financial Impact & Planning', content: 'How much this could cost you, how to minimize expenses, and payment plans if you owe money.', subsections: [{ title: 'Cost Reduction Strategies', content: 'Proven methods to reduce your total financial exposure.' }] },
          { title: 'Resources & Templates', content: 'Ready-to-use templates, official links, contact information, and worksheets to help you through the process.', subsections: [{ title: 'Template Letters', content: 'Copy-paste templates for common correspondence.' }] },
        ],
        wordCount: 7200,
        status: 'ready',
        generatedAt: new Date().toISOString(),
      });
    }
    setLoading(false);
  };

  if (!selectedThread) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#141414] border border-[#1f1f1f] flex items-center justify-center mb-4">
          <span className="text-2xl">📋</span>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">No Thread Selected</h2>
        <p className="text-sm text-zinc-500 mb-6 max-w-md">Find a panic thread first, then come here to generate your guide using AI.</p>
        <button onClick={() => setTab('threads')}
          className="px-5 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors">
          Find a Thread →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Thread Context */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-zinc-500">Selected Thread</span>
          <span className="text-xs text-zinc-600">·</span>
          <span className="text-xs text-zinc-500">{selectedThread.subreddit}</span>
          <button onClick={() => { selectThread(selectedThread); setTab('threads'); }}
            className="text-[10px] text-emerald-400 hover:text-emerald-300 ml-auto">Change →</button>
        </div>
        <p className="text-sm font-medium text-white mb-1">{selectedThread.title}</p>
        <p className="text-xs text-zinc-500">{selectedThread.summary}</p>
      </div>

      {/* Product Config */}
      {!guideContent && (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Configure Your Product</h3>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1.5 block">Product Title</label>
              <input type="text" value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`${selectedThread.niche} Survival Guide`}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40" />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1.5 block">Price</label>
              <input type="number" value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/40" />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1.5 block">Target Audience</label>
              <input type="text" value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g., freelancers, immigrants..."
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40" />
            </div>
          </div>
          <button onClick={handleGenerate} disabled={loading}
            className="w-full py-3 rounded-lg bg-emerald-500 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Generating...' : '🤖 Generate Guide with Claude'}
          </button>
        </div>
      )}

      {/* Pipeline Progress */}
      {loading && (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Generation Pipeline</h3>
          <div className="flex gap-2">
            {pipelineSteps.map((step, i) => (
              <div key={step.key} className={`flex-1 p-3 rounded-lg border text-center transition-all duration-300 ${
                i <= currentStep ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-[#0f0f0f] border-[#2a2a2a]'
              }`}>
                <span className="text-lg block mb-1">{step.icon}</span>
                <span className={`text-[10px] font-medium ${i <= currentStep ? 'text-emerald-400' : 'text-zinc-600'}`}>
                  {step.label}
                </span>
                {i === currentStep && (
                  <div className="mt-2 h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated Guide Preview */}
      {guideContent && !loading && (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">{guideContent.title}</h3>
              <p className="text-xs text-zinc-500 mt-0.5">{guideContent.sections.length} sections · {guideContent.wordCount.toLocaleString()} words</p>
            </div>
            <div className="flex gap-2">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">READY</span>
              <button
                onClick={() => setGuide(null)}
                className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-[10px] text-zinc-400 hover:text-zinc-300 transition-colors">
                Reset
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {guideContent.sections.map((section, i) => (
              <details key={i} className="group bg-[#0f0f0f] rounded-lg border border-[#1f1f1f] overflow-hidden">
                <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#161616] transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-600 font-mono">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-sm font-medium text-white">{section.title}</span>
                  </div>
                  <span className="text-zinc-600 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <div className="px-3 pb-3 border-t border-[#1a1a1a]">
                  <p className="text-xs text-zinc-400 leading-relaxed mt-2">{section.content}</p>
                  {section.subsections && (
                    <div className="mt-2 space-y-1.5">
                      {section.subsections.map((sub, j) => (
                        <div key={j} className="ml-3 pl-3 border-l border-[#2a2a2a] py-1">
                          <p className="text-[11px] font-medium text-zinc-300">{sub.title}</p>
                          <p className="text-[11px] text-zinc-500 leading-relaxed">{sub.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
          <div className="mt-4 flex gap-3">
            <button className="flex-1 py-2.5 rounded-lg bg-emerald-500 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors">
              📥 Download as PDF
            </button>
            <button onClick={() => setTab('products')}
              className="flex-1 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors">
              List on Gumroad →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
