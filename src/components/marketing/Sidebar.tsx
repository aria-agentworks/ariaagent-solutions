'use client';
import { useMarketingStore } from '@/store/useMarketingStore';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'projects', label: 'Projects', icon: '📦' },
  { id: 'outreach', label: 'Outreach', icon: '📤' },
  { id: 'leads', label: 'Leads', icon: '👥' },
  { id: 'revenue', label: 'Revenue', icon: '💰' },
  { id: 'channels', label: 'Channels', icon: '🔗' },
];

export default function Sidebar() {
  const { activeView, setView, socialProfiles } = useMarketingStore();

  return (
    <aside className="w-56 shrink-0 bg-[#111111] border-r border-[#1a1a1a] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-4 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <span className="text-xs font-bold text-black">A</span>
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">ariaagent</p>
            <p className="text-[9px] text-zinc-600 mt-0.5">Marketing Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeView === item.id
                ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#1a1a1a]'
            }`}
          >
            <span className="text-sm">{item.icon}</span>
            {item.label}
          </button>
        ))}

        {/* Divider */}
        <div className="pt-3 pb-1">
          <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-wider px-3 mb-2">Connected</p>
        </div>

        {/* Social Profiles */}
        {socialProfiles.map((profile) => (
          <a
            key={profile.platform}
            href={profile.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-[#1a1a1a] transition-all"
          >
            <span className="text-xs">{profile.icon}</span>
            <span className="truncate">{profile.platform}</span>
            <span className="text-[9px] text-zinc-700 ml-auto truncate max-w-[80px]">{profile.handle}</span>
          </a>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-[#1a1a1a]">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1a1a1a]">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
            <span className="text-[9px] font-bold text-white">S</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-zinc-300 truncate">@sreeraajj</p>
            <p className="text-[9px] text-zinc-600">ariaagent solutions</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
