'use client';

import { usePanicStore } from '@/store/usePanicStore';
import { formatCurrency, formatNumber, getStackAnalysis } from '@/lib/panic-utils';
import {
  DollarSign,
  TrendingUp,
  Target,
  Package,
  ArrowUpRight,
  BarChart3,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function RevenueTracker() {
  const { stats, revenueData, productRevenue, products } = usePanicStore();
  const stack = getStackAnalysis(stats.monthlyRevenue);

  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue), 1);
  const maxProductRevenue = Math.max(...productRevenue.map((d) => d.revenue), 1);
  const totalRevenue = productRevenue.reduce((sum, d) => sum + d.revenue, 0);
  const totalSales = productRevenue.reduce((sum, d) => sum + d.sales, 0);

  // Simulated cumulative revenue data
  const cumulativeData = revenueData.map((d, i) => ({
    month: d.month,
    cumulative: revenueData.slice(0, i + 1).reduce((sum, x) => sum + x.revenue, 0),
  }));
  const maxCumulative = Math.max(...cumulativeData.map((d) => d.cumulative), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white">Revenue Tracker</h2>
        <p className="text-xs text-zinc-500 mt-1">
          Steps 9-10: Track revenue, analyze performance, and plan your path to $10K/month.
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Total Revenue</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-400">{formatCurrency(totalRevenue)}</p>
          <p className="text-[10px] text-zinc-500 mt-1">All time</p>
        </div>
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Monthly Revenue</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">{formatCurrency(stats.monthlyRevenue)}</p>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUpRight className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] text-emerald-400">+{stats.revenueGrowth}%</span>
          </div>
        </div>
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Total Sales</span>
            <BarChart3 className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">{totalSales}</p>
          <p className="text-[10px] text-zinc-500 mt-1">across all products</p>
        </div>
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Avg. Order Value</span>
            <Target className="h-4 w-4 text-zinc-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">
            {totalSales > 0 ? formatCurrency(totalRevenue / totalSales) : '$0'}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">per sale</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Revenue Bar Chart */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Monthly Revenue</h3>
            <span className="text-[10px] text-zinc-500">Last 7 months</span>
          </div>
          <div className="flex items-end gap-3 h-44">
            {revenueData.map((d) => {
              const height = Math.max((d.revenue / maxRevenue) * 100, 2);
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="relative w-full flex flex-col items-center justify-end" style={{ height: '140px' }}>
                    <span className="text-[9px] font-mono text-zinc-400 mb-1">{formatCurrency(d.revenue)}</span>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-700 hover:from-emerald-500 hover:to-emerald-300"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cumulative Revenue Line Chart (CSS) */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Cumulative Revenue</h3>
            <span className="text-[10px] text-emerald-400 font-mono">{formatCurrency(cumulativeData[cumulativeData.length - 1]?.cumulative || 0)}</span>
          </div>
          <div className="relative h-44 flex items-end">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[8px] font-mono text-zinc-600 w-12 text-right">
                    {formatCurrency(Math.round((maxCumulative / 4) * (4 - i)))}
                  </span>
                  <div className="flex-1 border-t border-[#2a2a2a]/50 border-dashed" />
                </div>
              ))}
            </div>
            {/* Data points */}
            <div className="absolute inset-0 pl-14 flex items-end">
              <svg viewBox="0 0 300 140" className="w-full h-full" preserveAspectRatio="none">
                {/* Fill area */}
                <path
                  d={`M 0 ${140 - (cumulativeData[0]?.cumulative || 0) / maxCumulative * 140} ${cumulativeData.map((d, i) => `L ${(i / (cumulativeData.length - 1)) * 300} ${140 - (d.cumulative / maxCumulative) * 140}`).join(' ')} L 300 140 L 0 140 Z`}
                  fill="url(#revenueGradient)"
                  opacity="0.3"
                />
                {/* Line */}
                <polyline
                  points={cumulativeData.map((d, i) => `${(i / (cumulativeData.length - 1)) * 300},${140 - (d.cumulative / maxCumulative) * 140}`).join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                />
                {/* Dots */}
                {cumulativeData.map((d, i) => (
                  <circle
                    key={i}
                    cx={(i / (cumulativeData.length - 1)) * 300}
                    cy={140 - (d.cumulative / maxCumulative) * 140}
                    r="3"
                    fill="#10b981"
                    stroke="#0a0a0a"
                    strokeWidth="1"
                  />
                ))}
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <div className="flex justify-around mt-2 pl-14">
            {cumulativeData.map((d) => (
              <span key={d.month} className="text-[10px] text-zinc-500">{d.month}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Product Performance */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Product Performance</h3>
          <span className="text-[10px] text-zinc-500">{productRevenue.length} products</span>
        </div>

        {/* Product Revenue Bars */}
        <div className="space-y-3">
          {productRevenue.map((pr) => {
            const width = pr.revenue > 0 ? (pr.revenue / maxProductRevenue) * 100 : 0;
            return (
              <div key={pr.productId} className="flex items-center gap-3">
                <div className="w-36 sm:w-48 shrink-0">
                  <p className="text-xs text-white font-medium truncate">{pr.productTitle}</p>
                  <p className="text-[9px] text-zinc-500">{pr.sales} sales</p>
                </div>
                <div className="flex-1">
                  <div className="h-6 bg-[#0a0a0a] rounded-md overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-md"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white">
                      {formatCurrency(pr.revenue)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* $10K/Month Stack Analysis */}
      <div className="bg-gradient-to-r from-emerald-600/10 to-amber-600/10 border border-[#2a2a2a] rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/20 shrink-0">
            <Target className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white mb-1">$10K/Month Stack Analysis</h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Based on your current average revenue of <span className="font-mono text-emerald-400">{formatCurrency(stack.avgRevenuePerProduct)}</span> per product,
              you need <span className="font-bold text-white">{stack.productsNeeded} more product{stack.productsNeeded !== 1 ? 's' : ''}</span> to hit $10K/month.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0a0a0a]/60 rounded-lg p-3 text-center">
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Current</p>
                <p className="text-lg font-bold font-mono text-emerald-400">{formatCurrency(stack.current)}</p>
              </div>
              <div className="bg-[#0a0a0a]/60 rounded-lg p-3 text-center">
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Gap</p>
                <p className="text-lg font-bold font-mono text-amber-400">{formatCurrency(stack.needed)}</p>
              </div>
              <div className="bg-[#0a0a0a]/60 rounded-lg p-3 text-center">
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Products Needed</p>
                <p className="text-lg font-bold font-mono text-white">{stack.productsNeeded}</p>
              </div>
              <div className="bg-[#0a0a0a]/60 rounded-lg p-3 text-center">
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Avg/Product</p>
                <p className="text-lg font-bold font-mono text-zinc-300">{formatCurrency(stack.avgRevenuePerProduct)}</p>
              </div>
            </div>

            {/* Progress bar to $10K */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-zinc-400">Progress to $10K/month</span>
                <span className="text-[10px] font-mono text-emerald-400">{Math.round((stack.current / 10000) * 100)}%</span>
              </div>
              <div className="h-3 bg-[#0a0a0a] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stack.current / 10000) * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[9px] text-zinc-600">$0</span>
                <span className="text-[9px] text-amber-400 font-medium">$10,000/mo goal</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Insights */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          Revenue Insights
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#2a2a2a]">
            <p className="text-[10px] text-zinc-500 mb-1">🏆 Top Performing Product</p>
            <p className="text-xs font-semibold text-white">{productRevenue[0]?.productTitle}</p>
            <p className="text-[10px] text-emerald-400 font-mono">{formatCurrency(productRevenue[0]?.revenue || 0)} revenue</p>
          </div>
          <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#2a2a2a]">
            <p className="text-[10px] text-zinc-500 mb-1">📊 Growth Rate</p>
            <p className="text-xs font-semibold text-white">{stats.revenueGrowth}% month-over-month</p>
            <p className="text-[10px] text-zinc-400">On track for $10K by month 9</p>
          </div>
          <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#2a2a2a]">
            <p className="text-[10px] text-zinc-500 mb-1">🎯 Best Niche</p>
            <p className="text-xs font-semibold text-white">{stats.topNiche}</p>
            <p className="text-[10px] text-zinc-400">{formatCurrency(productRevenue[0]?.revenue || 0)} total revenue</p>
          </div>
          <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#2a2a2a]">
            <p className="text-[10px] text-zinc-500 mb-1">📈 Conversion Rate</p>
            <p className="text-xs font-semibold text-white">4.8%</p>
            <p className="text-[10px] text-zinc-400">Above industry average (2.5%)</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
