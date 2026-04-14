import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MarketingProject, Lead, EmailSequence, SocialProfile } from '@/types/marketing';

const GUMROAD_PRODUCTS: MarketingProject[] = [
  {
    id: 'gp1', name: 'CFO Playbook: AI Customer Service', url: 'https://ariaworks3.gumroad.com/l/chqop',
    description: 'From $0 to $500K in annual savings. 3-phase automation roadmap.', type: 'gumroad', price: 49,
    gumroadUrl: 'https://ariaworks3.gumroad.com/l/chqop', status: 'active',
    channels: ['email', 'linkedin'],
    stats: { leads: 0, messagesSent: 0, replies: 0, conversions: 0, revenue: 0 }, createdAt: '2026-04-14',
  },
  {
    id: 'gp2', name: 'Voice AI Implementation Blueprint', url: 'https://ariaworks3.gumroad.com/l/ffdssh',
    description: 'Enterprise contact center automation. Tech stack + vendor matrix.', type: 'gumroad', price: 59,
    gumroadUrl: 'https://ariaworks3.gumroad.com/l/ffdssh', status: 'active',
    channels: ['email', 'linkedin'],
    stats: { leads: 0, messagesSent: 0, replies: 0, conversions: 0, revenue: 0 }, createdAt: '2026-04-14',
  },
  {
    id: 'gp3', name: 'Conversational AI ROI Framework', url: 'https://ariaworks3.gumroad.com/l/pjtxj',
    description: 'CFO strategic financial playbook. ROI models + vendor comparison.', type: 'gumroad', price: 49,
    gumroadUrl: 'https://ariaworks3.gumroad.com/l/pjtxj', status: 'active',
    channels: ['email', 'linkedin'],
    stats: { leads: 0, messagesSent: 0, replies: 0, conversions: 0, revenue: 0 }, createdAt: '2026-04-14',
  },
  {
    id: 'gp4', name: "The CFO's Panic Playbook", url: 'https://ariaworks3.gumroad.com/l/kmjqgt',
    description: 'AI cost reduction when the board demands action. 72-hour triage.', type: 'gumroad', price: 79,
    gumroadUrl: 'https://ariaworks3.gumroad.com/l/kmjqgt', status: 'active',
    channels: ['email', 'linkedin'],
    stats: { leads: 0, messagesSent: 0, replies: 0, conversions: 0, revenue: 0 }, createdAt: '2026-04-14',
  },
];

const DEMO_EMAIL_SEQUENCES: EmailSequence[] = [
  {
    id: 'seq1',
    name: 'CFO Cold Email Sequence',
    productId: 'gp1',
    steps: [
      { step: 1, subject: 'Quick question about {{company}} support operations', body: '', delayDays: 0 },
      { step: 2, subject: 'Following up — AI support case study for {{industry}}', body: '', delayDays: 3 },
      { step: 3, subject: 'Final thought on {{company}} — savings roadmap inside', body: '', delayDays: 7 },
    ],
  },
  {
    id: 'seq2',
    name: 'Voice AI Outreach',
    productId: 'gp2',
    steps: [
      { step: 1, subject: '{{company}} contact center — quick question', body: '', delayDays: 0 },
      { step: 2, subject: 'Voice AI vendor comparison for {{industry}} companies', body: '', delayDays: 4 },
      { step: 3, subject: 'Implementation blueprint for {{company}}', body: '', delayDays: 8 },
    ],
  },
  {
    id: 'seq3',
    name: 'ROI Framework Pitch',
    productId: 'gp3',
    steps: [
      { step: 1, subject: 'AI ROI for {{company}} — calculated savings potential', body: '', delayDays: 0 },
      { step: 2, subject: 'CFO perspective: AI investment framework', body: '', delayDays: 3 },
      { step: 3, subject: 'Vendor matrix + ROI calculator for {{industry}}', body: '', delayDays: 7 },
    ],
  },
  {
    id: 'seq4',
    name: 'Panic Playbook Urgent',
    productId: 'gp4',
    steps: [
      { step: 1, subject: 'Board demanding AI cost cuts at {{company}}?', body: '', delayDays: 0 },
      { step: 2, subject: '72-hour AI cost reduction triage — {{company}} edition', body: '', delayDays: 2 },
      { step: 3, subject: 'Triage playbook + action plan for {{company}}', body: '', delayDays: 5 },
    ],
  },
];

