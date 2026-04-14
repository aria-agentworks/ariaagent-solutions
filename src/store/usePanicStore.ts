import { create } from 'zustand';
import type { RedditThread, Product, GeneratedGuide, DashboardStats, ContentPost, RevenueData } from '@/types/product';

const demoProducts: Product[] = [
  {
    id: 'p1', title: 'Crypto Tax Survival Guide 2025', niche: 'Crypto Tax',
    price: 37, status: 'live', revenue: 3200, salesCount: 86,
    buildTime: '6 hours', createdAt: '2025-02-15', platform: 'Gumroad',
  },
  {
    id: 'p2', title: 'Medical Bill Negotiation Playbook', niche: 'Medical Bills',
    price: 37, status: 'live', revenue: 1800, salesCount: 49,
    buildTime: '5 hours', createdAt: '2025-03-01', platform: 'Gumroad',
  },
  {
    id: 'p3', title: 'H1B Visa Approval Blueprint', niche: 'Immigration',
    price: 47, status: 'listed', revenue: 0, salesCount: 0,
    buildTime: '7 hours', createdAt: '2025-04-05', platform: 'Gumroad',
  },
  {
    id: 'p4', title: 'First-Time Landlord Legal Kit', niche: 'Landlord Law',
    price: 37, status: 'draft', revenue: 0, salesCount: 0,
    buildTime: '—', createdAt: '2025-04-10', platform: 'Gumroad',
  },
];

const demoThreads: RedditThread[] = [
  {
    id: 't1', title: 'Just got hit with a $8,400 crypto tax bill I didn\'t expect', subreddit: 'r/tax',
    upvotes: 2300, commentCount: 347, panicScore: 9, niche: 'Crypto Tax',
    summary: 'Day trader who didn\'t know every swap is taxable now facing massive bill',
    topComments: [
      { author: 'tax CPA', text: 'Every trade is taxable. Even crypto-to-crypto swaps. You owe short-term capital gains on the full amount.', upvotes: 892 },
      { author: 'lost_in_tax', text: 'Same thing happened to me. IRS sent a CP2000 notice. I negotiated down to $3,200 with Form 843.', upvotes: 634 },
      { author: 'defi_novice', text: 'Is there any way to retroactively claim I didn\'t know? I literally had no idea swaps counted.', upvotes: 445 },
      { author: 'audit_survivor', text: 'Get a CPA who specializes in crypto NOW. Cost me $400 but saved me $6K in what I would have overpaid.', upvotes: 312 },
    ],
  },
  {
    id: 't2', title: 'Hospital charged me $34,000 for a 2-hour ER visit. Is this legal?', subreddit: 'r/personalfinance',
    upvotes: 4100, commentCount: 892, panicScore: 10, niche: 'Medical Bills',
    summary: 'Uninsured patient hit with massive ER bill, doesn\'t know bills are negotiable',
    topComments: [
      { author: 'hospital_bill_pro', text: 'Call the billing department and ask for itemized bill. 80% of hospital charges are negotiable. Start at 30% of the bill.', upvotes: 1204 },
      { author: 'nurse_here', text: 'The "list price" is not what insurance pays. Insurance pays about 20-40%. You should pay no more than that.', upvotes: 987 },
      { author: 'med_lawyer', text: 'File for financial assistance / charity care. Most nonprofit hospitals are legally required to offer this if you\'re under a certain income.', upvotes: 756 },
    ],
  },
  {
    id: 't3', title: 'Tenant hasn\'t paid rent in 3 months and I have no idea what to do', subreddit: 'r/RealEstate',
    upvotes: 856, commentCount: 203, panicScore: 7, niche: 'Landlord Law',
    summary: 'First-time landlord losing $3,600/month, unsure of eviction process',
    topComments: [
      { author: 'landlord_10yrs', text: 'Serve a 3-day pay or quit notice first. Then file for unlawful detainer. Whole process takes 30-45 days depending on your state.', upvotes: 234 },
      { author: 'property_mgr', text: 'Did you screen this tenant? Always run background + credit + eviction history. Cost: $30-50. Saves thousands.', upvotes: 189 },
    ],
  },
  {
    id: 't4', title: 'My H1B extension got denied and I have 60 days to leave the country', subreddit: 'r/uscis',
    upvotes: 1200, commentCount: 412, panicScore: 9, niche: 'Immigration',
    summary: 'Tech worker facing deportation after H1B denial, exploring options',
    topComments: [
      { author: 'immigration_atty', text: 'File a motion to reopen within 30 days. Also apply for a change of status to B2 to buy time while you explore options.', upvotes: 567 },
      { author: 'h1b_veteran', text: 'I was in the same boat. Switched to O-1 visa. If you have publications or notable work, it\'s actually easier than H1B.', upvotes: 423 },
    ],
  },
  {
    id: 't5', title: 'Someone opened 12 credit cards in my name last week. What do I do?', subreddit: 'r/IdentityTheft',
    upvotes: 3400, commentCount: 678, panicScore: 10, niche: 'Identity Theft',
    summary: 'Victim of massive identity theft, overwhelmed by the process to recover',
    topComments: [
      { author: 'fraud_investigator', text: 'Step 1: Freeze all 3 credit reports immediately (Experian, Equifax, TransUnion). Step 2: File FTC identity theft report at identitytheft.gov. Step 3: File police report.', upvotes: 1456 },
      { author: 'recovered_user', text: 'This exact thing happened to me. Took 6 months to fully clear. The FTC report is the key document — it forces creditors to investigate.', upvotes: 987 },
    ],
  },
  {
    id: 't6', title: 'Independent contractor here... IRS says I owe $12K, how is this possible?', subreddit: 'r/tax',
    upvotes: 5700, commentCount: 1023, panicScore: 8, niche: 'Contractor Taxes',
    summary: 'Freelancer didn\'t know about self-employment tax, facing huge surprise bill',
    topComments: [
      { author: 'cpa_freelance', text: 'You owe 15.3% self-employment tax ON TOP of income tax. As a contractor you pay both employer and employee side of FICA. This is why everyone says set aside 30% of every paycheck.', upvotes: 2345 },
      { author: 'llc_owner', text: 'Form an S-Corp once you\'re consistently making $50K+. You pay yourself a "reasonable salary" and take the rest as distributions — saves thousands in SE tax.', upvotes: 1567 },
    ],
  },
];

