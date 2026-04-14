import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MarketingProject, Lead, EmailSequence, SocialProfile } from '@/types/marketing';

const GUMROAD_PRODUCTS: MarketingProject[] = [
  {
    id: 'gp1', name: 'CFO Playbook: AI Customer Service', url: 'https://ariaworks3.gumroad.com/l/chqop',
    description: 'From $0 to $500K in annual savings. 3-phase automation roadmap.', type: 'gumroad', price: 49,
    gumroadUrl: 'https://ariaworks3.gumroad.com/l/chqop', status: 'active',
    channels: ['email', 'linkedin'],
    stats: { leads: 12, messagesSent: 8, replies: 2, conversions: 0, revenue: 0 }, createdAt: '2026-04-14',
  },
  {
    id: 'gp2', name: 'Voice AI Implementation Blueprint', url: 'https://ariaworks3.gumroad.com/l/ffdssh',
    description: 'Enterprise contact center automation. Tech stack + vendor matrix.', type: 'gumroad', price: 59,
    gumroadUrl: 'https://ariaworks3.gumroad.com/l/ffdssh', status: 'active',
    channels: ['email', 'linkedin'],
    stats: { leads: 8, messagesSent: 5, replies: 1, conversions: 0, revenue: 0 }, createdAt: '2026-04-14',
  },
  {
    id: 'gp3', name: 'Conversational AI ROI Framework', url: 'https://ariaworks3.gumroad.com/l/pjtxj',
    description: 'CFO strategic financial playbook. ROI models + vendor comparison.', type: 'gumroad', price: 49,
    gumroadUrl: 'https://ariaworks3.gumroad.com/l/pjtxj', status: 'active',
    channels: ['email', 'linkedin'],
    stats: { leads: 5, messagesSent: 3, replies: 0, conversions: 0, revenue: 0 }, createdAt: '2026-04-14',
  },
  {
    id: 'gp4', name: "The CFO's Panic Playbook", url: 'https://ariaworks3.gumroad.com/l/kmjqgt',
    description: 'AI cost reduction when the board demands action. 72-hour triage.', type: 'gumroad', price: 79,
    gumroadUrl: 'https://ariaworks3.gumroad.com/l/kmjqgt', status: 'active',
    channels: ['email', 'linkedin'],
    stats: { leads: 10, messagesSent: 6, replies: 1, conversions: 0, revenue: 0 }, createdAt: '2026-04-14',
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

const DEMO_LEADS: Lead[] = [
  {
    id: 'l1', name: 'Sarah Chen', title: 'VP of Customer Operations', company: 'Acme Corp',
    email: 'sarah.chen@acmecorp.com', phone: '+1 (415) 555-0142', website: 'https://acmecorp.com',
    domain: 'acmecorp.com', industry: 'SaaS', location: 'San Francisco, CA', country: 'United States',
    employeeCount: '500-1000', source: 'google_maps', channel: 'email', status: 'contacted',
    productId: 'gp1', nextAction: 'email2', nextActionDate: new Date(Date.now() + 1 * 86400000).toISOString(),
    emailSequenceStep: 1, linkedinStatus: 'connection_sent', notes: 'Interested in support automation', tags: ['hot-lead'],
    createdAt: '2026-04-10', lastContactedAt: '2026-04-12',
    messageHistory: [{ type: 'email', channel: 'email', content: 'Sent intro email with AI customer service playbook pitch', sentAt: '2026-04-12T10:00:00Z', status: 'sent' }],
  },
  {
    id: 'l2', name: 'Michael Torres', title: 'CFO', company: 'FinEdge Systems',
    email: 'm.torres@finedge.io', phone: '+1 (212) 555-0198', website: 'https://finedge.io',
    domain: 'finedge.io', industry: 'Fintech', location: 'New York, NY', country: 'United States',
    employeeCount: '200-500', source: 'linkedin', channel: 'email', status: 'replied',
    productId: 'gp4', nextAction: 'email3', nextActionDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    emailSequenceStep: 2, linkedinStatus: 'connected', notes: 'Asked for pricing details, very interested', tags: ['hot-lead', 'cfo'],
    createdAt: '2026-04-08', lastContactedAt: '2026-04-13',
    messageHistory: [
      { type: 'email', channel: 'email', content: 'Sent cold email: Board demanding AI cost cuts?', sentAt: '2026-04-09T10:00:00Z', status: 'sent' },
      { type: 'email', channel: 'email', content: 'Sent follow-up: 72-hour AI cost reduction triage', sentAt: '2026-04-11T10:00:00Z', status: 'sent' },
      { type: 'reply', channel: 'email', content: 'Reply received: "This is exactly what I need. Can we schedule a call?"', sentAt: '2026-04-13T14:30:00Z', status: 'replied' },
    ],
  },
  {
    id: 'l3', name: 'Dr. Priya Sharma', title: 'COO', company: 'HealthBridge Solutions',
    email: '', phone: '+44 20 7946 0958', website: 'https://healthbridge.co.uk',
    domain: 'healthbridge.co.uk', industry: 'Healthcare', location: 'London, UK', country: 'United Kingdom',
    employeeCount: '1000-5000', source: 'google_maps', channel: 'email', status: 'new',
    productId: 'gp1', nextAction: 'enrich', nextActionDate: new Date().toISOString(),
    emailSequenceStep: 0, linkedinStatus: 'none', notes: 'Large healthcare org, needs email enrichment', tags: ['enterprise'],
    createdAt: '2026-04-13', lastContactedAt: null, messageHistory: [],
  },
  {
    id: 'l4', name: 'James Wilson', title: 'Head of Digital Transformation', company: 'NovaTech AI',
    email: 'jwilson@novatech.ai', phone: '+1 (650) 555-0176', website: 'https://novatech.ai',
    domain: 'novatech.ai', industry: 'AI/ML', location: 'Austin, TX', country: 'United States',
    employeeCount: '100-200', source: 'manual', channel: 'email', status: 'new',
    productId: 'gp2', nextAction: 'email1', nextActionDate: new Date().toISOString(),
    emailSequenceStep: 0, linkedinStatus: 'none', notes: 'AI-native company, likely receptive to Voice AI', tags: ['tech-forward'],
    createdAt: '2026-04-14', lastContactedAt: null, messageHistory: [],
  },
  {
    id: 'l5', name: 'Elena Rodriguez', title: 'VP of Operations', company: 'RetailMax Group',
    email: 'elena.rodriguez@retailmax.com', phone: '+34 91 123 4567', website: 'https://retailmax.es',
    domain: 'retailmax.com', industry: 'E-commerce', location: 'Madrid, Spain', country: 'Spain',
    employeeCount: '2000-5000', source: 'csv_import', channel: 'email', status: 'contacted',
    productId: 'gp4', nextAction: 'email2', nextActionDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    emailSequenceStep: 1, linkedinStatus: 'none', notes: 'Imported from Expleo, large retail operation', tags: ['expleo', 'enterprise'],
    createdAt: '2026-04-11', lastContactedAt: '2026-04-14',
    messageHistory: [{ type: 'email', channel: 'email', content: 'Sent intro email with Panic Playbook angle', sentAt: '2026-04-14T09:00:00Z', status: 'sent' }],
  },
  {
    id: 'l6', name: 'David Kim', title: 'Director of Strategy', company: 'ChatFlow Inc',
    email: 'd.kim@chatflow.io', phone: '', website: 'https://chatflow.io',
    domain: 'chatflow.io', industry: 'Conversational AI', location: 'Berlin, Germany', country: 'Germany',
    employeeCount: '50-100', source: 'linkedin', channel: 'linkedin', status: 'interested',
    productId: 'gp3', nextAction: 'close', nextActionDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    emailSequenceStep: 0, linkedinStatus: 'connected', notes: 'Wants to see ROI calculator, ready to buy', tags: ['hot-lead', 'ready-to-buy'],
    createdAt: '2026-04-09', lastContactedAt: '2026-04-13',
    messageHistory: [
      { type: 'linkedin_connect', channel: 'linkedin', content: 'Connection request sent', sentAt: '2026-04-09T10:00:00Z', status: 'accepted' },
      { type: 'linkedin_dm', channel: 'linkedin', content: 'Sent DM with ROI framework teaser', sentAt: '2026-04-11T10:00:00Z', status: 'replied' },
    ],
  },
  {
    id: 'l7', name: 'Lisa Chang', title: 'Director of Contact Center', company: 'TelcoGlobal',
    email: 'l.chang@telcoglobal.com', phone: '+1 (312) 555-0134', website: 'https://telcoglobal.com',
    domain: 'telcoglobal.com', industry: 'Telecom', location: 'Chicago, IL', country: 'United States',
    employeeCount: '5000+', source: 'expleo', channel: 'email', status: 'interested',
    productId: 'gp2', nextAction: 'close', nextActionDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    emailSequenceStep: 3, linkedinStatus: 'none', notes: 'Wants voice AI demo, large contact center', tags: ['hot-lead', 'enterprise'],
    createdAt: '2026-04-07', lastContactedAt: '2026-04-12',
    messageHistory: [
      { type: 'email', channel: 'email', content: 'Sent intro email: Voice AI for TelcoGlobal', sentAt: '2026-04-07T10:00:00Z', status: 'sent' },
      { type: 'email', channel: 'email', content: 'Sent follow-up: Voice AI vendor comparison', sentAt: '2026-04-10T10:00:00Z', status: 'sent' },
      { type: 'email', channel: 'email', content: 'Sent closing email with implementation blueprint link', sentAt: '2026-04-12T10:00:00Z', status: 'sent' },
      { type: 'reply', channel: 'email', content: 'Reply received: "Very interested, please send the full blueprint"', sentAt: '2026-04-12T15:00:00Z', status: 'replied' },
    ],
  },
  {
    id: 'l8', name: 'Robert Patel', title: 'CFO', company: 'ManuTech Solutions',
    email: '', phone: '+49 30 1234 5678', website: 'https://manutech.de',
    domain: 'manutech.de', industry: 'Manufacturing', location: 'Munich, Germany', country: 'Germany',
    employeeCount: '300-600', source: 'google_maps', channel: 'email', status: 'new',
    productId: 'gp4', nextAction: 'enrich', nextActionDate: new Date().toISOString(),
    emailSequenceStep: 0, linkedinStatus: 'none', notes: 'German manufacturing, CFO target, needs email enrichment', tags: ['cfo', 'manufacturing'],
    createdAt: '2026-04-13', lastContactedAt: null, messageHistory: [],
  },
  {
    id: 'l9', name: 'Anna Johansson', title: 'VP of Finance', company: 'NordStream Digital',
    email: 'anna.j@nordstream.se', phone: '+46 8 123 456', website: 'https://nordstream.se',
    domain: 'nordstream.se', industry: 'SaaS', location: 'Stockholm, Sweden', country: 'Sweden',
    employeeCount: '150-300', source: 'linkedin', channel: 'email', status: 'contacted',
    productId: 'gp3', nextAction: 'email2', nextActionDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    emailSequenceStep: 1, linkedinStatus: 'connected', notes: 'Swedish SaaS, growing fast, AI budget available', tags: ['european', 'saas'],
    createdAt: '2026-04-10', lastContactedAt: '2026-04-12',
    messageHistory: [
      { type: 'email', channel: 'email', content: 'Sent intro email: AI ROI for NordStream', sentAt: '2026-04-12T10:00:00Z', status: 'sent' },
    ],
  },
  {
    id: 'l10', name: 'Marcus van der Berg', title: 'Head of Operations', company: 'LogiFlow BV',
    email: 'm.vanderberg@logiflow.nl', phone: '+31 20 123 4567', website: 'https://logiflow.nl',
    domain: 'logiflow.nl', industry: 'Logistics', location: 'Amsterdam, Netherlands', country: 'Netherlands',
    employeeCount: '400-800', source: 'csv_import', channel: 'email', status: 'bounced',
    productId: 'gp1', nextAction: null, nextActionDate: null,
    emailSequenceStep: 1, linkedinStatus: 'none', notes: 'Email bounced, need to find alternative contact', tags: ['bounced', 'european'],
    createdAt: '2026-04-11', lastContactedAt: '2026-04-12',
    messageHistory: [
      { type: 'email', channel: 'email', content: 'Sent intro email', sentAt: '2026-04-12T10:00:00Z', status: 'bounced' },
    ],
  },
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
      leads: DEMO_LEADS,
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
      name: 'ariaagent-marketing-v2',
      partialize: (state) => ({
        leads: state.leads,
        projects: state.projects,
        emailSequences: state.emailSequences,
        gumroadSales: state.gumroadSales,
      }),
    }
  )
);
