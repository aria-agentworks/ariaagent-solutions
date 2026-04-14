'use client';
import { useMarketingStore } from '@/store/useMarketingStore';

const CHANNEL_DATA = [
  {
    platform: 'LinkedIn', handle: '@sreeraajj', url: 'https://x.com/sreeraajj',
    icon: '💼', color: 'text-blue-400', bg: 'bg-blue-500', bgLight: 'bg-blue-400/10',
    description: 'AI-powered outreach to CFOs and decision makers',
    stats: { connections: 2847, messages: 156, replies: 23, conversions: 4 },
  },
  {
    platform: 'Twitter/X', handle: '@sreeraajj', url: 'https://x.com/sreeraajj',
    icon: '𝕏', color: 'text-sky-400', bg: 'bg-sky-500', bgLight: 'bg-sky-400/10',
    description: 'AI insights threads, product launches, engagement',
    stats: { connections: 1230, messages: 89, replies: 34, conversions: 2 },
  },
  {
    platform: 'Reddit', handle: 'u/GlitteringTangelo816', url: 'https://www.reddit.com/user/GlitteringTangelo816/',
    icon: '🔴', color: 'text-orange-400', bg: 'bg-orange-500', bgLight: 'bg-orange-400/10',
    description: 'Value posts in r/CFO, r/SaaS, r/AIautomation communities',
    stats: { connections: 890, messages: 45, replies: 67, conversions: 3 },
  },
  {
    platform: 'Discord', handle: 'aria_agent', url: 'https://discord.com/channels/1488780482870251630/1488780483922759752',
    icon: '💬', color: 'text-indigo-400', bg: 'bg-indigo-500', bgLight: 'bg-indigo-400/10',
    description: 'Community building, support, beta testing',
    stats: { connections: 156, messages: 234, replies: 89, conversions: 1 },
  },
  {
    platform: 'Product Hunt', handle: '@aria_agent', url: 'https://www.producthunt.com/@aria_agent',
    icon: '🚀', color: 'text-orange-500', bg: 'bg-orange-500', bgLight: 'bg-orange-500/10',
    description: 'Product launches, tech community reach',
    stats: { connections: 420, messages: 12, replies: 18, conversions: 0 },
  },
  {
    platform: 'Email', handle: 'Outbound', url: '#',
    icon: '📧', color: 'text-purple-400', bg: 'bg-purple-500', bgLight: 'bg-purple-400/10',
    description: 'Cold email sequences for warm leads',
    stats: { connections: 0, messages: 0, replies: 0, conversions: 0 },
  },
];

export default function ChannelsView() {
  const { socialProfiles } = useMarketingStore();

  const totalFollowers = CHANNEL_DATA.reduce((s, c) => s + c.stats.connections, 0);
  const totalMessages = CHANNEL_DATA.reduce((s, c) => s + c.stats.messages, 0);
  const totalReplies = CHANNEL_DATA.reduce((s, c) => s + c.stats.replies, 0);
  const totalConversions = CHANNEL_DATA.reduce((s, c) => s + c.stats.conversions, 0);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-white">Channels</h1>
        <p className="text-xs text-zinc-500 mt-1">All your marketing channels connected. Track performance across platforms.</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Reach', value: totalFollowers.toLocaleString(), color: 'text-blue-400' },
          { label: 'Messages Sent', value: totalMessages, color: 'text-amber-400' },
          { label: 'Engagement', value: totalReplies, color: 'text-emerald-400' },
          { label: 'Conversions', value: totalConversions, color: 'text-green-400' },
        ].map((s) => (
          <div key={s.label} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-4">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Channel Cards */}
      <div className="grid grid-cols-2 gap-4">
        {CHANNEL_DATA.map((channel) => (
          <div key={channel.platform} className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 hover:border-[#2a2a2a] transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${channel.bgLight} flex items-center justify-center`}>
                  <span className="text-lg">{channel.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{channel.platform}</p>
                  <a href={channel.url} target="_blank" rel="noopener noreferrer" className={`text-[11px] ${channel.color} hover:underline`}>
                    {channel.handle}
                  </a>
                </div>
              </div>
              {channel.url !== '#' && (
                <a href={channel.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-zinc-600 hover:text-white transition-colors">Open ↗</a>
              )}
            </div>

            <p className="text-[11px] text-zinc-500 mb-4">{channel.description}</p>

            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Reach', value: channel.stats.connections },
                { label: 'Sent', value: channel.stats.messages },
                { label: 'Replies', value: channel.stats.replies },
                { label: 'Sales', value: channel.stats.conversions },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#0f0f0f] rounded-lg p-2 text-center">
                  <p className={`text-sm font-bold ${channel.color}`}>{stat.value}</p>
                  <p className="text-[9px] text-zinc-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Connected Accounts */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Connected Accounts</h3>
        <div className="space-y-2">
          {socialProfiles.map((profile) => (
            <a key={profile.platform} href={profile.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg p-3 hover:border-[#2a2a2a] transition-all group">
              <span className="text-lg">{profile.icon}</span>
              <div className="flex-1">
                <p className="text-xs font-medium text-white">{profile.platform}</p>
                <p className={`text-[10px] ${profile.color}`}>{profile.handle}</p>
              </div>
              <span className="text-[10px] text-zinc-600 group-hover:text-white transition-colors">Visit ↗</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
