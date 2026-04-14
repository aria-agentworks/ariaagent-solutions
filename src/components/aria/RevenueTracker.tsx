'use client';
import { usePanicStore } from '@/store/usePanicStore';
import { formatCurrency, calculateStackAnalysis } from '@/lib/panic-utils';

export default function RevenueTracker() {
  const { revenueHistory, products, stats } = usePanicStore();

  const maxRevenue = Math.max(...revenueHistory.map((r) => r.revenue));
  const totalRevenue = revenueHistory.reduce((s, r) => s + r.revenue, 0);
  const avgPerProduct = stats.monthlyRevenue / Math.max(1, products.filter((p) => p.status === 'live').length);
  const stack = calculateStackAnalysis(stats.monthlyRevenue, 10000, avgPerProduct);

  // SVG line chart points
  const chartW = 600;
  const chartH = 120;
  const padding = 20;
  const points = revenueHistory.map((r, i) => ({
    x: padding + (i / (revenueHistory.length - 1)) * (chartW - padding * 2),
    y: chartH - padding - (r.revenue / maxRevenue) * (chartH - padding * 2),
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = pathD + ` L ${points[points.length - 1].x} ${chartH - padding} L ${points[0].x} ${chartH - padding} Z`;

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
          <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Monthly Revenue</p>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(stats.monthlyRevenue)}</p>
          <p className="text-[10px] text-emerald-400/60 mt-1">+{stats.revenueGrowth}% vs last month</p>
        </div>
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
          <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
          <p className="text-[10px] text-zinc-600 mt-1">{stats.totalSales} total sales</p>
        </div>
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
          <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Avg per Live Product</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(avgPerProduct)}</p>
          <p className="text-[10px] text-zinc-600 mt-1">{products.filter((p) => p.status === 'live').length} live products</p>
        </div>
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
          <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Growth Rate</p>
          <p className="text-2xl font-bold text-amber-400">{stats.revenueGrowth}%</p>
          <p className="text-[10px] text-zinc-600 mt-1">Month over month</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Bar Chart */}
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Monthly Revenue</h3>
          <div className="flex items-end gap-3 h-44">
            {revenueHistory.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-zinc-500 font-mono">{formatCurrency(m.revenue)}</span>
                <div className="w-full rounded-t-md bg-gradient-to-t from-emerald-700 to-emerald-400 transition-all"
                  style={{ height: `${(m.revenue / maxRevenue) * 100}%` }} />
                <span className="text-[10px] text-zinc-600">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Cumulative Growth</h3>
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-44">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#areaGrad)" />
            <path d={pathD} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="4" fill="#10B981" stroke="#0a0a0a" strokeWidth="2" />
                <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#888" fontSize="9">{formatCurrency(revenueHistory[i].revenue)}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Product Performance + Stack Analysis */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Product Performance */}
        <div className="lg:col-span-2 bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Product Performance</h3>
          <div className="space-y-3">
            {products.map((p) => (
              <div key={p.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-400 truncate mr-4">{p.title}</span>
                  <span className="text-xs font-medium text-emerald-400 shrink-0">{formatCurrency(p.revenue)}/mo</span>
                </div>
                <div className="h-2 bg-[#0f0f0f] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-700 to-emerald-400 rounded-full transition-all"
                    style={{ width: `${maxRevenue > 0 ? (p.revenue / maxRevenue) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stack Analysis */}
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">$10K/month Stack</h3>
          <div className="text-center mb-4">
            <p className="text-4xl font-bold text-white">{stack.productsNeeded}</p>
            <p className="text-xs text-zinc-500 mt-1">more products needed</p>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Current MRR</span>
              <span className="text-white">{formatCurrency(stack.currentMonthly)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Gap to $10K</span>
              <span className="text-amber-400">{formatCurrency(stack.gap)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Avg per product</span>
              <span className="text-white">{formatCurrency(avgPerProduct)}</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <p className="text-[11px] text-emerald-400 leading-relaxed">
              At current avg of {formatCurrency(avgPerProduct)}/product, you need {stack.productsNeeded} more live products generating consistent revenue to hit $10K/month.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
