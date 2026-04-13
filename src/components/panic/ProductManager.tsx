'use client';

import { useState } from 'react';
import { usePanicStore } from '@/store/usePanicStore';
import { formatCurrency, getStatusColor, getStatusLabel, generateId, getRelativeTime } from '@/lib/panic-utils';
import type { Product } from '@/types/product';
import {
  Plus,
  Package,
  DollarSign,
  ShoppingCart,
  ExternalLink,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductManager() {
  const { products, addProduct, updateProduct } = usePanicStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNiche, setNewNiche] = useState('');
  const [newPrice, setNewPrice] = useState('37');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleCreate = () => {
    if (!newTitle.trim() || !newNiche.trim()) return;
    const product: Product = {
      id: generateId(),
      title: newTitle,
      niche: newNiche,
      price: Number(newPrice) || 37,
      status: 'draft',
      revenue: 0,
      sales: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    addProduct(product);
    setNewTitle('');
    setNewNiche('');
    setNewPrice('37');
    setShowCreateModal(false);
  };

  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
  const totalSales = products.reduce((sum, p) => sum + p.sales, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">My Products</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Step 5: Manage your panic products — draft, list, and track performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#141414] border border-[#2a2a2a] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[#2a2a2a] text-white' : 'text-zinc-500'}`}
            >
              <Package className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-[#2a2a2a] text-white' : 'text-zinc-500'}`}
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Create New
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-3">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Total Products</span>
          <p className="text-lg font-bold font-mono text-white mt-1">{products.length}</p>
        </div>
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-3">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Total Revenue</span>
          <p className="text-lg font-bold font-mono text-emerald-400 mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-3">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Total Sales</span>
          <p className="text-lg font-bold font-mono text-white mt-1">{totalSales}</p>
        </div>
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-3">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Live Products</span>
          <p className="text-lg font-bold font-mono text-emerald-400 mt-1">
            {products.filter((p) => p.status === 'live').length}
          </p>
        </div>
      </div>

      {/* Products Grid / List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} onUpdate={updateProduct} />
          ))}
        </div>
      ) : (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-[#2a2a2a] text-[9px] text-zinc-500 uppercase tracking-wider font-medium">
            <div className="col-span-5">Product</div>
            <div className="col-span-2">Niche</div>
            <div className="col-span-1">Price</div>
            <div className="col-span-1">Sales</div>
            <div className="col-span-1">Revenue</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1"></div>
          </div>
          {products.map((product) => (
            <div
              key={product.id}
              className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-[#2a2a2a]/50 last:border-b-0 hover:bg-[#1a1a1a] transition-colors"
            >
              <div className="col-span-5">
                <p className="text-xs text-white font-medium truncate">{product.title}</p>
                <p className="text-[9px] text-zinc-600">{getRelativeTime(product.createdAt)}</p>
              </div>
              <div className="col-span-2 text-[10px] text-zinc-400">{product.niche}</div>
              <div className="col-span-1 text-xs font-mono text-white">${product.price}</div>
              <div className="col-span-1 text-xs font-mono text-zinc-400">{product.sales}</div>
              <div className="col-span-1 text-xs font-mono text-emerald-400">{formatCurrency(product.revenue)}</div>
              <div className="col-span-1">
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium border ${getStatusColor(product.status)}`}>
                  {getStatusLabel(product.status)}
                </span>
              </div>
              <div className="col-span-1 flex justify-end">
                <ExternalLink className="h-3 w-3 text-zinc-600 hover:text-zinc-400 cursor-pointer transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Product Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Create New Product</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded hover:bg-[#2a2a2a] text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5 block">Product Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Crypto Tax Panic Guide 2025"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5 block">Niche</label>
                  <input
                    type="text"
                    placeholder="e.g. Crypto / Taxes"
                    value={newNiche}
                    onChange={(e) => setNewNiche(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5 block">Price ($)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <button
                  onClick={handleCreate}
                  disabled={!newTitle.trim() || !newNiche.trim()}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-sm font-semibold transition-colors"
                >
                  Create Product
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ProductCard({ product, index, onUpdate }: { product: Product; index: number; onUpdate: (id: string, updates: Partial<Product>) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#3a3a3a] transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium border ${getStatusColor(product.status)}`}>
          {getStatusLabel(product.status)}
        </span>
        <div className="flex gap-1">
          {product.status === 'draft' && (
            <button
              onClick={() => onUpdate(product.id, { status: 'listed' })}
              className="text-[9px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
            >
              List
            </button>
          )}
          {product.status === 'listed' && (
            <button
              onClick={() => onUpdate(product.id, { status: 'live' })}
              className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
            >
              Go Live
            </button>
          )}
          {product.status === 'live' && (
            <div className="flex items-center gap-1 text-[9px] text-emerald-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </div>
          )}
        </div>
      </div>

      <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2">{product.title}</h3>
      <p className="text-[10px] text-zinc-500 mb-1">{product.niche}</p>
      {product.sourceSubreddit && (
        <p className="text-[9px] text-zinc-600 mb-3">Source: {product.sourceSubreddit}</p>
      )}

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#2a2a2a]">
        <div>
          <div className="flex items-center gap-1 text-[9px] text-zinc-500">
            <DollarSign className="h-2.5 w-2.5" /> Price
          </div>
          <p className="text-xs font-bold font-mono text-white">${product.price}</p>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[9px] text-zinc-500">
            <ShoppingCart className="h-2.5 w-2.5" /> Sales
          </div>
          <p className="text-xs font-bold font-mono text-white">{product.sales}</p>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[9px] text-zinc-500">
            <EyeOff className="h-2.5 w-2.5" /> Rev
          </div>
          <p className="text-xs font-bold font-mono text-emerald-400">{formatCurrency(product.revenue)}</p>
        </div>
      </div>
    </motion.div>
  );
}
