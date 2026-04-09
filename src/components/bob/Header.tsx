'use client';

import { useBobStore } from '@/store/useBobStore';
import { Radio, Wifi, WifiOff, Zap } from 'lucide-react';
import type { PipelineStep } from '@/types/bob';

const stepLabels: Record<PipelineStep, { label: string; icon: string }> = {
  brain: { label: 'BRAIN', icon: '🧠' },
  hands: { label: 'HANDS', icon: '🤲' },
  mouth: { label: 'MOUTH', icon: '📢' },
};

export default function Header() {
  const { activeStep, terminalLines } = useBobStore();
  const lastLine = terminalLines[terminalLines.length - 1];
  const isLive = lastLine?.type !== 'error';

  return (
    <header className="sticky top-0 z-50 border-b border-[#2a2a2a] bg-[#0a0a0a]/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Left — Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff6b4a]/10 border border-[#ff6b4a]/30">
                <Zap className="h-4 w-4 text-[#ff6b4a]" />
              </div>
              <div>
                <h1
                  className="text-base font-bold tracking-tight text-[#fafafa] leading-none"
                  style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                >
                  Bob for Ads
                </h1>
                <p className="text-[10px] text-[#555555] tracking-widest uppercase">
                  Unified AI Agent
                </p>
              </div>
            </div>
          </div>

          {/* Center — Active Module */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-[#141414] border border-[#2a2a2a] px-3 py-1">
              <span className="text-xs">{stepLabels[activeStep].icon}</span>
              <span className="text-[11px] font-bold text-[#ff6b4a] tracking-wider">
                {stepLabels[activeStep].label}
              </span>
            </div>
          </div>

          {/* Right — Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-[#141414] border border-[#2a2a2a] px-2.5 py-1">
                <Radio className="h-3 w-3 text-[#ff6b4a]" />
                <span className="text-[10px] text-[#888888] tracking-wider">LIVE</span>
                <span
                  className={`h-2 w-2 rounded-full ${isLive ? 'bg-[#4ade80]' : 'bg-[#ef4444]'} animate-pulse-dot`}
                />
              </div>
            </div>
            {isLive ? (
              <Wifi className="h-4 w-4 text-[#4ade80]" />
            ) : (
              <WifiOff className="h-4 w-4 text-[#ef4444]" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
