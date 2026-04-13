'use client';

import { useState } from 'react';
import { useBobStore } from '@/store/useBobStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Play, Globe, Sparkles } from 'lucide-react';
import { delay } from '@/lib/bob-utils';
import type { GenerationPhase } from '@/types/bob';

const phases: GenerationPhase[] = [
  { name: 'PARSE', status: 'pending', progress: 0 },
  { name: 'RESEARCH', status: 'pending', progress: 0 },
  { name: 'HOOKS', status: 'pending', progress: 0 },
  { name: 'ART', status: 'pending', progress: 0 },
  { name: 'IMAGES', status: 'pending', progress: 0 },
];

export default function CreativeGenerator() {
  const {
    url,
    setUrl,
    brandName,
    setBrandName,
    isGenerating,
    setIsGenerating,
    setConcepts,
    setActiveStep,
    addTerminalLine,
    setGenerationPhases,
    generationPhases,
  } = useBobStore();

  const [phaseProgress, setPhaseProgress] = useState<GenerationPhase[]>(phases);

  const handleGenerate = async () => {
    if (!url.trim()) return;

    setIsGenerating(true);
    const newPhases = phases.map((p) => ({ ...p }));
    setPhaseProgress(newPhases);
    setGenerationPhases(newPhases);

    addTerminalLine({ type: 'command', text: `bob generate --url "${url}"` });

    try {
      // Call API
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, brandName: brandName || undefined }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      // Simulate phases while waiting for API
      const phaseNames = ['PARSE', 'RESEARCH', 'HOOKS', 'ART', 'IMAGES'];
      const phaseMessages = [
        'Parsing brand website...',
        'Analyzing brand positioning and competitors...',
        'Generating ad hooks (6 hook types)...',
        'Crafting ad copy and headlines...',
        'Generating ad creative images...',
      ];

      for (let i = 0; i < phaseNames.length; i++) {
        addTerminalLine({
          type: 'command',
          text: `[${phaseNames[i]}] ${phaseMessages[i]}`,
        });

        setPhaseProgress((prev) =>
          prev.map((p, idx) => (idx === i ? { ...p, status: 'running', progress: 50 } : p))
        );

        await delay(1200);

        setPhaseProgress((prev) =>
          prev.map((p, idx) => (idx === i ? { ...p, status: 'complete', progress: 100 } : p))
        );

        addTerminalLine({ type: 'success', text: `✓ ${phaseNames[i]} complete` });
      }

      const data = await res.json();
      setConcepts(data.concepts);

      addTerminalLine({
        type: 'success',
        text: `✓ Generated ${data.concepts.length} ad concepts successfully`,
      });
      addTerminalLine({
        type: 'info',
        text: 'Select concepts and proceed to HANDS for deployment',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addTerminalLine({ type: 'error', text: `✗ Generation failed: ${msg}` });

      // Fallback: use demo data
      addTerminalLine({ type: 'info', text: 'Loading demo concepts...' });
      const demoRes = await fetch('/api/generate');
      if (demoRes.ok) {
        const demoData = await demoRes.json();
        setConcepts(demoData.concepts);
        addTerminalLine({ type: 'success', text: `✓ Loaded ${demoData.concepts.length} demo concepts` });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-6">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff6b4a]/10 border border-[#ff6b4a]/30">
            <Sparkles className="h-5 w-5 text-[#ff6b4a]" />
          </div>
          <div>
            <h2
              className="text-lg font-bold text-[#fafafa] leading-none"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            >
              Creative Generator
            </h2>
            <p className="text-xs text-[#888888] mt-0.5">
              Enter a brand URL to generate 6 AI-powered ad concepts
            </p>
          </div>
        </div>

        {/* Input Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-[#888888] tracking-wider uppercase">
              Brand URL *
            </Label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-[#555555]" />
              <Textarea
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                disabled={isGenerating}
                className="min-h-[80px] resize-none bg-[#0a0a0a] border-[#2a2a2a] text-[#fafafa] placeholder:text-[#555555] font-mono text-sm pl-10 focus:border-[#ff6b4a] focus:ring-[#ff6b4a]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-[#888888] tracking-wider uppercase">
                Brand Name (optional)
              </Label>
              <Input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Acme Inc."
                disabled={isGenerating}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-[#fafafa] placeholder:text-[#555555] font-mono text-sm focus:border-[#ff6b4a] focus:ring-[#ff6b4a]/20"
              />
            </div>
          </div>
        </div>

        {/* Phase Progress */}
        {isGenerating && (
          <div className="mt-6 p-4 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]">
            <p className="text-[10px] text-[#555555] tracking-widest uppercase mb-3">
              Pipeline Progress
            </p>
            <div className="space-y-2">
              {phaseProgress.map((phase, i) => (
                <div key={phase.name} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <span
                    className={`text-[10px] w-16 tracking-wider font-bold ${
                      phase.status === 'complete'
                        ? 'text-[#4ade80]'
                        : phase.status === 'running'
                          ? 'text-[#ff6b4a]'
                          : 'text-[#555555]'
                    }`}
                  >
                    {phase.status === 'complete' ? '✓' : phase.status === 'running' ? '●' : '○'}{' '}
                    {phase.name}
                  </span>
                  <div className="flex-1 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        phase.status === 'complete'
                          ? 'bg-[#4ade80]'
                          : phase.status === 'running'
                            ? 'bg-[#ff6b4a]'
                            : 'bg-transparent'
                      }`}
                      style={{ width: `${phase.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Execute Button */}
        <div className="mt-6 flex items-center gap-3">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !url.trim()}
            className="bg-[#ff6b4a] hover:bg-[#cc5038] text-white font-bold tracking-wider uppercase text-sm px-8 py-2.5 rounded-lg glow-coral transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Execute
              </>
            )}
          </Button>
          {!isGenerating && !url.trim() && (
            <span className="text-[11px] text-[#555555]">
              Enter a brand URL to get started
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
