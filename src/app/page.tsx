'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useMarketingStore } from '@/store/useMarketingStore';
import Sidebar from '@/components/marketing/Sidebar';
import DashboardView from '@/components/marketing/DashboardView';
import FindLeadsView from '@/components/marketing/FindLeadsView';
import EnrichLeadsView from '@/components/marketing/EnrichLeadsView';
import OutreachView from '@/components/marketing/OutreachView';
import PipelineView from '@/components/marketing/PipelineView';
import RevenueView from '@/components/marketing/RevenueView';

export default function Home() {
  const { activeView } = useMarketingStore();

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView />;
      case 'find-leads': return <FindLeadsView />;
      case 'enrich': return <EnrichLeadsView />;
      case 'outreach': return <OutreachView />;
      case 'pipeline': return <PipelineView />;
      case 'revenue': return <RevenueView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="p-6"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
