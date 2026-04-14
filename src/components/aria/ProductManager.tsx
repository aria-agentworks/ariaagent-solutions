'use client';
import { useState } from 'react';
import { usePanicStore } from '@/store/usePanicStore';
import { formatCurrency, getStatusColor } from '@/lib/panic-utils';
import type { Product } from '@/types/product';

const statusFilters = ['all', 'live', 'listed', 'draft'];

export default function ProductManager() {
  const { products, addProduct, updateProduct } = usePanicStore();
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNiche, setNewNiche] = useState('');

  const filtered = filter === 'all' ? products : products.filter((p) => p.status === filter);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const product: Product = {
      id: `p${Date.now()}`, title: newTitle, niche: newNiche || 'General',
      price: 37, status: 'draft', revenue: 0, salesCount: 0,
      buildTime: '—', createdAt: new Date().toISOString().split('T')[0], platform: 'Gumroad',
    };
    addProduct(product);
    setNewTitle(''); setNewNiche(''); setShowCreate(false);
  };

  const cycleStatus = (id: string) => {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    const next: Record<string, Product['status']> = { draft: 'listed', listed: 'live', live: 'live' };
    updateProduct(id, { status: next[p.status] });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {statusFilters.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filter === f ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300'
              }`}>{f === 'all' ? 'All' : f}</button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-lg bg-emerald-500 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors">
          + New Product
        </button>
      </div>

      {/* Product Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((p) => (
          <div key={p.id} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(p.status)} uppercase`}>{p.status}</span>
              <span className="text-[10px] text-zinc-600">{p.buildTime}</span>
            </div>
            <h4 className="text-sm font-semibold text-white mb-1 leading-snug">{p.title}</h4>
            <p className="text-xs text-zinc-500 mb-4">{p.niche} · ${p.price} · {p.platform}</p>
            <div className="mt-auto space-y-2">
              {p.revenue > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">{p.salesCount} sales</span>
                  <span className="text-emerald-400 font-medium">{formatCurrency(p.revenue)}/mo</span>
                </div>
              )}
              <button onClick={() => cycleStatus(p.id)}
                className="w-full py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-xs font-medium text-zinc-400 hover:text-white transition-colors">
                {p.status === 'draft' ? 'Mark Listed →' : p.status === 'listed' ? 'Mark Live →' : '✓ Live'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-base font-semibold text-white mb-4">Create New Product</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1.5 block">Product Title</label>
                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Crypto Tax Survival Guide"
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40" />
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1.5 block">Niche</label>
                <input type="text" value={newNiche} onChange={(e) => setNewNiche(e.target.value)}
                  placeholder="e.g., Crypto Tax, Medical Bills..."
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 rounded-lg bg-[#1a1a1a] text-sm font-medium text-zinc-400 hover:text-zinc-300 transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={!newTitle.trim()}
                className="flex-1 py-2.5 rounded-lg bg-emerald-500 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-40 transition-colors">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
