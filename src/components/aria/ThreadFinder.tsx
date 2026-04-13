'use client';
import { useState } from 'react';
import { usePanicStore } from '@/store/usePanicStore';
import { formatNumber, getPanicColor, getPanicLabel } from '@/lib/panic-utils';

const filters = ['All', 'High Panic', 'Most Upvotes'];

export default function ThreadFinder() {
  const { threads, selectThread } = usePanicStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = threads.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.niche.toLowerCase().includes(search.toLowerCase()) ||
      t.subreddit.toLowerCase().includes(search.toLowerCase());
    if (filter === 'High Panic') return matchSearch && t.panicScore >= 8;
    if (filter === 'Most Upvotes') return matchSearch && t.upvotes >= 1000;
    return matchSearch;
  }).sort((a, b) => b.panicScore - a.panicScore);

  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">🔍</span>
          <input
            type="text" placeholder="Search by topic, niche, or subreddit..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#141414] border border-[#1f1f1f] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40"
          />
        </div>
        <div className="flex gap-2">
          {filters.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filter === f ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#141414] text-zinc-500 border border-[#1f1f1f] hover:text-zinc-300'
              }`}
            >{f}</button>
          ))}
        </div>
      </div>

      <p className="text-xs text-zinc-600">{filtered.length} threads found</p>

      {/* Thread List */}
      <div className="space-y-3">
        {filtered.map((thread) => (
          <div key={thread.id} className="bg-[#141414] border border-[#1f1f1f] rounded-xl overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <p className="text-xs text-zinc-500 mb-1">{thread.subreddit} · {formatNumber(thread.upvotes)} upvotes · {thread.commentCount} comments</p>
                  <p className="text-sm font-medium text-white leading-snug">{thread.title}</p>
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${getPanicColor(thread.panicScore)}`}>
                  {thread.panicScore}/10
                </span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed mb-3">{thread.summary}</p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => selectThread(thread)}
                  className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                >
                  Build Guide From This →
                </button>
                <button
                  onClick={() => setExpanded(expanded === thread.id ? null : thread.id)}
                  className="px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-xs font-medium text-zinc-400 hover:text-zinc-300 transition-colors"
                >
                  {expanded === thread.id ? 'Hide' : 'Show'} Comments ({thread.topComments.length})
                </button>
              </div>

              {/* Expanded Comments */}
              {expanded === thread.id && (
                <div className="mt-3 pt-3 border-t border-[#1f1f1f] space-y-2">
                  {thread.topComments.map((c, i) => (
                    <div key={i} className="bg-[#0f0f0f] rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-medium text-emerald-400">{c.author}</span>
                        <span className="text-[10px] text-zinc-600">▲ {c.upvotes}</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{c.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
