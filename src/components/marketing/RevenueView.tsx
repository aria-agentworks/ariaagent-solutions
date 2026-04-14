'use client';
import { useState } from 'react';
import { useMarketingStore } from '@/store/useMarketingStore';

interface GumroadSale {
  id: string;
  product_name: string;
  email: string;
  price: number;
  created_at: string;
}

interface GumroadSalesResponse {
  success: boolean;
  summary?: {
    totalRevenue: number;
    totalSales: number;
    productCount: number;
    lastSync: string;
  };
  products?: Array<{ id: string; name: string; sales: number; revenue: number }>;
  recentSales?: GumroadSale[];
  error?: string;
}

export default function RevenueView() {
  const { projects, leads, gumroadSales, setGumroadSales, updateProject } = useMarketingStore();
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [showRecent, setShowRecent] = useState(false);

  const totalRevenue = projects.reduce((s, p) => s + p.stats.revenue, 0) + gumroadSales.reduce((s, sale) => s + sale.price, 0);
  const totalConversions = projects.reduce((s, p) => s + p.stats.conversions, 0) + gumroadSales.length;
  const totalLeads = leads.length;
  const gumroadRevenue = gumroadSales.reduce((s, sale) => s + sale.price, 0);
  const conversionRate = totalLeads > 0 ? ((totalConversions / totalLeads) * 100).toFixed(1) : '0.0';
  const avgDealSize = totalConversions > 0 ? (totalRevenue / totalConversions).toFixed(0) : '0';

  // Pipeline value: sum of product prices for leads in contacted/replied/interested
  const pipelineValue = leads
    .filter((l) => ['contacted', 'replied', 'interested'].includes(l.status))
    .reduce((s, l) => {
      const product = projects.find((p) => p.id === l.productId);
      return s + (product?.price || 0);
    }, 0);

  // Revenue by channel
  const revenueByChannel = leads
    .filter((l) => l.status === 'converted')
    .reduce((acc, l) => {
      acc[l.channel] = (acc[l.channel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const syncGumroadSales = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch('/api/gumroad/sales');
      const data: GumroadSalesResponse = await res.json();

      if (data.success && data.summary) {
        setGumroadSales(data.recentSales || []);
        if (data.products) {
          for (const product of data.products) {
            const match = projects.find((p) =>
              p.name.toLowerCase().includes(product.name.toLowerCase().split(':')[0].toLowerCase()) ||
              product.name.toLowerCase().includes(p.name.toLowerCase().split(':')[0].toLowerCase())
            );
            if (match) {
              updateProject(match.id, {
                stats: { ...match.stats, conversions: product.sales, revenue: product.revenue },
              });
            }
          }
        }
        setLastSynced(data.summary.lastSync);
      } else {
        setSyncError(data.error || 'Failed to sync');
      }
    } catch {
      setSyncError('Network error — could not reach Gumroad API');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Revenue</h1>
          <p className="text-xs text-zinc-500 mt-1">Gumroad sales, conversion tracking, and pipeline value.</p>
        </div>
        <button onClick={syncGumroadSales} disabled={syncing}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            syncing ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500 text-black hover:bg-emerald-400'
          }`}>
          {syncing ? '⏳ Syncing...' : '🔄 Sync Gumroad Sales'}
        </button>
      </div>

      {syncError && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
          <p className="text-xs text-red-400">{syncError}</p>
        </div>
      )}

      {lastSynced && (
        <div className="flex items-center gap-2 text-[10px] text-zinc-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Last synced: {new Date(lastSynced).toLocaleString()}
          {gumroadSales.length > 0 && <span className="text-zinc-500">({gumroadSales.length} sales loaded)</span>}
        </div>
      )}

      {/* Top Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, sub: `${totalConversions} conversions`, color: 'text-green-400' },
          { label: 'Gumroad Sales', value: `$${gumroadRevenue.toLocaleString()}`, sub: `${gumroadSales.length} purchases`, color: 'text-emerald-400' },
          { label: 'Conversion Rate', value: `${conversionRate}%`, sub: `${totalConversions}/${totalLeads} leads`, color: 'text-amber-400' },
          { label: 'Avg Deal Size', value: `$${avgDealSize}`, sub: 'per conversion', color: 'text-zinc-100' },
          { label: 'Pipeline Value', value: `$${pipelineValue.toLocaleString()}`, sub: `${leads.filter((l) => ['contacted', 'replied', 'interested'].includes(l.status)).length} active leads`, color: 'text-purple-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Gumroad Purchases */}
      {gumroadSales.length > 0 && (
        <div className="bg-[#141414] border border-emerald-500/20 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Gumroad Purchases</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">{gumroadSales.length} sales · ${gumroadRevenue} total</p>
            </div>
            <button onClick={() => setShowRecent(!showRecent)}
              className="px-3 py-1 rounded-lg bg-[#0f0f0f] text-[10px] text-zinc-500 hover:text-white border border-[#2a2a2a] transition-colors">
              {showRecent ? 'Hide' : 'Show'} Recent
            </button>
          </div>
          {showRecent && (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {gumroadSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{sale.product_name}</p>
                    <p className="text-[10px] text-zinc-600">{sale.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold text-green-400">${sale.price}</p>
                    <p className="text-[9px] text-zinc-700">{sale.created_at ? new Date(sale.created_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product Performance */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Product Performance</h3>
        <div className="space-y-4">
          {projects.map((product) => {
            const leadCount = leads.filter((l) => l.productId === product.id).length;
            const convRate = leadCount > 0 ? ((product.stats.conversions / leadCount) * 100).toFixed(0) : '0';
            return (
              <div key={product.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-bold text-white shrink-0">${product.price}</span>
                    <p className="text-xs text-zinc-400 truncate">{product.name}</p>
                  </div>
                  <div className="flex gap-3 shrink-0 text-[10px] text-zinc-500">
                    <span>{leadCount} leads</span>
                    <span>{product.stats.conversions} sold</span>
                    <span>{convRate}% conv.</span>
                    <span className="text-green-400 font-semibold">${product.stats.revenue}</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-[#0f0f0f] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                    style={{ width: `${Math.max((product.stats.revenue / Math.max(totalRevenue, 1)) * 100, 2)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conversion Funnel by Product */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Conversion by Product</h3>
        <div className="grid grid-cols-2 gap-4">
          {projects.map((p) => {
            const pLeads = leads.filter((l) => l.productId === p.id);
            const pConverted = pLeads.filter((l) => l.status === 'converted').length;
            return (
              <div key={p.id} className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg p-4">
                <p className="text-xs font-semibold text-white mb-1 truncate">{p.name}</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Leads', value: pLeads.length },
                    { label: 'Converted', value: pConverted },
                    { label: 'Revenue', value: `$${p.stats.revenue}` },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <p className="text-sm font-bold text-zinc-200">{stat.value}</p>
                      <p className="text-[9px] text-zinc-600">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
