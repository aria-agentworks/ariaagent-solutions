'use client';

import { useBobStore } from '@/store/useBobStore';
import { Check, Circle } from 'lucide-react';
import type { PipelineStep } from '@/types/bob';

const steps: { key: PipelineStep; label: string; icon: string; desc: string }[] = [
  { key: 'brain', label: 'BRAIN', icon: '🧠', desc: 'Creative Agent' },
  { key: 'hands', label: 'HANDS', icon: '🤲', desc: 'Meta Deployer' },
  { key: 'mouth', label: 'MOUTH', icon: '📢', desc: 'Monitor + Alert' },
];

const stepOrder: PipelineStep[] = ['brain', 'hands', 'mouth'];

export default function PipelineSteps() {
  const { activeStep, setActiveStep, concepts, deployment } = useBobStore();

  const canAccess = (step: PipelineStep): boolean => {
    if (step === 'brain') return true;
    if (step === 'hands') return concepts.length > 0;
    if (step === 'mouth') return deployment !== null;
    return false;
  };

  const currentIndex = stepOrder.indexOf(activeStep);

  return (
    <div className="w-full py-4">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-center gap-0">
          {steps.map((step, index) => {
            const isActive = activeStep === step.key;
            const isCompleted = currentIndex > index;
            const isAccessible = canAccess(step.key);

            return (
              <div key={step.key} className="flex items-center">
                {/* Step Button */}
                <button
                  onClick={() => isAccessible && setActiveStep(step.key)}
                  disabled={!isAccessible}
                  className={`flex items-center gap-2.5 rounded-lg px-4 py-2.5 transition-all ${
                    isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
                  } ${isActive ? 'bg-[#ff6b4a]/10 border border-[#ff6b4a]/30 glow-coral' : 'hover:bg-[#1a1a1a]'}`}
                >
                  <div className="relative">
                    {isCompleted ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4ade80]/20 border border-[#4ade80]/40">
                        <Check className="h-4 w-4 text-[#4ade80]" />
                      </div>
                    ) : isActive ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff6b4a]/20 border border-[#ff6b4a]/40 animate-pulse-dot">
                        <span className="text-sm">{step.icon}</span>
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a1a1a] border border-[#2a2a2a]">
                        <Circle className="h-3 w-3 text-[#555555]" />
                      </div>
                    )}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p
                      className={`text-xs font-bold tracking-wider leading-none ${
                        isActive ? 'text-[#ff6b4a]' : isCompleted ? 'text-[#4ade80]' : 'text-[#555555]'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-[10px] text-[#888888] mt-0.5">{step.desc}</p>
                  </div>
                </button>

                {/* Connector */}
                {index < steps.length - 1 && (
                  <div
                    className={`h-[2px] w-8 sm:w-16 mx-2 transition-colors ${
                      isCompleted ? 'bg-[#4ade80]/40' : 'bg-[#2a2a2a]'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
