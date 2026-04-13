import { NextResponse } from 'next/server';
import type { Product } from '@/types/product';

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

export async function GET() {
  return NextResponse.json(demoProducts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, niche, price, status = 'draft' } = body;

  if (!title || !niche || !price) {
    return NextResponse.json({ error: 'Title, niche, and price are required' }, { status: 400 });
  }

  const newProduct: Product = {
    id: `p${Date.now().toString(36)}`,
    title,
    niche,
    price: Number(price),
    status,
    revenue: 0,
    sales: 0,
    createdAt: new Date().toISOString().split('T')[0],
  };

  return NextResponse.json(newProduct, { status: 201 });
}
