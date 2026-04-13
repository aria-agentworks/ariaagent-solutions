import { create } from 'zustand';
import type {
  TabId,
  Product,
  RedditThread,
  GeneratedGuide,
  DashboardStats,
  RevenueDataPoint,
  ProductRevenue,
  ContentPost,
} from '@/types/product';

// ─── Demo Data ────────────────────────────────────────────────────────────

const demoProducts: Product[] = [
  {
    id: 'p1',
    title: 'Crypto Tax Panic Guide 2025',
    niche: 'Crypto / Taxes',
    price: 37,
    status: 'live',
    revenue: 4810,
    sales: 130,
    sourceThreadId: 't1',
    sourceSubreddit: 'r/CryptoCurrency',
    createdAt: '2025-01-15',
  },
  {
    id: 'p2',
    title: 'Landlord Eviction Defense Kit',
    niche: 'Legal / Housing',
    price: 37,
    status: 'live',
    revenue: 2886,
    sales: 78,
    sourceThreadId: 't3',
    sourceSubreddit: 'r/legaladvice',
    createdAt: '2025-02-10',
  },
  {
    id: 'p3',
    title: 'Medical Bill Negotiation Blueprint',
    niche: 'Healthcare / Finance',
    price: 47,
    status: 'live',
    revenue: 1880,
    sales: 40,
    sourceThreadId: 't4',
    sourceSubreddit: 'r/personalfinance',
    createdAt: '2025-03-05',
  },
  {
    id: 'p4',
    title: 'H1B Visa Approval Playbook',
    niche: 'Immigration',
    price: 37,
    status: 'listed',
    revenue: 0,
    sales: 0,
    sourceThreadId: 't2',
    sourceSubreddit: 'r/h1b',
    createdAt: '2025-04-01',
  },
];

