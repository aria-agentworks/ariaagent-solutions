import { NextRequest, NextResponse } from 'next/server';

// ─── POST /api/action — Take Action on Ad ────────────────────────────────
// Simulates ad pause, resume, scale actions via Meta Graph API

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adId, action } = body;

    if (!adId || !action) {
      return NextResponse.json({ error: 'adId and action are required' }, { status: 400 });
    }

    const validActions = ['pause', 'resume', 'scale'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Simulate Meta Graph API call
    const statusMap: Record<string, string> = {
      pause: 'PAUSED',
      resume: 'ACTIVE',
      scale: 'ACTIVE (SCALED)',
    };

    return NextResponse.json({
      success: true,
      adId,
      action,
      newStatus: statusMap[action],
      message: `Ad ${adId} has been ${action}d successfully`,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