const demoRevenue: RevenueData[] = [
  { month: 'Oct', revenue: 320, productCount: 1 },
  { month: 'Nov', revenue: 890, productCount: 1 },
  { month: 'Dec', revenue: 1400, productCount: 2 },
  { month: 'Jan', revenue: 2100, productCount: 2 },
  { month: 'Feb', revenue: 3800, productCount: 3 },
  { month: 'Mar', revenue: 5200, productCount: 3 },
  { month: 'Apr', revenue: 7400, productCount: 4 },
];

const demoPosts: ContentPost[] = [
  { id: 'cp1', platform: 'twitter', content: 'Every crypto trade is taxable. Even swaps. Even if you didn\'t cash out to USD. The IRS tracks exchange records going back years. Here\'s how to figure out what you actually owe 👇', status: 'posted', engagement: { likes: 234, retweets: 89, clicks: 567 } },
  { id: 'cp2', platform: 'twitter', content: 'Hospital bill for $34K? The "list price" is not what you owe. Insurance pays 20-40%. You should too. Ask for itemized bill, then start at 30% of the total.', status: 'posted', engagement: { likes: 567, retweets: 203, clicks: 1230 } },
  { id: 'cp3', platform: 'twitter', content: 'If you\'re a freelancer and didn\'t set aside 30% of every check for taxes, April is going to hurt. Self-employment tax is 15.3% ON TOP of income tax. The math is brutal.', status: 'scheduled', scheduledDate: '2025-04-14' },
  { id: 'cp4', platform: 'reddit', content: 'I spent 6 months reading through IRS publications and CP2000 notices so you don\'t have to. Here\'s the step-by-step process for handling an unexpected crypto tax bill.', status: 'scheduled', scheduledDate: '2025-04-15' },
  { id: 'cp5', platform: 'twitter', content: 'Your tenant hasn\'t paid rent in 3 months? Serve a 3-day pay-or-quit notice. File for unlawful detainer. Don\'t try to handle this without knowing your state\'s specific timeline.', status: 'draft' },
];

const demoStats: DashboardStats = {
  totalProducts: 4, monthlyRevenue: 7400, activePages: 3,
  avgBuildTime: '5.5 hrs', totalRevenue: 21110, totalSales: 135, revenueGrowth: 42,
};

interface PanicStore {
  activeTab: string;
  products: Product[];
  threads: RedditThread[];
  selectedThread: RedditThread | null;
  guideContent: GeneratedGuide | null;
  stats: DashboardStats;
  contentPosts: ContentPost[];
  revenueHistory: RevenueData[];
  setTab: (tab: string) => void;
  selectThread: (thread: RedditThread) => void;
  setGuide: (guide: GeneratedGuide | null) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
}

export const usePanicStore = create<PanicStore>((set) => ({
  activeTab: 'dashboard',
  products: demoProducts,
  threads: demoThreads,
  selectedThread: null,
  guideContent: null,
  stats: demoStats,
  contentPosts: demoPosts,
  revenueHistory: demoRevenue,
  setTab: (tab) => set({ activeTab: tab }),
  selectThread: (thread) => set({ selectedThread: thread, activeTab: 'generate' }),
  setGuide: (guide) => set({ guideContent: guide }),
  addProduct: (product) => set((s) => ({ products: [...s.products, product] })),
  updateProduct: (id, updates) => set((s) => ({
    products: s.products.map((p) => p.id === id ? { ...p, ...updates } : p),
  })),
}));
