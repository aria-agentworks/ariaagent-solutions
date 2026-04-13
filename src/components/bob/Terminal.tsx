'use client';

import { useEffect, useRef } from 'react';
import { useBobStore } from '@/store/useBobStore';
import { getTerminalColor } from '@/lib/bob-utils';

export default function Terminal() {
  const { terminalLines, clearTerminal } = useBobStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalLines]);

  return (
    <div className="w-full border-t border-[#2a2a2a] bg-[#0a0a0a]">
      {/* Terminal Header */}
      <div className="flex items-center justify-between border-b border-[#2a2a2a] px-4 py-1.5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#ef4444]/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#4ade80]/60" />
          </div>
          <span className="text-[10px] text-[#555555] tracking-widest ml-2 uppercase">
            Terminal
          </span>
        </div>
        <button
          onClick={clearTerminal}
          className="text-[10px] text-[#555555] hover:text-[#888888] transition-colors tracking-wider uppercase"
        >
          Clear
        </button>
      </div>

      {/* Terminal Body */}
      <div
        ref={scrollRef}
        className="terminal-scanlines h-40 overflow-y-auto px-4 py-2 font-mono text-[12px] leading-relaxed"
      >
        {terminalLines.length === 0 ? (
          <div className="text-[#555555]">
            <span className="text-[#ff6b4a]">$</span> Bob for Ads v1.0 — Ready
          </div>
        ) : (
          terminalLines.map((line) => (
            <div
              key={line.id}
              className="animate-fade-in flex gap-3"
            >
              <span className="text-[#555555] shrink-0 text-[10px] pt-0.5 w-14 text-right tabular-nums">
                {line.timestamp}
              </span>
              <span className={getTerminalColor(line.type)}>
                {line.type === 'command' && <span className="text-[#555555]">$ </span>}
                {line.text}
              </span>
            </div>
          ))
        )}

        {/* Blinking cursor */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[#ff6b4a]">$</span>
          <div className="h-4 w-2 bg-[#ff6b4a] animate-pulse" />
        </div>
      </div>
    </div>
  );
}
