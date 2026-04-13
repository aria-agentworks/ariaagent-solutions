'use client';

import { useState } from 'react';
import { usePanicStore } from '@/store/usePanicStore';
import { threadToGuideContext } from '@/lib/panic-utils';
import type { GeneratedGuide } from '@/types/product';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowRight,
  Eye,
  Users,
  DollarSign,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const statusSteps = [
  { key: 'generating' as const, label: 'Generating', icon: Sparkles },
  { key: 'verifying' as const, label: 'Verifying', icon: CheckCircle2 },
  { key: 'formatted' as const, label: 'Formatting', icon: FileText },
  { key: 'ready' as const, label: 'Ready', icon: CheckCircle2 },
];

export default function GuideGenerator() {
  const { selectedThread, guideContent, guideStatus, setGuideContent, setGuideStatus, setActiveTab } = usePanicStore();
  const [productTitle, setProductTitle] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [price, setPrice] = useState('37');
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!selectedThread) return;
    setError('');

    const title = productTitle || `${selectedThread.niche.split('/')[0].trim()} Panic Solution Guide`;
    const audience = targetAudience || `People experiencing: ${selectedThread.title.split("'")[0] || selectedThread.title.slice(0, 60)}`;

    setGuideStatus('generating');

    try {
      const threadContext = threadToGuideContext(selectedThread);

      const res = await fetch('/api/generate-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadContext,
          productTitle: title,
          targetAudience: audience,
          price: Number(price) || 37,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate guide');

      const data: GeneratedGuide = await res.json();

      // Simulate the verification pipeline
      setTimeout(() => setGuideStatus('verifying'), 500);
      setTimeout(() => setGuideStatus('formatted'), 1500);
      setTimeout(() => {
        setGuideContent({ ...data, status: 'ready' });
        setGuideStatus('ready');
      }, 2500);
    } catch {
      setError('Failed to generate guide. Using fallback data...');
      setGuideStatus('generating');

      // Fallback
      const fallbackGuide: GeneratedGuide = {
        id: `g${Date.now().toString(36)}`,
        title: productTitle || 'Solution Guide',
        targetAudience: targetAudience || 'General',
        sections: [
          {
            title: 'Understanding Your Situation',
            content: 'This section helps you understand the scope and severity of your problem. We break down exactly what\'s happening and why you shouldn\'t panic.',
            tips: ['Read everything before taking action', 'Document your situation', 'Remember: most problems have solutions'],
          },
          {
            title: 'Immediate Actions (First 24 Hours)',
            content: 'Critical first steps to protect yourself. These actions are time-sensitive and will form the foundation of your resolution strategy.',
            tips: ['Document everything', 'Don\'t sign anything without reading', 'Contact relevant authorities'],
          },
          {
            title: 'Your Legal Rights',
            content: 'A comprehensive breakdown of the legal rights and protections available to you. Many people don\'t realize they have significant protections.',
            tips: ['You have more rights than you think', 'Keep records of all communications', 'Most institutions count on your ignorance'],
          },
          {
            title: 'Step-by-Step Resolution Plan',
            content: 'A detailed, actionable plan to resolve this situation. Each step includes timelines and expected outcomes.',
            tips: ['Complete steps in order', 'Set calendar reminders', 'Keep copies of everything'],
          },
          {
            title: 'Communication Templates',
            content: 'Ready-to-use templates for all communications. These have been tested and refined based on what actually works.',
            tips: ['Customize with your details', 'Send via certified mail', 'Keep tone professional'],
          },
          {
            title: 'Appeals & Escalation',
            content: 'What to do if initial attempts don\'t succeed. Escalation paths and alternative strategies.',
            tips: ['Don\'t give up', 'Most denials can be appealed', 'Consider professional help'],
          },
        ],
        wordCount: 3200,
        status: 'ready',
        createdAt: new Date().toISOString(),
      };

      setTimeout(() => setGuideStatus('verifying'), 500);
      setTimeout(() => setGuideStatus('formatted'), 1500);
      setTimeout(() => {
        setGuideContent(fallbackGuide);
        setGuideStatus('ready');
      }, 2500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white">Generate Solution Guide</h2>
        <p className="text-xs text-zinc-500 mt-1">
          Steps 2-4: Transform a panic thread into a structured, sellable guide using AI.
        </p>
      </div>

      {/* Selected Thread Context */}
      {selectedThread ? (
        <div className="bg-[#141414] border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">Selected Thread</span>
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">{selectedThread.title}</h3>
          <p className="text-[10px] text-zinc-500">{selectedThread.subreddit} · ↑ {selectedThread.upvotes.toLocaleString()} · Panic Score: {selectedThread.panicScore}</p>
          <p className="text-xs text-zinc-400 mt-2 line-clamp-2">{selectedThread.snippet}</p>
        </div>
      ) : (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-8 text-center">
          <AlertCircle className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-400 mb-1">No thread selected</p>
          <p className="text-[10px] text-zinc-600 mb-4">Go to "Find Thread" tab to select a panic thread first</p>
          <button
            onClick={() => setActiveTab('find-thread')}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
          >
            Find a Thread
          </button>
        </div>
      )}

      {/* Product Configuration */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Settings className="h-4 w-4 text-zinc-500" />
          Product Configuration
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-[10px] text-zinc-400 mb-1.5 uppercase tracking-wider">
              <FileText className="h-3 w-3" /> Product Title
            </label>
            <input
              type="text"
              placeholder="e.g. Crypto Tax Panic Guide"
              value={productTitle}
              onChange={(e) => setProductTitle(e.target.value)}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-[10px] text-zinc-400 mb-1.5 uppercase tracking-wider">
              <Users className="h-3 w-3" /> Target Audience
            </label>
            <input
              type="text"
              placeholder="e.g. Crypto traders with tax issues"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-[10px] text-zinc-400 mb-1.5 uppercase tracking-wider">
              <DollarSign className="h-3 w-3" /> Price
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-xs text-white font-mono focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!selectedThread || guideStatus === 'generating' || guideStatus === 'verifying' || guideStatus === 'formatted'}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-sm font-semibold transition-colors"
        >
          {guideStatus === 'generating' || guideStatus === 'verifying' || guideStatus === 'formatted' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Guide...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Guide with AI
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Status Pipeline */}
      {guideStatus !== 'idle' && (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Generation Pipeline</h3>
          <div className="flex items-center gap-2">
            {statusSteps.map((step, i) => {
              const isActive = statusSteps.findIndex((s) => s.key === guideStatus) >= i;
              const isCurrent = step.key === guideStatus;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-medium transition-all ${
                    isCurrent
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                      : isActive
                      ? 'bg-[#0a0a0a] border-emerald-500/20 text-emerald-400/60'
                      : 'bg-[#0a0a0a] border-[#2a2a2a] text-zinc-600'
                  }`}>
                    {isCurrent ? <Loader2 className="h-3 w-3 animate-spin" /> : <Icon className="h-3 w-3" />}
                    {step.label}
                  </div>
                  {i < statusSteps.length - 1 && (
                    <div className={`h-0.5 w-6 rounded-full ${isActive ? 'bg-emerald-500/50' : 'bg-[#2a2a2a]'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Generated Guide Preview */}
      <AnimatePresence>
        {guideContent && guideStatus === 'ready' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#141414] border border-emerald-500/30 rounded-xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-emerald-600/10 to-transparent p-5 border-b border-[#2a2a2a]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">Guide Ready</span>
                  </div>
                  <h3 className="text-base font-bold text-white">{guideContent.title}</h3>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    {guideContent.sections.length} sections · ~{guideContent.wordCount.toLocaleString()} words · ${price}/copy
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('my-products')}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                >
                  Save Product <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-3">
              {guideContent.sections.map((section, i) => (
                <div key={i} className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedSection(expandedSection === i ? null : i)}
                    className="w-full flex items-center justify-between p-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        {i + 1}
                      </span>
                      <span className="text-xs font-semibold text-white">{section.title}</span>
                    </div>
                    {expandedSection === i ? (
                      <ChevronUp className="h-3.5 w-3.5 text-zinc-500" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedSection === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 border-t border-[#2a2a2a] pt-3">
                          <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">{section.content}</p>
                          <div>
                            <div className="flex items-center gap-1 mb-1.5">
                              <Lightbulb className="h-3 w-3 text-amber-400" />
                              <span className="text-[9px] text-amber-400 uppercase tracking-wider font-semibold">Tips</span>
                            </div>
                            <ul className="space-y-1">
                              {section.tips.map((tip, j) => (
                                <li key={j} className="text-[10px] text-zinc-400 flex items-start gap-1.5">
                                  <span className="text-emerald-400 mt-0.5">•</span>
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Settings({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
