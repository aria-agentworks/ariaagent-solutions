export interface RedditThread {
  id: string;
  title: string;
  subreddit: string;
  upvotes: number;
  commentCount: number;
  panicScore: number;
  niche: string;
  summary: string;
  topComments: { author: string; text: string; upvotes: number }[];
  selected?: boolean;
}

export interface Product {
  id: string;
  title: string;
  niche: string;
  price: number;
  status: 'draft' | 'listed' | 'live';
  revenue: number;
  salesCount: number;
  buildTime: string;
  createdAt: string;
  platform: string;
}

export interface GeneratedGuide {
  title: string;
  niche: string;
  sections: { title: string; content: string; subsections?: { title: string; content: string }[] }[];
  wordCount: number;
  status: 'idle' | 'generating' | 'verifying' | 'formatted' | 'ready';
  generatedAt: string;
}

export interface DashboardStats {
  totalProducts: number;
  monthlyRevenue: number;
  activePages: number;
  avgBuildTime: string;
  totalRevenue: number;
  totalSales: number;
  revenueGrowth: number;
}

export interface ContentPost {
  id: string;
  platform: 'twitter' | 'linkedin' | 'reddit';
  content: string;
  status: 'draft' | 'scheduled' | 'posted';
  scheduledDate?: string;
  engagement?: { likes: number; retweets: number; clicks: number };
}

export interface RevenueData {
  month: string;
  revenue: number;
  productCount: number;
}
