'use client';

import { usePanicStore } from '@/store/usePanicStore';
import { formatCurrency, formatNumber } from '@/lib/panic-utils';
import {
  Package,
  DollarSign,
  Globe,
  Clock,
  TrendingUp,
  ShoppingCart,
  ArrowUpRight,
  Plus,
  Search,
  FileText,
} from 'lucide-react';
import { motion } from 'framer-motion';

const statCards = [
  { key: 'totalProducts', label: 'Total Products', icon: Package, color: 'text-emerald-400', format: 'number' as const },
  { key: 'monthlyRevenue', label: 'Monthly Revenue', icon: DollarSign, color: 'text-emerald-400', format: 'currency' as const },
  { key: 'activePages', label: 'Active Pages', icon: Globe, color: 'text-amber-400', format: 'number' as const },
  { key: 'avgBuildTime', label: 'Avg Build Time', icon: Clock, color: 'text-zinc-400', format: 'string' as const },
];

export default function Dashboard() {
  const { stats, products, revenueData, setActiveTab, selectThread, threads } = usePanicStore();

  const getStatValue = (key: string) => {
    switch (key) {
      case 'totalProducts': return stats.totalProducts.toString();
      case 'monthlyRevenue': return formatCurrency(stats.monthlyRevenue);
      case 'activePages': return stats.activePages.toString();
      case 'avgBuildTime': return stats.avgBuildTime;
      default: return '';
    }
  };

  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue), 1);

  const recentProducts = products.slice(0, 4);
  const topThread = [...threads].sort((a, b) => b.panicScore - a.panicScore)[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('my-products')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New Product
        </button>
        <button
          onClick={() => setActiveTab('find-thread')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#141414] border border-[#2a2a2a] hover:border-[#3a3a3a] text-zinc-300 text-xs font-medium transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          Find Thread
        </button>
        <button
          onClick={() => setActiveTab('generate-guide')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#141414] border border-[#2a2a2a] hover:border-[#3a3a3a] text-zinc-300 text-xs font-medium transition-colors"
        >
          <FileText className="h-3.5 w-3.5" />
          Generate Guide
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#3a3a3a] transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{stat.label}</span>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-xl font-bold font-mono text-white">{getStatValue(stat.key)}</p>
              {stat.key === 'monthlyRevenue' && (
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400">+{stats.revenueGrowth}% this month</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Revenue Chart + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Revenue Over Time</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Last 7 months</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold font-mono text-emerald-400">{formatCurrency(stats.monthlyRevenue)}</p>
              <p className="text-[10px] text-zinc-500">this month</p>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end gap-2 h-40">
            {revenueData.map((d, i) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] font-mono text-zinc-500">{formatCurrency(d.revenue)}</span>
                <div className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-500 relative group"
                  style={{ height: `${Math.max((d.revenue / maxRevenue) * 100, 4)}%` }}
                >
                  <div className="absolute inset-0 rounded-t-md bg-emerald-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-[9px] text-zinc-500">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Panic Thread */}
        {topThread && (
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">🔥 Hottest Panic Thread</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/20 font-medium">
                    PANIC {topThread.panicScore}
                  </span>
                  <span className="text-[9px] text-zinc-500">{topThread.subreddit}</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2">{topThread.title}</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                <span>↑ {formatNumber(topThread.upvotes)}</span>
                <span>💬 {formatNumber(topThread.comments)}</span>
              </div>
              <button
                onClick={() => selectThread(topThread)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-600/20 border border-amber-500/30 text-amber-400 text-xs font-medium hover:bg-amber-600/30 transition-colors"
              >
                <ArrowUpRight className="h-3 w-3" />
                Use This Thread
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recent Products */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Recent Products</h3>
          <button
            onClick={() => setActiveTab('my-products')}
            className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            View All →
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#3a3a3a] transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium border ${
                    product.status === 'live' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                    product.status === 'listed' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                    'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                  }`}>
                    {product.status.toUpperCase()}
                  </span>
                  <ShoppingCart className="h-3.5 w-3.5 text-zinc-600" />
                </div>
                <h4 className="text-xs font-semibold text-white mb-1 line-clamp-2">{product.title}</h4>
                <p className="text-[10px] text-zinc-500 mb-3">{product.niche}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold font-mono text-emerald-400">{formatCurrency(product.price)}</span>
                  <span className="text-[10px] text-zinc-500">{product.sales} sales</span>
                </div>
                {product.revenue > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#2a2a2a]">
                    <span className="text-[10px] text-zinc-400">Revenue: </span>
                    <span className="text-xs font-mono font-semibold text-emerald-400">{formatCurrency(product.revenue)}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Playbook Summary */}
      <div className="bg-gradient-to-r from-emerald-600/10 to-amber-600/10 border border-[#2a2a2a] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-2">⚡ The 10-Step Panic Product Playbook</h3>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          <strong className="text-zinc-300">Steps 1:</strong> Find panic threads on Reddit →{' '}
          <strong className="text-zinc-300">Steps 2-4:</strong> Use AI to generate a solution guide →{' '}
          <strong className="text-zinc-300">Step 5:</strong> Package & list on Gumroad at $37 →{' '}
          <strong className="text-zinc-300">Steps 6-8:</strong> Create distribution content →{' '}
          <strong className="text-zinc-300">Steps 9-10:</strong> Track revenue & scale
        </p>
      </div>
    </motion.div>
  );
}
