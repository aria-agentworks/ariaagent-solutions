export interface MarketingProject {
  id: string;
  name: string;
  url: string;
  description: string;
  type: 'gumroad' | 'webapp' | 'saas';
  price: number;
  gumroadUrl: string;
  coverImage?: string;
  status: 'active' | 'paused' | 'archived';
  channels: ('linkedin' | 'twitter' | 'reddit' | 'email' | 'discord' | 'producthunt')[];
  stats: { leads: number; messagesSent: number; replies: number; conversions: number; revenue: number };
  createdAt: string;
}

export interface Lead {
  id: string;
  projectId: string;
  name: string;
  title: string;
  company: string;
  domain: string;
  industry: string;
  employeeCount: string;
  channel: 'linkedin' | 'twitter' | 'reddit' | 'email' | 'manual';
  status: 'new' | 'contacted' | 'replied' | 'interested' | 'converted' | 'lost';
  generatedMessages?: { connectionRequest?: string; followUp1?: string; followUp2?: string };
  notes: string;
  createdAt: string;
}

export interface SocialProfile {
  platform: string;
  handle: string;
  url: string;
  icon: string;
  color: string;
}
