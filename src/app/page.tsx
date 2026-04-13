'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePanicStore } from '@/store/usePanicStore';
import Header from '@/components/aria/Header';
import Dashboard from '@/components/aria/Dashboard';
import ThreadFinder from '@/components/aria/ThreadFinder';
import GuideGenerator from '@/components/aria/GuideGenerator';
import ProductManager from '@/components/aria/ProductManager';
import DistributionPlanner from '@/components/aria/DistributionPlanner';
import RevenueTracker from '@/components/aria/RevenueTracker';

export default function Home() {
  const { activeTab } = usePanicStore();

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'threads': return <ThreadFinder />;
      case 'generate': return <GuideGenerator />;
      case 'products': return <ProductManager />;
      case 'distribution': return <DistributionPlanner />;
      case 'revenue': return <RevenueTracker />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <Header />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        <div className="mx-auto max-w-7xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {renderTab()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <footer className="border-t border-[#1f1f1f] bg-[#0a0a0a] px-4 py-3">
        <div className="mx-auto max-w-7xl flex items-center justify-center">
          <p className="text-[10px] text-zinc-600 tracking-wider">
            ARIAAGENT SOLUTIONS v1.0 — Find Pain. Build Solutions. Stack Revenue.
          </p>
        </div>
      </footer>
    </div>
  );
}
