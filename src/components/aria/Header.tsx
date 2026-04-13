'use client';
import { usePanicStore } from '@/store/usePanicStore';
import { formatCurrency } from '@/lib/panic-utils';

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'threads', label: 'Find Thread' },
  { id: 'generate', label: 'Generate Guide' },
  { id: 'products', label: 'My Products' },
  { id: 'distribution', label: 'Distribution' },
  { id: 'revenue', label: 'Revenue' },
];

export default function Header() {
  const { activeTab, setTab, stats } = usePanicStore();

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#1f1f1f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">A</span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">ariaagent solutions</span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-medium text-emerald-400">{formatCurrency(stats.monthlyRevenue)}/mo</span>
            </span>
          </div>
        </div>
        <nav className="flex gap-1 -mb-px overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`relative px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors rounded-t-lg ${
                activeTab === tab.id
                  ? 'text-emerald-400 bg-[#141414]'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#141414]/50'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
