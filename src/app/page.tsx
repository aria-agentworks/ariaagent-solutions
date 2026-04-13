'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useBobStore } from '@/store/useBobStore';
import Header from '@/components/bob/Header';
import PipelineSteps from '@/components/bob/PipelineSteps';
import Terminal from '@/components/bob/Terminal';
import ImageLightbox from '@/components/bob/ImageLightbox';
import CreativeGenerator from '@/components/bob/CreativeGenerator';
import ConceptCards from '@/components/bob/ConceptCards';
import CampaignDeployer from '@/components/bob/CampaignDeployer';
import MonitorDashboard from '@/components/bob/MonitorDashboard';

export default function Home() {
  const { activeStep } = useBobStore();

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <Header />

      {/* Pipeline Steps */}
      <PipelineSteps />

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
        <div className="mx-auto max-w-7xl">
          <AnimatePresence mode="wait">
            {activeStep === 'brain' && (
              <motion.div
                key="brain"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <CreativeGenerator />
                <ConceptCards />
              </motion.div>
            )}

            {activeStep === 'hands' && (
              <motion.div
                key="hands"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <CampaignDeployer />
              </motion.div>
            )}

            {activeStep === 'mouth' && (
              <motion.div
                key="mouth"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <MonitorDashboard />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Terminal */}
      <Terminal />

      {/* Footer */}
      <footer className="border-t border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-[#555555] tracking-wider">
            BOB FOR ADS v1.0 — Unified Meta Ads AI Agent
          </p>
          <div className="flex items-center gap-3">
            {['Next.js 16', 'TypeScript', 'Tailwind CSS', 'shadcn/ui', 'Zustand', 'Framer Motion'].map((tech) => (
              <span
                key={tech}
                className="text-[9px] px-2 py-0.5 rounded bg-[#141414] border border-[#2a2a2a] text-[#555555]"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </footer>

      {/* Lightbox */}
      <ImageLightbox />
    </div>
  );
}
