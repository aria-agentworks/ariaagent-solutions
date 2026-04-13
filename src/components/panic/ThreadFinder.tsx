'use client';

import { useState } from 'react';
import { usePanicStore } from '@/store/usePanicStore';
import { formatNumber, getPanicColor, getPanicLabel } from '@/lib/panic-utils';
import type { RedditThread } from '@/types/product';
import {
  Search,
  ArrowUpRight,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ThreadFinder() {
  const { searchQuery, setSearchQuery, getFilteredThreads, selectThread } = usePanicStore();
  const [expandedThread, setExpandedThread] = useState<string | null>(null);

  const filteredThreads = getFilteredThreads();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white">Find Panic Threads</h2>
        <p className="text-xs text-zinc-500 mt-1">
          Search Reddit for high-panic threads with desperate audiences ready to buy solutions.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search by niche, topic, or keyword... (e.g. tax, crypto, medical, eviction)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-[#141414] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 hover:text-zinc-300"
          >
            Clear
          </button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {['All', 'Tax', 'Crypto', 'Legal', 'Medical', 'Immigration', 'Identity'].map((filter) => (
          <button
            key={filter}
            onClick={() => setSearchQuery(filter === 'All' ? '' : filter.toLowerCase())}
            className={`px-3 py-1 rounded-lg text-[10px] font-medium border transition-colors ${
              (filter === 'All' && !searchQuery) || searchQuery.toLowerCase() === filter.toLowerCase()
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-[#141414] text-zinc-500 border-[#2a2a2a] hover:text-zinc-300 hover:border-[#3a3a3a]'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-zinc-500">
          {filteredThreads.length} panic thread{filteredThreads.length !== 1 ? 's' : ''} found
        </p>
        <div className="flex items-center gap-1 text-[10px] text-amber-400">
          <AlertTriangle className="h-3 w-3" />
          <span>Sorted by panic score</span>
        </div>
      </div>

      {/* Thread List */}
      <div className="space-y-3">
        {filteredThreads.map((thread, i) => (
          <ThreadCard
            key={thread.id}
            thread={thread}
            index={i}
            isExpanded={expandedThread === thread.id}
            onToggle={() => setExpandedThread(expandedThread === thread.id ? null : thread.id)}
            onSelect={() => selectThread(thread)}
          />
        ))}
      </div>

      {filteredThreads.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">No threads match your search</p>
          <p className="text-[10px] text-zinc-600 mt-1">Try a different keyword or clear your search</p>
        </div>
      )}
    </motion.div>
  );
}

function ThreadCard({
  thread,
  index,
  isExpanded,
  onToggle,
  onSelect,
}: {
  thread: RedditThread;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
}) {
  const panicColor = getPanicColor(thread.panicScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden hover:border-[#3a3a3a] transition-colors"
    >
      {/* Thread Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Meta */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold font-mono ${panicColor} bg-current/10 border border-current/20`}
                style={{ color: thread.panicScore >= 90 ? '#f87171' : thread.panicScore >= 70 ? '#fbbf24' : '#4ade80' }}
              >
                {getPanicLabel(thread.panicScore)} {thread.panicScore}
              </span>
              <span className="text-[9px] text-zinc-500 bg-zinc-800/50 px-1.5 py-0.5 rounded">
                {thread.subreddit}
              </span>
              <span className="text-[9px] text-zinc-600">{thread.niche}</span>
            </div>

            {/* Title */}
            <h3 className="text-sm font-semibold text-white mb-1.5 leading-snug">{thread.title}</h3>

            {/* Snippet */}
            <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{thread.snippet}</p>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-3 text-[10px] text-zinc-500">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                ↑ {formatNumber(thread.upvotes)}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {formatNumber(thread.comments)} comments
              </span>
              <span>u/{thread.author}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-zinc-400 hover:text-white hover:border-[#3a3a3a] transition-colors"
            >
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={onSelect}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-medium transition-colors"
            >
              <ArrowUpRight className="h-3 w-3" />
              Select
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Comments */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#2a2a2a] bg-[#0a0a0a] p-4">
              <h4 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Top Expert Comments
              </h4>
              <div className="space-y-3">
                {thread.topComments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <div className="shrink-0 w-5 h-5 rounded-full bg-[#141414] border border-[#2a2a2a] flex items-center justify-center">
                      <span className="text-[8px] text-zinc-500">↑</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-medium text-zinc-300">u/{comment.author}</span>
                        <span className="text-[9px] text-amber-400">↑ {formatNumber(comment.upvotes)}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={onSelect}
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Generate Guide from This Thread
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
