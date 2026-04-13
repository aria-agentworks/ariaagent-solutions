'use client';
import { usePanicStore } from '@/store/usePanicStore';
import { formatCurrency, formatNumber, getPanicColor, getPanicLabel } from '@/lib/panic-utils';

const statCards = [
  { key: 'totalProducts', label: 'Total Products', icon: '📦', color: 'text-blue-400' },
  { key: 'monthlyRevenue', label: 'Monthly Revenue', icon: '💰', color: 'text-emerald-400', format: true },
  { key: 'activePages', label: 'Active Pages', icon: '📡', color: 'text-purple-400' },
  { key: 'avgBuildTime', label: 'Avg Build Time', icon: '⚡', color: 'text-amber-400' },
];

export default function Dashboard() {
  const { stats, threads, products, revenueHistory, setTab, selectThread } = usePanicStore();

  const maxRevenue = Math.max(...revenueHistory.map((r) => r.revenue));
  const hottestThread = [...threads].sort((a, b) => b.panicScore - a.panicScore)[0];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card) => {
          const val = stats[card.key as keyof typeof stats];
          return (
            <div key={card.key} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{card.icon}</span>
                <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{card.label}</span>
              </div>
              <p className={`text-2xl font-bold ${card.color}`}>
                {card.format ? formatCurrency(val as number) : val}
              </p>
            </div>
          );
        })}
      </div>

      {/* Revenue Chart + Hottest Thread */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Revenue Growth</h3>
            <span className="text-xs text-emerald-400 font-medium">+{stats.revenueGrowth}% this month</span>
          </div>
          <div className="flex items-end gap-2 h-40">
            {revenueHistory.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-zinc-500 font-medium">{formatCurrency(m.revenue)}</span>
                <div
                  className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-500 hover:from-emerald-500 hover:to-emerald-300"
                  style={{ height: `${(m.revenue / maxRevenue) * 100}%` }}
                />
                <span className="text-[10px] text-zinc-600">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hottest Thread */}
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">🔥 Hottest Thread</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPanicColor(hottestThread.panicScore)}`}>
              {getPanicLabel(hottestThread.panicScore)}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mb-1">{hottestThread.subreddit} · {formatNumber(hottestThread.upvotes)} upvotes</p>
          <p className="text-sm font-medium text-white mb-3 leading-snug">{hottestThread.title}</p>
          <p className="text-xs text-zinc-500 mb-4 leading-relaxed">{hottestThread.summary}</p>
          <button
            onClick={() => selectThread(hottestThread)}
            className="w-full py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            Build Guide From This →
          </button>
        </div>
      </div>

      {/* Products Grid + Playbook */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Products</h3>
            <button onClick={() => setTab('products')} className="text-xs text-emerald-400 hover:text-emerald-300">View all →</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {products.map((p) => (
              <div key={p.id} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium text-zinc-500 uppercase">{p.niche}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    p.status === 'live' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' :
                    p.status === 'listed' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' :
                    'text-zinc-400 bg-zinc-400/10 border-zinc-400/20'
                  }`}>{p.status}</span>
                </div>
                <p className="text-sm font-medium text-white mb-2 leading-snug">{p.title}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">${p.price}</span>
                  {p.revenue > 0 && <span className="text-xs font-medium text-emerald-400">{formatCurrency(p.revenue)}/mo</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Playbook Card */}
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">📋 The Playbook</h3>
          <ol className="space-y-2 text-xs text-zinc-400 leading-relaxed">
            <li className="flex gap-2"><span className="text-emerald-400 font-bold">1.</span> Find a panic thread on Reddit</li>
            <li className="flex gap-2"><span className="text-emerald-400 font-bold">2.</span> Use Claude to generate a guide</li>
            <li className="flex gap-2"><span className="text-emerald-400 font-bold">3.</span> Verify facts, format as PDF</li>
            <li className="flex gap-2"><span className="text-emerald-400 font-bold">4.</span> List on Gumroad for $37</li>
            <li className="flex gap-2"><span className="text-emerald-400 font-bold">5.</span> Distribute via niche Twitter page</li>
            <li className="flex gap-2"><span className="text-emerald-400 font-bold">6.</span> Repeat & stack revenue</li>
          </ol>
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <p className="text-[11px] text-emerald-400 font-medium">Target: 5-10 products × $2-8K/mo each</p>
          </div>
        </div>
      </div>
    </div>
  );
}
