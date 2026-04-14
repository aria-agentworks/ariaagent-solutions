import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    totalProducts: 4,
    monthlyRevenue: 7400,
    activePages: 3,
    avgBuildTime: '5.5 hrs',
    totalRevenue: 21110,
    totalSales: 135,
    revenueGrowth: 42,
  });
}
