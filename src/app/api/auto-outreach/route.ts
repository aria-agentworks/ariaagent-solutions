import { NextResponse } from 'next/server';
import { getLeadsNeedingAction, getTimeUntilNextAction, generateAutoReply } from '@/lib/outreach-engine';
import type { Lead } from '@/types/marketing';

export async function GET(request: globalThis.Request) {
  try {
    const { searchParams } = new URL(request.url);
    const leadsParam = searchParams.get('leads');

    if (!leadsParam) {
      return NextResponse.json({
        success: true,
        message: 'Auto-outreach engine ready. Pass leads as query param to get action queue.',
      });
    }

    let leads: Lead[];
    try {
      const decoded = atob(leadsParam);
      leads = JSON.parse(decoded);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid leads data.' }, { status: 400 });
    }

    const actionQueue = getLeadsNeedingAction(leads);

    const leadsWithMessages = actionQueue.overdue.map((lead) => ({
      ...lead,
      timeUntilNext: getTimeUntilNextAction(lead),
      suggestedMessage: (lead.status === 'replied' || lead.status === 'interested') ? generateAutoReply(lead) : null,
    }));

    return NextResponse.json({
      success: true,
      summary: {
        totalOverdue: actionQueue.overdue.length,
        totalUpcoming: actionQueue.upcoming.length,
        needsConnection: actionQueue.needsConnection.length,
        needsFollowUp: actionQueue.needsFollowUp.length,
        needsClose: actionQueue.needsClose.length,
        needsReply: actionQueue.needsReply.length,
      },
      overdueLeads: leadsWithMessages,
      upcomingLeads: actionQueue.upcoming.map((lead) => ({
        ...lead,
        timeUntilNext: getTimeUntilNextAction(lead),
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
