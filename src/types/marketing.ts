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
  channels: string[];
  stats: { leads: number; messagesSent: number; replies: number; conversions: number; revenue: number };
  createdAt: string;
}

export type LeadStatus = 'new' | 'enriching' | 'contacted' | 'replied' | 'interested' | 'converted' | 'lost' | 'bounced';
export type LeadSource = 'google_maps' | 'csv_import' | 'manual' | 'linkedin' | 'expleo';
export type LeadChannel = 'email' | 'linkedin' | 'facebook' | 'phone';
export type NextAction = 'enrich' | 'email1' | 'email2' | 'email3' | 'linkedin_connect' | 'linkedin_dm' | 'followup' | 'close' | null;
export type LinkedinStatus = 'none' | 'connection_sent' | 'connected' | 'dm_sent' | 'replied';

export interface MessageHistoryEntry {
  type: string;
  channel: string;
  content: string;
  sentAt: string;
  status: string;
}

export interface Lead {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  domain: string;
  industry: string;
  location: string;
  country: string;
  employeeCount: string;
  source: LeadSource;
  channel: LeadChannel;
  status: LeadStatus;
  productId: string | null;
  nextAction: NextAction;
  nextActionDate: string | null;
  emailSequenceStep: number;
  linkedinStatus: LinkedinStatus;
  notes: string;
  tags: string[];
  createdAt: string;
  lastContactedAt: string | null;
  messageHistory: MessageHistoryEntry[];
}

export interface EmailSequence {
  id: string;
  name: string;
  steps: Array<{ step: number; subject: string; body: string; delayDays: number }>;
  productId: string;
}

export interface SocialProfile {
  platform: string;
  handle: string;
  url: string;
  icon: string;
  color: string;
}

export interface GoogleMapsResult {
  name: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  types: string[];
  place_id: string;
}
