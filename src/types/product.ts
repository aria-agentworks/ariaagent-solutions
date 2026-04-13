export interface RedditThread {
  id: string;
  title: string;
  subreddit: string;
  author: string;
  upvotes: number;
  comments: number;
  niche: string;
  panicScore: number; // 0-100
  snippet: string;
  topComments: ThreadComment[];
  createdAt: string;
}

export interface ThreadComment {
  id: string;
  author: string;
  text: string;
  upvotes: number;
  isOP: boolean;
}

export interface Product {
  id: string;
  title: string;
  niche: string;
  price: number;
  status: 'draft' | 'listed' | 'live';
  revenue: number;
  sales: number;
  sourceThreadId?: string;
  sourceSubreddit?: string;
  createdAt: string;
  thumbnail?: string;
}

export interface GuideSection {
  title: string;
  content: string;
  tips: string[];
}

export interface GeneratedGuide {
  id: string;
  productId?: string;
  threadId: string;
  title: string;
  targetAudience: string;
  sections: GuideSection[];
  wordCount: number;
  status: 'generating' | 'verifying' | 'formatted' | 'ready';
  createdAt: string;
}

export interface DashboardStats {
  totalProducts: number;
  monthlyRevenue: number;
  activePages: number;
  avgBuildTime: string;
  totalSales: number;
  revenueGrowth: number; // percentage
  topNiche: string;
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
}

export interface ProductRevenue {
  productId: string;
  productTitle: string;
  revenue: number;
  sales: number;
}

export interface ContentPost {
  id: string;
  platform: 'twitter' | 'reddit' | 'linkedin';
  content: string;
  scheduledAt: string;
  status: 'draft' | 'scheduled' | 'posted';
  productId?: string;
}

export type TabId = 'dashboard' | 'find-thread' | 'generate-guide' | 'my-products' | 'distribution' | 'revenue';
