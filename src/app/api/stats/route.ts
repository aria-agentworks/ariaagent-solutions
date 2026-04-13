import { NextResponse } from 'next/server';

export async function GET() {
  const stats = {
    totalProducts: 4,
    monthlyRevenue: 4810,
    activePages: 3,
    avgBuildTime: '4.2 hrs',
    totalSales: 248,
    revenueGrowth: 32.4,
    topNiche: 'Crypto / Taxes',
  };

  return NextResponse.json(stats);
}
