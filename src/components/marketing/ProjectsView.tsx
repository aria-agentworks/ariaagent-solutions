'use client';
import { useState } from 'react';
import { useMarketingStore } from '@/store/useMarketingStore';
import type { MarketingProject } from '@/types/marketing';

const CHANNEL_COLORS: Record<string, { icon: string; color: string; bg: string }> = {
  linkedin: { icon: '💼', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  twitter: { icon: '𝕏', color: 'text-sky-400', bg: 'bg-sky-400/10' },
  reddit: { icon: '🔴', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  email: { icon: '📧', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  discord: { icon: '💬', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  producthunt: { icon: '🚀', color: 'text-orange-500', bg: 'bg-orange-500/10' },
};

const ALL_CHANNELS = ['linkedin', 'twitter', 'reddit', 'email', 'discord', 'producthunt'] as const;

export default function ProjectsView() {
  const { projects, addProject, setActiveProject } = useMarketingStore();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '', url: '', description: '', type: 'webapp' as 'gumroad' | 'webapp' | 'saas',
    price: '', gumroadUrl: '', channels: ['linkedin'] as string[],
  });

  const handleAdd = () => {
    if (!form.name) return;
    const project: MarketingProject = {
      id: `proj-${Date.now()}`,
      name: form.name,
      url: form.url || '#',
      description: form.description,
      type: form.type,
      price: parseInt(form.price) || 0,
      gumroadUrl: form.gumroadUrl,
      status: 'active',
      channels: form.channels as MarketingProject['channels'],
      stats: { leads: 0, messagesSent: 0, replies: 0, conversions: 0, revenue: 0 },
      createdAt: new Date().toISOString().split('T')[0],
    };
    addProject(project);
    setForm({ name: '', url: '', description: '', type: 'webapp', price: '', gumroadUrl: '', channels: ['linkedin'] });
    setShowAdd(false);
  };

  const toggleChannel = (ch: string) => {
    setForm((prev) => ({
      ...prev,
      channels: prev.channels.includes(ch) ? prev.channels.filter((c) => c !== ch) : [...prev.channels, ch],
    }));
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Projects</h1>
          <p className="text-xs text-zinc-500 mt-1">Add any webapp to market. Gumroad products are pre-loaded.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-lg bg-emerald-500 text-xs font-semibold text-black hover:bg-emerald-400 transition-colors">
          + Add Project
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {projects.map((project) => (
          <div key={project.id} onClick={() => setActiveProject(project.id)}
            className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 hover:border-emerald-500/30 transition-all cursor-pointer group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  project.type === 'gumroad' ? 'bg-gradient-to-br from-emerald-600/20 to-emerald-900/20 border border-emerald-500/10' :
                  project.type === 'saas' ? 'bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/10' :
                  'bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/10'
                }`}>
                  <span className="text-lg font-bold text-white">{project.type === 'gumroad' ? '$' : project.type === 'saas' ? 'S' : 'W'}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">{project.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${project.type === 'gumroad' ? 'bg-emerald-500/10 text-emerald-400' : project.type === 'saas' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                      {project.type.toUpperCase()}
                    </span>
                    {project.price > 0 && <span className="text-[10px] text-zinc-500">${project.price}</span>}
                  </div>
                </div>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${project.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-700 text-zinc-500'}`}>
                {project.status}
              </span>
            </div>

            <p className="text-[11px] text-zinc-500 mb-4 line-clamp-2">{project.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {project.channels.map((ch) => {
                  const c = CHANNEL_COLORS[ch];
                  return c ? (
                    <span key={ch} className={`w-6 h-6 rounded ${c.bg} flex items-center justify-center`} title={ch}>
                      <span className="text-[10px]">{c.icon}</span>
                    </span>
                  ) : null;
                })}
              </div>
              <div className="flex gap-3 text-[10px] text-zinc-600">
                <span>{project.stats.leads} leads</span>
                <span>{project.stats.messagesSent} sent</span>
                <span>{project.stats.replies} replies</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Project Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-base font-semibold text-white mb-4">Add New Project</h3>
            <div className="space-y-3 mb-4">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Project Name *" className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40" />
              <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="URL (https://...)" className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40" />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={2} className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40 resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'gumroad' | 'webapp' | 'saas' })} className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40">
                    <option value="webapp">Web App</option>
                    <option value="saas">SaaS</option>
                    <option value="gumroad">Gumroad Product</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">Price ($)</label>
                  <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="49" className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40" />
                </div>
              </div>
              {form.type === 'gumroad' && (
                <input value={form.gumroadUrl} onChange={(e) => setForm({ ...form, gumroadUrl: e.target.value })} placeholder="Gumroad URL" className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40" />
              )}
              <div>
                <label className="text-[10px] text-zinc-500 uppercase block mb-2">Marketing Channels</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_CHANNELS.map((ch) => (
                    <button key={ch} onClick={() => toggleChannel(ch)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${form.channels.includes(ch) ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#1a1a1a] text-zinc-600 border border-[#2a2a2a]'}`}>
                      {CHANNEL_COLORS[ch]?.icon} {ch.charAt(0).toUpperCase() + ch.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-lg bg-[#1a1a1a] text-sm font-medium text-zinc-400 hover:text-zinc-300 transition-colors">Cancel</button>
              <button onClick={handleAdd} disabled={!form.name} className="flex-1 py-2.5 rounded-lg bg-emerald-500 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors disabled:opacity-50">Add Project</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
