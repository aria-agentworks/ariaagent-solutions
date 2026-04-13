'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePanicStore } from '@/store/usePanicStore';
import Header from '@/components/panic/Header';
import Dashboard from '@/components/panic/Dashboard';
import ThreadFinder from '@/components/panic/ThreadFinder';
import GuideGenerator from '@/components/panic/GuideGenerator';
import ProductManager from '@/components/panic/ProductManager';
import DistributionPlanner from '@/components/panic/DistributionPlanner';
import RevenueTracker from '@/components/panic/RevenueTracker';
import { Zap } from 'lucide-react';

export default function Home() {
  const { activeTab } = usePanicStore();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'find-thread':
        return <ThreadFinder />;
      case 'generate-guide':
        return <GuideGenerator />;
      case 'my-products':
        return <ProductManager />;
      case 'distribution':
        return <DistributionPlanner />;
      case 'revenue':
        return <RevenueTracker />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
        <div className="mx-auto max-w-6xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 mt-auto">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-zinc-600 tracking-wider flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-emerald-500" />
            PANIC PRODUCT BUILDER v1.0 — Find Panic. Build Product. Make Money.
          </p>
          <div className="flex items-center gap-3">
            {['Next.js 16', 'TypeScript', 'Tailwind CSS', 'shadcn/ui', 'Zustand', 'Claude AI'].map((tech) => (
              <span
                key={tech}
                className="text-[9px] px-2 py-0.5 rounded bg-[#141414] border border-[#2a2a2a] text-zinc-600"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
