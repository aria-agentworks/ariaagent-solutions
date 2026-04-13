import { NextRequest, NextResponse } from 'next/server';

const products = [
  { id: 'p1', title: 'Crypto Tax Survival Guide 2025', niche: 'Crypto Tax', price: 37, status: 'live', revenue: 3200, salesCount: 86, buildTime: '6 hours', platform: 'Gumroad' },
  { id: 'p2', title: 'Medical Bill Negotiation Playbook', niche: 'Medical Bills', price: 37, status: 'live', revenue: 1800, salesCount: 49, buildTime: '5 hours', platform: 'Gumroad' },
  { id: 'p3', title: 'H1B Visa Approval Blueprint', niche: 'Immigration', price: 47, status: 'listed', revenue: 0, salesCount: 0, buildTime: '7 hours', platform: 'Gumroad' },
  { id: 'p4', title: 'First-Time Landlord Legal Kit', niche: 'Landlord Law', price: 37, status: 'draft', revenue: 0, salesCount: 0, buildTime: '—', platform: 'Gumroad' },
];

export async function GET() {
  return NextResponse.json({ products });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newProduct = {
      id: `p${Date.now()}`,
      title: body.title || 'New Product',
      niche: body.niche || 'General',
      price: body.price || 37,
      status: 'draft',
      revenue: 0,
      salesCount: 0,
      buildTime: '—',
      platform: 'Gumroad',
    };
    return NextResponse.json({ product: newProduct });
  } catch {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
