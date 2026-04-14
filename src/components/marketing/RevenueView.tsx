'use client';
import { useMarketingStore } from '@/store/useMarketingStore';

export default function RevenueView() {
  const { projects } = useMarketingStore();

  const totalRevenue = projects.reduce((s, p) => s + p.stats.revenue, 0);
  const totalConversions = projects.reduce((s, p) => s + p.stats.conversions, 0);
  const totalSales = projects.reduce((s, p) => s + p.stats.leads, 0);
  const maxRevenue = Math.max(...projects.map((p) => p.price * 10), 1);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-white">Revenue</h1>
        <p className="text-xs text-zinc-500 mt-1">Gumroad product performance and revenue tracking.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-green-400">${totalRevenue}</p>
          <p className="text-[10px] text-zinc-600 mt-1">from {totalConversions} conversions</p>
        </div>
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Products</p>
          <p className="text-3xl font-bold text-emerald-400">{projects.length}</p>
          <p className="text-[10px] text-zinc-600 mt-1">{projects.filter((p) => p.status === 'active').length} active</p>
        </div>
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Pipeline Value</p>
          <p className="text-3xl font-bold text-amber-400">${projects.reduce((s, p) => s + p.price * p.stats.leads, 0).toLocaleString()}</p>
          <p className="text-[10px] text-zinc-600 mt-1">{totalSales} leads in pipeline</p>
        </div>
      </div>

      {/* Product Revenue Breakdown */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Product Performance</h3>
        <div className="space-y-4">
          {projects.map((product) => (
            <div key={product.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-bold text-white shrink-0">${product.price}</span>
                  <p className="text-xs text-zinc-400 truncate">{product.name}</p>
                </div>
                <div className="flex gap-3 shrink-0 text-[10px] text-zinc-500">
                  <span>{product.stats.conversions} sold</span>
                  <span className="text-green-400 font-semibold">${product.stats.revenue}</span>
                </div>
              </div>
              <div className="w-full h-2 bg-[#0f0f0f] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                  style={{ width: `${Math.max((product.stats.revenue / maxRevenue) * 100, 2)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Cards */}
      <div className="grid grid-cols-2 gap-4">
        {projects.map((product) => (
          <div key={product.id} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-white">{product.name}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{product.description}</p>
              </div>
              <span className="text-lg font-bold text-emerald-400 shrink-0">${product.price}</span>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: 'Leads', value: product.stats.leads },
                { label: 'Sent', value: product.stats.messagesSent },
                { label: 'Replies', value: product.stats.replies },
                { label: 'Sales', value: product.stats.conversions },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#0f0f0f] rounded-lg p-2 text-center">
                  <p className="text-sm font-bold text-white">{stat.value}</p>
                  <p className="text-[9px] text-zinc-600">{stat.label}</p>
                </div>
              ))}
            </div>

            <a href={product.gumroadUrl || product.url} target="_blank" rel="noopener noreferrer"
              className="block text-center py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors">
              🔗 View on Gumroad
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