const demoThreads: RedditThread[] = [
  {
    id: 't1',
    title: 'Just got a letter from the IRS about my crypto trades... I\'m terrified',
    subreddit: 'r/CryptoCurrency',
    author: 'CryptoPanic2025',
    upvotes: 14320,
    comments: 2847,
    niche: 'Crypto / Taxes',
    panicScore: 96,
    snippet: 'I started trading crypto in 2021 and never reported anything. Just got a CP2000 notice for $47,000 in unpaid taxes plus penalties. I have no idea what to do...',
    topComments: [
      { id: 'c1', author: 'TaxAttorneyAMA', text: 'First, don\'t panic. File an amended return with Form 1040-X. You have 3 years from the original filing date. CP2000 is a proposal, not a final bill.', upvotes: 4821, isOP: false },
      { id: 'c2', author: 'CPA_Crypto', text: 'You need to calculate your cost basis for every trade. Use crypto tax software like Koinly or CoinTracker. The penalties can be abated if you show reasonable cause.', upvotes: 3201, isOP: false },
      { id: 'c3', author: 'BeenThereDoneThat99', text: 'I was in the exact same situation last year. Ended up owing $12k but got penalties waived. PM me if you want the step-by-step I followed.', upvotes: 2890, isOP: false },
    ],
    createdAt: '2025-01-10',
  },
  {
    id: 't2',
    title: 'H1B denial after working here for 6 years. My life is falling apart.',
    subreddit: 'r/h1b',
    author: 'LostInImmigration',
    upvotes: 8940,
    comments: 1653,
    niche: 'Immigration',
    panicScore: 94,
    snippet: 'My H1B extension was just denied. I have 60 days to leave the country. I have a house, a car, a wife who\'s on H4, and two kids in school. What are my options??',
    topComments: [
      { id: 'c4', author: 'ImmigrationLawyerCA', text: 'File a motion to reopen or reconsider within 30 days. Also look into filing an appeal with the AAO. You may have grounds if the denial was based on specialty occupation definition.', upvotes: 3102, isOP: false },
      { id: 'c5', author: 'GC_Hopeful_2025', text: 'Switch to O-1 if you qualify (extraordinary ability). Or explore EB-2 NIW if you have an advanced degree. These are alternatives that let you stay.', upvotes: 2567, isOP: false },
    ],
    createdAt: '2025-02-20',
  },
  {
    id: 't3',
    title: 'My landlord is trying to evict me with 3 days notice in the middle of winter. Is this legal?',
    subreddit: 'r/legaladvice',
    author: 'ScaredRenter22',
    upvotes: 6710,
    comments: 1432,
    niche: 'Legal / Housing',
    panicScore: 91,
    snippet: 'I lost my job 2 months ago and fell behind on rent. Landlord just slid a 3-day notice under my door. It\'s 15°F outside and I have a 4-year-old. There\'s no way I can move in 3 days.',
    topComments: [
      { id: 'c6', author: 'TenantRights_Lawyer', text: '3-day notice is almost certainly illegal. Check your state\'s tenant protection laws. Most states require 30-60 days. Also look up "just cause" eviction ordinances in your city.', upvotes: 2200, isOP: false },
      { id: 'c7', author: 'EvictionPrevention_Nonprofit', text: 'Contact 211 (United Way) immediately. They can connect you with emergency rental assistance. Also file an answer with your local court — many evictions are thrown out when tenants show up.', upvotes: 1890, isOP: false },
    ],
    createdAt: '2025-01-28',
  },
  {
    id: 't4',
    title: '$84,000 medical bill after emergency surgery with no insurance. How do I not go bankrupt?',
    subreddit: 'r/personalfinance',
    author: 'MedicalBillNightmare',
    upvotes: 12890,
    comments: 3421,
    niche: 'Healthcare / Finance',
    panicScore: 98,
    snippet: 'Had a burst appendix. Emergency surgery, 4 days in the hospital. Just got the bill: $84,000. I make $52k/year and have no health insurance. I\'m 29 and this will ruin my life financially.',
    topComments: [
      { id: 'c8', author: 'MedicalBill_Negotiator', text: 'Step 1: Ask for itemized bill. Step 2: Apply for financial assistance (most hospitals have charity care programs for uninsured). Step 3: Negotiate — hospitals typically accept 30-40 cents on the dollar.', upvotes: 6780, isOP: false },
      { id: 'c9', author: 'HealthcareAdvocate', text: 'File an application for Medicaid with backdated coverage. If you\'re eligible, Medicaid can sometimes retroactively cover up to 3 months of medical bills.', upvotes: 5430, isOP: false },
    ],
    createdAt: '2025-02-05',
  },
  {
    id: 't5',
    title: 'Got a 1099-K for $12k from my side hustle. Never paid quarterly taxes. Am I screwed?',
    subreddit: 'r/tax',
    author: 'SideHustle_Panic',
    upvotes: 5200,
    comments: 891,
    niche: 'Taxes / Freelance',
    panicScore: 82,
    snippet: 'I started doing freelance web design last year. Made about $12k total. Completely forgot about quarterly estimated taxes. Now I have a 1099-K and I\'m scared of what I owe.',
    topComments: [
      { id: 'c10', author: 'EnrolledAgent_Taxes', text: 'You\'re not screwed, but you may owe an underpayment penalty. File Schedule C with your tax return. Deduct every business expense you can — home office, internet, software, etc.', upvotes: 1980, isOP: false },
    ],
    createdAt: '2025-03-15',
  },
  {
    id: 't6',
    title: 'My identity was stolen and someone opened 12 credit cards in my name',
    subreddit: 'r/personalfinance',
    author: 'IdentityStolenHelp',
    upvotes: 9560,
    comments: 1876,
    niche: 'Security / Finance',
    panicScore: 97,
    snippet: 'Just discovered someone has been using my SSN to open credit accounts. 12 cards, $45k in charges. My credit score dropped from 780 to 520. Police report filed but I feel so helpless.',
    topComments: [
      { id: 'c11', author: 'FraudInvestigator_Retired', text: 'Freeze your credit immediately at all three bureaus (Equifax, Experian, TransUnion). File disputes for every fraudulent account. File an FTC report at IdentityTheft.gov — this creates your legal paper trail.', upvotes: 4520, isOP: false },
    ],
    createdAt: '2025-03-22',
  },
];

const demoRevenueData: RevenueDataPoint[] = [
  { month: 'Jan', revenue: 1200 },
  { month: 'Feb', revenue: 2100 },
  { month: 'Mar', revenue: 3400 },
  { month: 'Apr', revenue: 2800 },
  { month: 'May', revenue: 4100 },
  { month: 'Jun', revenue: 5200 },
  { month: 'Jul', revenue: 4810 },
];

const demoProductRevenue: ProductRevenue[] = [
  { productId: 'p1', productTitle: 'Crypto Tax Panic Guide', revenue: 4810, sales: 130 },
  { productId: 'p2', productTitle: 'Landlord Eviction Defense Kit', revenue: 2886, sales: 78 },
  { productId: 'p3', productTitle: 'Medical Bill Negotiation Blueprint', revenue: 1880, sales: 40 },
  { productId: 'p4', productTitle: 'H1B Visa Approval Playbook', revenue: 0, sales: 0 },
];

