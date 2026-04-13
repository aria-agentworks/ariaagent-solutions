'use client';

import { useState } from 'react';
import { usePanicStore } from '@/store/usePanicStore';
import { getCalendarDays } from '@/lib/panic-utils';
import type { ContentPost } from '@/types/product';
import {
  Share2,
  Twitter,
  MessageCircle,
  Linkedin,
  Calendar,
  Clock,
  Send,
  Copy,
  CheckCircle2,
  Plus,
  X,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const platformConfig = {
  twitter: { icon: Twitter, label: 'X/Twitter', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
  reddit: { icon: MessageCircle, label: 'Reddit', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  linkedin: { icon: Linkedin, label: 'LinkedIn', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
};

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/20' },
  scheduled: { label: 'Scheduled', color: 'bg-amber-500/20 text-amber-400 border-amber-500/20' },
  posted: { label: 'Posted', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' },
};

export default function DistributionPlanner() {
  const { contentPosts, addContentPost, updateContentPost, products } = usePanicStore();
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [newPlatform, setNewPlatform] = useState<'twitter' | 'reddit' | 'linkedin'>('twitter');
  const [newContent, setNewContent] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const calendarDays = getCalendarDays();

  const handleCompose = () => {
    if (!newContent.trim()) return;
    const post: ContentPost = {
      id: `cp${Date.now().toString(36)}`,
      platform: newPlatform,
      content: newContent,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'draft',
      productId: selectedProduct || undefined,
    };
    addContentPost(post);
    setNewContent('');
    setSelectedProduct('');
    setShowComposeModal(false);
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSchedule = (id: string) => {
    updateContentPost(id, { status: 'scheduled' });
  };

  const handleGenerateTweet = () => {
    const product = products[Math.floor(Math.random() * products.length)];
    const tweets = [
      `🚨 ${product.title}\n\nPeople are paying $37 for this because the alternative costs $500+ in professional fees.\n\nThe playbook:\n1. Find the pain\n2. Package the solution\n3. Distribute via Reddit threads\n\nHere's how 👇`,
      `I just noticed a Reddit thread with ${Math.floor(Math.random() * 10000 + 5000)} upvotes about ${product.niche.toLowerCase()}\n\nEveryone panicking. No clear answers.\n\nSo I created a $37 guide. Made ${product.sales > 0 ? product.sales : 45} sales.\n\nPanic = product opportunity.`,
      `Thread 🧵: How I built a $${(product.revenue || 1850).toLocaleString()} digital product from a single Reddit thread about ${product.niche.toLowerCase()}\n\nStep 1: Find the panic\nStep 2: Extract expert advice\nStep 3: Structure into a guide\nStep 4: Sell on Gumroad\n\nFull breakdown ↓`,
    ];
    setNewContent(tweets[Math.floor(Math.random() * tweets.length)]);
    setShowComposeModal(true);
  };

  const platformCounts = {
    twitter: contentPosts.filter((p) => p.platform === 'twitter').length,
    reddit: contentPosts.filter((p) => p.platform === 'reddit').length,
    linkedin: contentPosts.filter((p) => p.platform === 'linkedin').length,
  };

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
          <h2 className="text-lg font-bold text-white">Distribution Planner</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Steps 6-8: Create & schedule content to drive traffic to your products.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateTweet}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Generate
          </button>
          <button
            onClick={() => setShowComposeModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Compose
          </button>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(platformConfig).map(([key, config]) => {
          const Icon = config.icon;
          const count = platformCounts[key as keyof typeof platformCounts];
          const scheduled = contentPosts.filter((p) => p.platform === key && p.status === 'scheduled').length;
          return (
            <div key={key} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-4 w-4 ${config.color}`} />
                <span className="text-[10px] text-zinc-500">{config.label}</span>
              </div>
              <p className="text-xl font-bold font-mono text-white">{count}</p>
              <p className="text-[9px] text-zinc-600">{scheduled} scheduled</p>
            </div>
          );
        })}
      </div>

      {/* 30-Day Calendar */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-white">30-Day Content Calendar</h3>
        </div>
        <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5">
          {calendarDays.map((day) => (
            <div
              key={day.day}
              className={`aspect-square rounded-lg flex items-center justify-center text-[10px] transition-colors ${
                day.isToday
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold'
                  : day.hasPost
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-[#0a0a0a] text-zinc-600 border border-[#2a2a2a]'
              }`}
            >
              {day.day}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-[9px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20 border border-emerald-500/30" /> Today
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-amber-500/10 border border-amber-500/20" /> Scheduled
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#0a0a0a] border border-[#2a2a2a]" /> Empty
          </span>
        </div>
      </div>

      {/* Content Queue */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Content Queue</h3>
        <div className="space-y-3">
          {contentPosts.map((post, i) => {
            const config = platformConfig[post.platform];
            const Icon = config.icon;
            const sConfig = statusConfig[post.status];
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded-md ${config.bg}`}>
                      <Icon className={`h-3 w-3 ${config.color}`} />
                    </div>
                    <span className="text-[10px] font-medium text-zinc-400">{config.label}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${sConfig.color}`}>
                      {sConfig.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(post.id, post.content)}
                      className="p-1 rounded hover:bg-[#2a2a2a] text-zinc-500 hover:text-white transition-colors"
                    >
                      {copiedId === post.id ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                    {post.status === 'draft' && (
                      <button
                        onClick={() => handleSchedule(post.id)}
                        className="p-1 rounded hover:bg-[#2a2a2a] text-zinc-500 hover:text-amber-400 transition-colors"
                        title="Schedule"
                      >
                        <Clock className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Twitter/X Preview */}
                <div className="bg-[#141414] rounded-lg p-3 border border-[#2a2a2a]/50">
                  <p className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-line line-clamp-4">
                    {post.content}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#2a2a2a]/50">
                    <div className="flex items-center gap-2 text-[9px] text-zinc-600">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(post.scheduledAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    {post.productId && (
                      <span className="text-[9px] text-zinc-600">
                        → {products.find((p) => p.id === post.productId)?.title || 'Linked product'}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Compose Modal */}
      <AnimatePresence>
        {showComposeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setShowComposeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 w-full max-w-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Compose Content</h3>
                <button
                  onClick={() => setShowComposeModal(false)}
                  className="p-1 rounded hover:bg-[#2a2a2a] text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Platform Select */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5 block">Platform</label>
                  <div className="flex gap-2">
                    {Object.entries(platformConfig).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => setNewPlatform(key as 'twitter' | 'reddit' | 'linkedin')}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs transition-colors ${
                            newPlatform === key ? config.bg + ' ' + config.color : 'border-[#2a2a2a] text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Product Link */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5 block">Link Product (Optional)</label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="">No product linked</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                {/* Content */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5 block">Content</label>
                  <textarea
                    rows={5}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Write your content here..."
                    className="w-full px-3 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none"
                  />
                  <p className="text-[9px] text-zinc-600 mt-1">{newContent.length} characters</p>
                </div>

                <button
                  onClick={handleCompose}
                  disabled={!newContent.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-sm font-semibold transition-colors"
                >
                  <Send className="h-4 w-4" />
                  Save Content
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
