'use client';

import { usePanicStore } from '@/store/usePanicStore';
import type { TabId } from '@/types/product';
import {
  LayoutDashboard,
  Search,
  FileText,
  Package,
  Share2,
  DollarSign,
  Zap,
} from 'lucide-react';

const tabs: { id: TabId; label: string; icon: React.ReactNode; step?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'find-thread', label: 'Find Thread', icon: <Search className="h-4 w-4" />, step: 'Step 1' },
  { id: 'generate-guide', label: 'Generate Guide', icon: <FileText className="h-4 w-4" />, step: 'Steps 2-4' },
  { id: 'my-products', label: 'My Products', icon: <Package className="h-4 w-4" />, step: 'Step 5' },
  { id: 'distribution', label: 'Distribution', icon: <Share2 className="h-4 w-4" />, step: 'Steps 6-8' },
  { id: 'revenue', label: 'Revenue', icon: <DollarSign className="h-4 w-4" />, step: 'Steps 9-10' },
];

export default function Header() {
  const { activeTab, setActiveTab } = usePanicStore();

  return (
    <header className="sticky top-0 z-50 border-b border-[#2a2a2a] bg-[#0a0a0a]/95 backdrop-blur-sm">
      {/* Top bar */}
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">
              Panic Product Builder
            </h1>
            <p className="text-[10px] text-zinc-500 tracking-wider uppercase">
              Find panic. Build product. Make money.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-mono font-medium">
              {'$' + (4810).toLocaleString()} MRR
            </span>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <nav className="px-4 sm:px-6 lg:px-8 overflow-x-auto">
        <div className="flex gap-1 pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap transition-all
                ${
                  activeTab === tab.id
                    ? 'bg-[#141414] text-white border-t border-x border-[#2a2a2a]'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#141414]/50'
                }
              `}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.step && (
                <span className="hidden md:inline text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  {tab.step}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}
