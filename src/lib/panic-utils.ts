export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function getPanicColor(score: number): string {
  if (score >= 9) return 'text-red-400 bg-red-400/10 border-red-400/20';
  if (score >= 7) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
  return 'text-yellow-300 bg-yellow-300/10 border-yellow-300/20';
}

export function getPanicLabel(score: number): string {
  if (score >= 9) return 'EXTREME';
  if (score >= 7) return 'HIGH';
  if (score >= 5) return 'MEDIUM';
  return 'LOW';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'live': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'listed': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'draft': return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    case 'posted': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'scheduled': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
  }
}

export function calculateStackAnalysis(currentMonthly: number, targetMonthly: number, avgPerProduct: number) {
  const gap = Math.max(0, targetMonthly - currentMonthly);
  const productsNeeded = Math.ceil(gap / avgPerProduct);
  return { currentMonthly, gap, productsNeeded };
}
