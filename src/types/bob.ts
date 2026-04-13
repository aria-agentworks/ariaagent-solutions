// ─── Bob for Ads — Unified Type Definitions ────────────────────────────────

export type PipelineStep = 'brain' | 'hands' | 'mouth';

export type HookType =
  | 'SOCIAL PROOF'
  | 'URGENCY'
  | 'CURIOSITY'
  | 'FOMO'
  | 'AUTHORITY'
  | 'EMOTIONAL';

export interface AdConcept {
  id: string;
  hookType: HookType;
  headline: string;
  copy: string;
  emotion: string;
  imageUrl: string;
  selected?: boolean;
}

export interface CampaignConfig {
  name: string;
  objective: 'CONVERSIONS' | 'TRAFFIC' | 'AWARENESS' | 'LEAD_GENERATION';
  dailyBudget: number;
  [key: string]: unknown;
}

export interface AdSet {
  id: string;
  name: string;
  ads: Ad[];
  status: 'ACTIVE' | 'PAUSED' | 'PENDING';
  dailyBudget: number;
}

export interface Ad {
  id: string;
  name: string;
  conceptId: string;
  status: 'ACTIVE' | 'PAUSED' | 'PENDING';
  imageUrl: string;
  headline: string;
  copy: string;
  metrics?: AdMetrics;
}

export interface DeploymentResult {
  campaignId: string;
  campaignName: string;
  status: 'ACTIVE' | 'PENDING' | 'FAILED';
  adSets: AdSet[];
  createdAt: string;
  dailyBudget: number;
}

export interface AdMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  spend: number;
  conversions: number;
  frequency: number;
}

export interface MonitorMetrics {
  totalSpend: number;
  avgCTR: number;
  avgCPC: number;
  activeCampaigns: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
}

export interface Bleeder {
  id: string;
  name: string;
  adSetId: string;
  spend: number;
  ctr: number;
  frequency: number;
  cpc: number;
  reason: string;
}

export interface Winner {
  id: string;
  name: string;
  adSetId: string;
  spend: number;
  ctr: number;
  cpc: number;
  clicks: number;
  conversions: number;
  recommendation: string;
}

export interface FatigueAlert {
  id: string;
  adName: string;
  ctrTrend: 'DECLINING' | 'STABLE' | 'INCREASING';
  frequency: number;
  daysRunning: number;
  recommendation: string;
}

export interface Alert {
  id: string;
  type: 'BLEEDER' | 'WINNER' | 'FATIGUE' | 'BUDGET' | 'SYSTEM';
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  adId?: string;
  actionRequired: boolean;
  actions?: { label: string; action: string; variant: 'destructive' | 'default' | 'outline' }[];
}

export interface DailyBriefing {
  date: string;
  summary: string;
  topInsights: string[];
  recommendedActions: string[];
  spendPacing: number; // 0-100
  healthScore: number; // 0-100
}

export type TerminalLineType = 'command' | 'output' | 'error' | 'success' | 'info' | 'system';

export interface TerminalLine {
  id: string;
  type: TerminalLineType;
  text: string;
  timestamp: string;
}

export interface GenerationPhase {
  name: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  progress: number;
}
