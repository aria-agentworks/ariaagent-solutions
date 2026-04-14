import { NextResponse } from 'next/server';

interface GumroadProduct {
  id: string;
  name: string;
  url: string;
  description: string;
  price: number;
  sales_count: number;
  revenue: number;
}

interface GumroadSale {
  id: string;
  product_id: string;
  product_name: string;
  email: string;
  price: number;
  created_at: string;
  variants?: string;
}

/**
 * GET /api/gumroad/sales
 * Fetches real sales data from Gumroad API.
 */
export async function GET() {
  try {
    const token = process.env.GUMROAD_ACCESS_TOKEN;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'GUMROAD_ACCESS_TOKEN not configured' },
        { status: 500 }
      );
    }

    // Fetch sales from Gumroad
    const salesResponse = await fetch('https://api.gumroad.com/v2/sales', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!salesResponse.ok) {
      const errorText = await salesResponse.text();
      console.error('[Gumroad Sales API] Error:', errorText);
      return NextResponse.json(
        { success: false, error: `Gumroad API returned ${salesResponse.status}` },
        { status: 502 }
      );
    }

    const salesData = await salesResponse.json();

    // Fetch products for context
    const productsResponse = await fetch('https://api.gumroad.com/v2/products', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    let products: GumroadProduct[] = [];
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      products = (productsData.products || []).map((p: Record<string, unknown>) => ({
        id: String(p.id || ''),
        name: String(p.name || ''),
        url: String(p.short_url || p.url || ''),
        description: String(p.description || ''),
        price: Number(p.price) || 0,
        sales_count: Number(p.sales_count) || 0,
        revenue: Number(p.sales_total_cents) ? Number(p.sales_total_cents) / 100 : 0,
      }));
    }

    // Parse sales
    const sales: GumroadSale[] = (salesData.sales || []).map((s: Record<string, unknown>) => ({
      id: String(s.id || ''),
      product_id: String(s.product_id || ''),
      product_name: String(s.product_name || ''),
      email: String(s.email || ''),
      price: typeof s.amount_cents === 'number' ? s.amount_cents / 100 : Number(s.price) || 0,
      created_at: String(s.created_at || ''),
      variants: String(s.variants || ''),
    }));

    // Calculate totals
    const totalRevenue = sales.reduce((sum, s) => sum + s.price, 0);
    const totalSales = sales.length;
    const recentSales = sales.slice(0, 20); // Last 20 sales

    // Revenue by product
    const revenueByProduct = new Map<string, { name: string; sales: number; revenue: number }>();
    for (const sale of sales) {
      const existing = revenueByProduct.get(sale.product_id) || { name: sale.product_name, sales: 0, revenue: 0 };
      existing.sales += 1;
      existing.revenue += sale.price;
      revenueByProduct.set(sale.product_id, existing);
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalRevenue,
        totalSales,
        productCount: revenueByProduct.size,
        lastSync: new Date().toISOString(),
      },
      products: Array.from(revenueByProduct.entries()).map(([id, data]) => ({
        id,
        ...data,
      })),
      recentSales,
      rawProducts: products,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Gumroad Sales API] Error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