const demoContentPosts: ContentPost[] = [
  {
    id: 'cp1',
    platform: 'twitter',
    content: '🚨 If you got a CP2000 notice from the IRS about crypto trades — STOP PANIC SELLING.\n\nHere\'s what 95% of people get wrong:\n\n1. It\'s a proposal, not a final bill\n2. You can amend returns for 3 years\n3. Penalties CAN be waived\n\nI put together a step-by-step guide 👇',
    scheduledAt: '2025-04-15T09:00:00Z',
    status: 'posted',
    productId: 'p1',
  },
  {
    id: 'cp2',
    platform: 'twitter',
    content: 'Got a 3-day eviction notice in winter? IT\'S PROBABLY ILLEGAL.\n\nMost states require 30-60 days minimum.\n\nYour landlord is counting on you not knowing your rights.\n\nHere\'s the exact letter template to send back 👇',
    scheduledAt: '2025-04-16T12:00:00Z',
    status: 'scheduled',
    productId: 'p2',
  },
  {
    id: 'cp3',
    platform: 'reddit',
    content: 'Just went through a $84k medical bill negotiation. Here\'s how I got it down to $4,200. Step-by-step breakdown in comments.',
    scheduledAt: '2025-04-17T14:00:00Z',
    status: 'draft',
    productId: 'p3',
  },
  {
    id: 'cp4',
    platform: 'linkedin',
    content: 'I built 4 digital products from Reddit panic threads. Total revenue: $9,576 in 3 months.\n\nThe playbook:\n1. Find panic threads\n2. Read the expert answers\n3. Turn them into a structured guide\n4. Sell on Gumroad for $37\n\nHere\'s the full breakdown 👇',
    scheduledAt: '2025-04-18T10:00:00Z',
    status: 'scheduled',
  },
  {
    id: 'cp5',
    platform: 'twitter',
    content: 'Your landlord cannot evict you with 3 days notice.\n\nPeriod.\n\nThread of tenant rights every renter MUST know 🧵👇',
    scheduledAt: '2025-04-19T15:00:00Z',
    status: 'draft',
    productId: 'p2',
  },
];

// ─── Store Interface ─────────────────────────────────────────────────────

interface PanicStore {
  // Navigation
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  // Threads
  threads: RedditThread[];
  selectedThread: RedditThread | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectThread: (thread: RedditThread) => void;
  getFilteredThreads: () => RedditThread[];

  // Guide Generation
  guideContent: GeneratedGuide | null;
  guideStatus: 'idle' | 'generating' | 'verifying' | 'formatted' | 'ready' | 'error';
  setGuideContent: (guide: GeneratedGuide | null) => void;
  setGuideStatus: (status: 'idle' | 'generating' | 'verifying' | 'formatted' | 'ready' | 'error') => void;

  // Products
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;

  // Stats & Revenue
  stats: DashboardStats;
  revenueData: RevenueDataPoint[];
  productRevenue: ProductRevenue[];

  // Distribution
  contentPosts: ContentPost[];
  addContentPost: (post: ContentPost) => void;
  updateContentPost: (id: string, updates: Partial<ContentPost>) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────

export const usePanicStore = create<PanicStore>((set, get) => ({
  // Navigation
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Threads
  threads: demoThreads,
  selectedThread: null,
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  selectThread: (thread) => set({ selectedThread: thread, activeTab: 'generate-guide' }),
  getFilteredThreads: () => {
    const { threads, searchQuery } = get();
    if (!searchQuery.trim()) return threads;
    const q = searchQuery.toLowerCase();
    return threads.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.subreddit.toLowerCase().includes(q) ||
        t.niche.toLowerCase().includes(q) ||
        t.snippet.toLowerCase().includes(q)
    );
  },

  // Guide Generation
  guideContent: null,
  guideStatus: 'idle',
  setGuideContent: (guide) => set({ guideContent: guide }),
  setGuideStatus: (status) => set({ guideStatus: status }),

  // Products
  products: demoProducts,
  addProduct: (product) => set((s) => ({ products: [...s.products, product] })),
  updateProduct: (id, updates) =>
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  // Stats & Revenue
  stats: {
    totalProducts: 4,
    monthlyRevenue: 4810,
    activePages: 3,
    avgBuildTime: '4.2 hrs',
    totalSales: 248,
    revenueGrowth: 32.4,
    topNiche: 'Crypto / Taxes',
  },
  revenueData: demoRevenueData,
  productRevenue: demoProductRevenue,

  // Distribution
  contentPosts: demoContentPosts,
  addContentPost: (post) => set((s) => ({ contentPosts: [...s.contentPosts, post] })),
  updateContentPost: (id, updates) =>
    set((s) => ({
      contentPosts: s.contentPosts.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
}));
