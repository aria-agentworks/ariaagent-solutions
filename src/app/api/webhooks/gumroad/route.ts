import { NextRequest, NextResponse } from 'next/server';

interface GumroadSaleNotification {
  sale_id?: string;
  product_id?: string;
  product_name?: string;
  email?: string;
  price?: number;
  variant?: string;
  created_at?: string;
  // Gumroad ping format
  product_permalink?: string;
  short_product_id?: string;
  user_email?: string;
  amount_cents?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: GumroadSaleNotification = await request.json();

    // Log the incoming webhook for debugging
    console.log('[Gumroad Webhook] Received:', JSON.stringify(body, null, 2));

    // Extract sale details — Gumroad sends various formats
    const saleId = body.sale_id || `sale-${Date.now()}`;
    const productName = body.product_name || 'Unknown Product';
    const email = body.email || body.user_email || '';
    const priceCents = body.price || body.amount_cents || 0;
    const price = typeof priceCents === 'number' && priceCents > 1000 ? priceCents / 100 : priceCents;
    const createdAt = body.created_at || new Date().toISOString();

    // In a real implementation, this would:
    // 1. Look up the matching lead by email or product association
    // 2. Mark the lead as 'converted'
    // 3. Update revenue stats in the database
    // For now, return the processed data so the client can handle it

    return NextResponse.json({
      success: true,
      sale: {
        id: saleId,
        product_name: productName,
        email,
        price,
        created_at: createdAt,
      },
      message: `Sale processed: ${productName} for $${price}`,
      suggestedActions: email
        ? [`Mark lead with email ${email} as converted`, `Update revenue by $${price}`]
        : ['No email associated — manual matching required'],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Gumroad Webhook] Error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// GET endpoint to verify webhook is alive
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'Gumroad webhook endpoint is listening for sale notifications',
  });
}
