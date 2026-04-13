'use client';
import { useState } from 'react';
import { usePanicStore } from '@/store/usePanicStore';
import { getStatusColor } from '@/lib/panic-utils';

const platformStats = [
  { platform: 'Twitter/X', icon: '𝕏', posts: 42, followers: '2.3K', engagement: '4.2%' },
  { platform: 'Reddit', icon: '🔴', posts: 12, followers: '890', engagement: '6.8%' },
  { platform: 'LinkedIn', icon: '💼', posts: 8, followers: '1.1K', engagement: '3.1%' },
];

export default function DistributionPlanner() {
  const { contentPosts } = usePanicStore();
  const [showCompose, setShowCompose] = useState(false);
  const [composeText, setComposeText] = useState('');

  const posted = contentPosts.filter((p) => p.status === 'posted').length;
  const scheduled = contentPosts.filter((p) => p.status === 'scheduled').length;
  const drafts = contentPosts.filter((p) => p.status === 'draft').length;

  return (
    <div className="space-y-6">
      {/* Platform Stats */}
      <div className="grid grid-cols-3 gap-3">
        {platformStats.map((p) => (
          <div key={p.platform} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4 text-center">
            <span className="text-lg block mb-1">{p.icon}</span>
            <p className="text-sm font-semibold text-white">{p.platform}</p>
            <p className="text-[10px] text-zinc-500 mt-1">{p.posts} posts · {p.followers} followers</p>
            <p className="text-xs font-medium text-emerald-400 mt-1">{p.engagement} engagement</p>
          </div>
        ))}
      </div>

      {/* Content Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{posted}</p>
          <p className="text-[10px] text-zinc-500 mt-1 uppercase">Posted</p>
        </div>
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{scheduled}</p>
          <p className="text-[10px] text-zinc-500 mt-1 uppercase">Scheduled</p>
        </div>
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-zinc-400">{drafts}</p>
          <p className="text-[10px] text-zinc-500 mt-1 uppercase">Drafts</p>
        </div>
      </div>

      {/* Content Queue */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Content Queue</h3>
          <button onClick={() => setShowCompose(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 text-xs font-semibold text-black hover:bg-emerald-400 transition-colors">
            + Compose
          </button>
        </div>
        <div className="space-y-2">
          {contentPosts.map((post) => (
            <div key={post.id} className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg p-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">{post.platform}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(post.status)}`}>{post.status}</span>
                </div>
                {post.scheduledDate && <span className="text-[10px] text-zinc-600">{post.scheduledDate}</span>}
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{post.content}</p>
              {post.engagement && (
                <div className="flex gap-4 mt-2 text-[10px] text-zinc-600">
                  <span>❤️ {post.engagement.likes}</span>
                  <span>🔁 {post.engagement.retweets}</span>
                  <span>🔗 {post.engagement.clicks} clicks</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-base font-semibold text-white mb-4">Compose Post</h3>
            <textarea value={composeText} onChange={(e) => setComposeText(e.target.value)}
              placeholder="Write your tweet or post here... Use the Reddit thread insights!"
              rows={4} className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40 resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => { setShowCompose(false); setComposeText(''); }}
                className="flex-1 py-2.5 rounded-lg bg-[#1a1a1a] text-sm font-medium text-zinc-400 hover:text-zinc-300 transition-colors">Cancel</button>
              <button onClick={() => { setShowCompose(false); setComposeText(''); }}
                className="flex-1 py-2.5 rounded-lg bg-emerald-500 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors">
                Schedule Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
