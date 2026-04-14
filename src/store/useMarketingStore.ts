import { create } from 'zustand';
import type { MarketingProject, Lead, SocialProfile } from '@/types/marketing';

const GUMROAD_PRODUCTS: MarketingProject[] = [
  {
    id: 'gp1', name: 'CFO Playbook: AI Customer Service', url: 'https://ariaworks3.gumroad.com/l/chqop',
    description: 'From $0 to $500K in annual savings. 3-phase automation roadmap.', type: 'gumroad', price: 49,
    gumroadUrl: 'https://ariaworks3.gumroad.com/l/chqop', status: 'active',
    channels: ['linkedin', 'twitter', 'reddit', 'email', 'discord', 'producthunt'],
    stats: { leads: 12, messagesSent: 8, replies: 2, conversions: 0, revenue: 0 }, createdAt: '2026-04-14',
  },
  {
    id: 'gp2', name: 'Voice AI Implementation Blueprint', url: 'https://ariaworks3.gumroad.com/l/ffdssh',
    description: 'Enterprise contact center automation. Tech stack + vendor matrix.', type: 'gumroad', price: 59,
    gumroadUrl: 'https://ariaworks3.gumroad.com/l/ffdssh', status: 'active',
    channels: ['linkedin', 'twitter', 'producthunt'],
    stats: { leads: 8, messagesSent: 5, replies: 1, conversions: 0, revenue: 0 }, createdAt: '2026-04-14',
  },
  {
    id: 'gp3', name: 'Conversational AI ROI Framework', url: 'https://ariaworks3.gumroad.com/l/pjtxj',
    description: 'CFO strategic financial playbook. ROI models + vendor comparison.', type: 'gumroad', price: 49,
    gumroadUrl: 'https://ariaworks3.gumroad.com/l/pjtxj', status: 'active',
    channels: ['linkedin', 'twitter'],
    stats: { leads: 5, messagesSent: 3, replies: 0, conversions: 0, revenue: 0 }, createdAt: '2026-04-14',
  },
  {
    id: 'gp4', name: "The CFO's Panic Playbook", url: 'https://ariaworks3.gumroad.com/l/kmjqgt',
    description: 'AI cost reduction when the board demands action. 72-hour triage.', type: 'gumroad', price: 79,
    gumroadUrl: 'https://ariaworks3.gumroad.com/l/kmjqgt', status: 'active',
    channels: ['linkedin', 'twitter', 'reddit', 'email', 'discord', 'producthunt'],
    stats: { leads: 10, messagesSent: 6, replies: 1, conversions: 0, revenue: 0 }, createdAt: '2026-04-14',
  },
];

const DEMO_LEADS: Lead[] = [
  { id: 'l1', projectId: 'gp1', name: 'Sarah Chen', title: 'VP of Customer Operations', company: 'Acme Corp', domain: 'acmecorp.com', industry: 'SaaS', employeeCount: '500-1000', channel: 'linkedin', status: 'contacted', notes: 'Interested in support automation', createdAt: '2026-04-14' },
  { id: 'l2', projectId: 'gp4', name: 'Michael Torres', title: 'CFO', company: 'FinEdge Systems', domain: 'finedge.io', industry: 'Fintech', employeeCount: '200-500', channel: 'linkedin', status: 'replied', notes: 'Asked for pricing details', createdAt: '2026-04-14' },
  { id: 'l3', projectId: 'gp2', name: 'Dr. Priya Sharma', title: 'COO', company: 'HealthBridge', domain: 'healthbridge.com', industry: 'Healthcare', employeeCount: '1000-5000', channel: 'linkedin', status: 'new', notes: '', createdAt: '2026-04-14' },
  { id: 'l4', projectId: 'gp1', name: 'James Wilson', title: 'Head of Support', company: 'NovaTech AI', domain: 'novatech.ai', industry: 'AI/ML', employeeCount: '100-200', channel: 'twitter', status: 'new', notes: '', createdAt: '2026-04-14' },
  { id: 'l5', projectId: 'gp4', name: 'Elena Rodriguez', title: 'VP of Operations', company: 'RetailMax', domain: 'retailmax.com', industry: 'Retail', employeeCount: '2000-5000', channel: 'reddit', status: 'contacted', notes: 'Found via Reddit thread', createdAt: '2026-04-14' },
  { id: 'l6', projectId: 'gp3', name: 'David Kim', title: 'CTO', company: 'ChatFlow Inc', domain: 'chatflow.io', industry: 'Conversational AI', employeeCount: '50-100', channel: 'producthunt', status: 'new', notes: '', createdAt: '2026-04-14' },
  { id: 'l7', projectId: 'gp2', name: 'Lisa Chang', title: 'Director of Contact Center', company: 'TelcoGlobal', domain: 'telcoglobal.com', industry: 'Telecom', employeeCount: '5000+', channel: 'email', status: 'interested', notes: 'Wants voice AI demo', createdAt: '2026-04-13' },
  { id: 'l8', projectId: 'gp1', name: 'Robert Patel', title: 'VP of CX', company: 'InsureTech Plus', domain: 'insuretechplus.com', industry: 'Insurance', employeeCount: '300-600', channel: 'discord', status: 'new', notes: '', createdAt: '2026-04-13' },
];

const SOCIAL_PROFILES: SocialProfile[] = [
  { platform: 'Reddit', handle: 'u/GlitteringTangelo816', url: 'https://www.reddit.com/user/GlitteringTangelo816/', icon: '🔴', color: 'text-orange-400' },
  { platform: 'Twitter/X', handle: '@sreeraajj', url: 'https://x.com/sreeraajj', icon: '𝕏', color: 'text-sky-400' },
  { platform: 'Discord', handle: 'aria_agent', url: 'https://discord.com/channels/1488780482870251630/1488780483922759752', icon: '💬', color: 'text-indigo-400' },
  { platform: 'Product Hunt', handle: '@aria_agent', url: 'https://www.producthunt.com/@aria_agent', icon: '🚀', color: 'text-orange-500' },
];

interface MarketingStore {
  activeView: string;
  projects: MarketingProject[];
  activeProject: string | null;
  leads: Lead[];
  socialProfiles: SocialProfile[];
  setView: (view: string) => void;
  setActiveProject: (id: string | null) => void;
  addProject: (project: MarketingProject) => void;
  updateProject: (id: string, updates: Partial<MarketingProject>) => void;
  addLead: (lead: Lead) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  getLeadsForProject: (projectId: string) => Lead[];
  getProject: (id: string) => MarketingProject | undefined;
}

export const useMarketingStore = create<MarketingStore>((set, get) => ({
  activeView: 'dashboard',
  projects: GUMROAD_PRODUCTS,
  activeProject: null,
  leads: DEMO_LEADS,
  socialProfiles: SOCIAL_PROFILES,

  setView: (view) => set({ activeView: view }),
  setActiveProject: (id) => set({ activeProject: id, activeView: 'outreach' }),

  addProject: (project) => set((s) => ({ projects: [...s.projects, project] })),
  updateProject: (id, updates) => set((s) => ({ projects: s.projects.map((p) => p.id === id ? { ...p, ...updates } : p) })),
  addLead: (lead) => set((s) => ({ leads: [...s.leads, lead] })),
  updateLead: (id, updates) => set((s) => ({ leads: s.leads.map((l) => l.id === id ? { ...l, ...updates } : l) })),
  deleteLead: (id) => set((s) => ({ leads: s.leads.filter((l) => l.id !== id) })),
  getLeadsForProject: (projectId) => get().leads.filter((l) => l.projectId === projectId),
  getProject: (id) => get().projects.find((p) => p.id === id),
}));
