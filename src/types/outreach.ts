// LinkedIn Outreach Agent types
export interface OutreachLead {
  id: string;
  company: string;
  name: string;
  title: string;
  domain: string;
  employeeCount: string;
  industry: string;
  linkedInUrl: string;
  status: 'found' | 'messaged' | 'replied' | 'converted' | 'bounced';
  personalizedMessage: string;
  productMatch: string; // which playbook matches
  productUrl: string;
  sentAt?: string;
  repliedAt?: string;
}

export interface OutreachCampaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  targetDomain: string;
  leads: OutreachLead[];
  productUrl: string;
  productName: string;
  template: string;
  sentCount: number;
  replyCount: number;
  convertedCount: number;
  createdAt: string;
}

export interface CompetitorScan {
  domain: string;
  companyName: string;
  techStack: string[];
  similarCompanies: {
    name: string;
    domain: string;
    employeeCount: string;
    industry: string;
    relevance: number; // 0-100
  }[];
}