// No demo leads — start fresh, add real leads via Google Maps, CSV import, or manual entry

const SOCIAL_PROFILES: SocialProfile[] = [
  { platform: 'Reddit', handle: 'u/GlitteringTangelo816', url: 'https://www.reddit.com/user/GlitteringTangelo816/', icon: '🔴', color: 'text-orange-400' },
  { platform: 'Twitter/X', handle: '@sreeraajj', url: 'https://x.com/sreeraajj', icon: '𝕏', color: 'text-sky-400' },
  { platform: 'Discord', handle: 'aria_agent', url: 'https://discord.com/channels/1488780482870251630/1488780483922759752', icon: '💬', color: 'text-indigo-400' },
  { platform: 'Product Hunt', handle: '@aria_agent', url: 'https://www.producthunt.com/@aria_agent', icon: '🚀', color: 'text-orange-500' },
];

interface MarketingStore {
  activeView: string;
  projects: MarketingProject[];
  leads: Lead[];
  emailSequences: EmailSequence[];
  socialProfiles: SocialProfile[];
  gumroadSales: Array<{ id: string; product_name: string; email: string; price: number; created_at: string }>;
  setView: (view: string) => void;
  addLead: (lead: Lead) => void;
  addLeads: (leads: Lead[]) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  deleteLeads: (ids: string[]) => void;
  updateProject: (id: string, updates: Partial<MarketingProject>) => void;
  addEmailSequence: (seq: EmailSequence) => void;
  updateEmailSequence: (id: string, updates: Partial<EmailSequence>) => void;
  setGumroadSales: (sales: Array<{ id: string; product_name: string; email: string; price: number; created_at: string }>) => void;
}

export const useMarketingStore = create<MarketingStore>()(
  persist(
    (set) => ({
      activeView: 'dashboard',
      projects: GUMROAD_PRODUCTS,
      leads: [],
      emailSequences: DEMO_EMAIL_SEQUENCES,
      socialProfiles: SOCIAL_PROFILES,
      gumroadSales: [],

      setView: (view) => set({ activeView: view }),

      addLead: (lead) => set((s) => ({ leads: [...s.leads, lead] })),
      addLeads: (newLeads) => set((s) => ({ leads: [...s.leads, ...newLeads] })),
      updateLead: (id, updates) => set((s) => ({ leads: s.leads.map((l) => l.id === id ? { ...l, ...updates } : l) })),
      deleteLead: (id) => set((s) => ({ leads: s.leads.filter((l) => l.id !== id) })),
      deleteLeads: (ids) => set((s) => ({ leads: s.leads.filter((l) => !ids.includes(l.id)) })),

      updateProject: (id, updates) => set((s) => ({ projects: s.projects.map((p) => p.id === id ? { ...p, ...updates } : p) })),

      addEmailSequence: (seq) => set((s) => ({ emailSequences: [...s.emailSequences, seq] })),
      updateEmailSequence: (id, updates) => set((s) => ({ emailSequences: s.emailSequences.map((s2) => s2.id === id ? { ...s2, ...updates } : s2) })),

      setGumroadSales: (sales) => set({ gumroadSales: sales }),
    }),
    {
      name: 'ariaagent-marketing-v3',
      partialize: (state) => ({
        leads: state.leads,
        projects: state.projects,
        emailSequences: state.emailSequences,
        gumroadSales: state.gumroadSales,
      }),
    }
  )
);
