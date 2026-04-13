import type { Product, RedditThread } from '@/types/product';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function getStatusColor(status: Product['status']): string {
  switch (status) {
    case 'live':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'listed':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'draft':
      return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    default:
      return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  }
}

export function getStatusLabel(status: Product['status']): string {
  switch (status) {
    case 'live':
      return 'Live';
    case 'listed':
      return 'Listed';
    case 'draft':
      return 'Draft';
    default:
      return 'Unknown';
  }
}

export function getPanicColor(score: number): string {
  if (score >= 90) return 'text-red-400';
  if (score >= 70) return 'text-amber-400';
  return 'text-emerald-400';
}

export function getPanicLabel(score: number): string {
  if (score >= 90) return 'EXTREME';
  if (score >= 70) return 'HIGH';
  if (score >= 50) return 'MEDIUM';
  return 'LOW';
}

export function generateId(): string {
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export function getMaxRevenue(): number {
  return Math.max(
    ...[
      4810, 2886, 1880, 1200, 2100, 3400, 2800, 4100, 5200, 0,
    ]
  );
}

export function getStackAnalysis(monthlyRevenue: number, target: number = 10000): { current: number; needed: number; productsNeeded: number; avgRevenuePerProduct: number } {
  const productsRevenue = [4810, 2886, 1880];
  const avgRevenuePerProduct = productsRevenue.reduce((a, b) => a + b, 0) / productsRevenue.length;
  const gap = Math.max(0, target - monthlyRevenue);
  const productsNeeded = Math.ceil(gap / avgRevenuePerProduct);
  return {
    current: monthlyRevenue,
    needed: gap,
    productsNeeded,
    avgRevenuePerProduct,
  };
}

export function threadToGuideContext(thread: RedditThread): string {
  return `Thread: "${thread.title}" from ${thread.subreddit}
Author: ${thread.author} | Upvotes: ${thread.upvotes.toLocaleString()} | Comments: ${thread.comments.toLocaleString()}
Panic Score: ${thread.panicScore}/100

Original Post:
${thread.snippet}

Top Comments:
${thread.topComments.map((c) => `[${c.upvotes} upvotes] u/${c.author}: ${c.text}`).join('\n\n')}`;
}

export function getCalendarDays(): { day: number; label: string; hasPost: boolean; isToday: boolean }[] {
  const days: { day: number; label: string; hasPost: boolean; isToday: boolean }[] = [];
  const today = new Date().getDate();
  for (let i = 1; i <= 30; i++) {
    days.push({
      day: i,
      label: i.toString(),
      hasPost: [3, 5, 8, 10, 12, 14, 15, 17, 19, 21, 24, 26, 28].includes(i),
      isToday: i === today,
    });
  }
  return days;
}
