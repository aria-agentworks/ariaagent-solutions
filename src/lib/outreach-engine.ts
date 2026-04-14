import type { Lead, MessageHistoryEntry } from '@/types/marketing';

/**
 * Automated Outreach Engine for ariaagent Marketing Platform
 * Handles follow-up scheduling, pipeline advancement, and auto-reply generation.
 */

const PIPELINE_TIMING: Record<string, number> = {
  new_to_contacted: 0,
  contacted_to_replied: 3,
  replied_to_interested: 2,
  interested_to_converted: 3,
};

const PIPELINE_FLOW: Record<string, string> = {
  new: 'contacted',
  enriching: 'contacted',
  contacted: 'replied',
  replied: 'interested',
  interested: 'converted',
};

export const ACTION_LABELS: Record<string, string> = {
  enrich: 'Enrich Lead',
  email1: 'Send Email #1',
  email2: 'Send Email #2',
  email3: 'Send Email #3',
  linkedin_connect: 'Send LinkedIn Connect',
  linkedin_dm: 'Send LinkedIn DM',
  followup: 'Send Follow-up',
  close: 'Close the Deal',
};

export function scheduleFollowUp(leadId: string, daysDelay: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysDelay);
  return date.toISOString();
}

export function getLeadsNeedingAction(leads: Lead[]): {
  overdue: Lead[];
  upcoming: Lead[];
  needsConnection: Lead[];
  needsFollowUp: Lead[];
  needsClose: Lead[];
  needsReply: Lead[];
} {
  const now = new Date();
  const overdue: Lead[] = [];
  const upcoming: Lead[] = [];
  const needsConnection: Lead[] = [];
  const needsFollowUp: Lead[] = [];
  const needsClose: Lead[] = [];
  const needsReply: Lead[] = [];

  for (const lead of leads) {
    if (lead.status === 'converted' || lead.status === 'lost' || lead.status === 'bounced') continue;

    if (lead.nextAction && lead.nextActionDate) {
      constactionDate = new Date(lead.nextActionDate);
      if (actionDate <= now) {
        overdue.push(lead);
      } else {
        upcoming.push(lead);
      }
    }

    if (lead.nextAction === 'enrich' || lead.nextAction === 'email1' || lead.nextAction === 'linkedin_connect') {
      needsConnection.push(lead);
    } else if (lead.nextAction === 'email2' || lead.nextAction === 'email3' || lead.nextAction === 'followup') {
      needsFollowUp.push(lead);
    } else if (lead.nextAction === 'close') {
      needsClose.push(lead);
    } else if (lead.nextAction === 'linkedin_dm') {
      needsReply.push(lead);
    }
  }

  overdue.sort((a, b) => {
    const dateA = a.nextActionDate ? new Date(a.nextActionDate).getTime() : 0;
    const dateB = b.nextActionDate ? new Date(b.nextActionDate).getTime() : 0;
    return dateA - dateB;
  });

  return { overdue, upcoming, needsConnection, needsFollowUp, needsClose, needsReply };
}

export function generateAutoReply(lead: Lead, context?: string): string {
  const productName = context || 'our AI playbook';
  const firstName = lead.name ? lead.name.split(' ')[0] : 'there';

  switch (lead.status) {
    case 'replied':
      return `Hi ${firstName}, thanks for getting back to me! I noticed you're ${lead.title} at ${lead.company} — that's exactly the profile ${productName} was built for. Would love to share a quick case study relevant to your ${lead.industry} space. Want me to send it over?`;
    case 'interested':
      return `Hi ${firstName}, great to hear you're interested! Here's what ${productName} covers that directly applies to ${lead.company}:\n\n1. A phased implementation roadmap tailored to ${lead.industry}\n2. ROI projections based on companies of your size (${lead.employeeCount} employees)\n3. Vendor comparison matrix to save you weeks of research\n\nWould a 10-min walkthrough this week work?`;
    default:
      return `Hi ${firstName}, wanted to follow up on my earlier message. Happy to share more details about ${productName} whenever you're ready.`;
  }
}

export function getTimeUntilNextAction(lead: Lead): string {
  if (!lead.nextActionDate) return 'No action scheduled';

  const now = new Date();
  constactionDate = new Date(lead.nextActionDate);
  const diffMs = actionDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)}d overdue`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else {
    return `In ${diffDays} days`;
  }
}

export function markActionComplete(lead: Lead): Partial<Lead> {
  const now = new Date();
  const history: MessageHistoryEntry[] = [...(lead.messageHistory || [])];

  switch (lead.nextAction) {
    case 'enrich':
      history.push({ type: 'enrich', channel: 'email', content: 'Lead enriched', sentAt: now.toISOString(), status: 'completed' });
      return { lastContactedAt: now.toISOString(), nextAction: 'email1', nextActionDate: now.toISOString(), messageHistory: history };
    case 'email1':
      history.push({ type: 'email', channel: 'email', content: 'Email #1 marked as sent', sentAt: now.toISOString(), status: 'sent' });
      return { status: 'contacted', lastContactedAt: now.toISOString(), nextAction: 'email2', emailSequenceStep: 1, nextActionDate: scheduleFollowUp(lead.id, PIPELINE_TIMING.contacted_to_replied), messageHistory: history };
    case 'email2':
      history.push({ type: 'email', channel: 'email', content: 'Email #2 marked as sent', sentAt: now.toISOString(), status: 'sent' });
      return { lastContactedAt: now.toISOString(), nextAction: 'email3', emailSequenceStep: 2, nextActionDate: scheduleFollowUp(lead.id, 4), messageHistory: history };
    case 'email3':
      history.push({ type: 'email', channel: 'email', content: 'Email #3 marked as sent', sentAt: now.toISOString(), status: 'sent' });
      return { lastContactedAt: now.toISOString(), nextAction: 'close', emailSequenceStep: 3, nextActionDate: scheduleFollowUp(lead.id, PIPELINE_TIMING.interested_to_converted), messageHistory: history };
    case 'linkedin_connect':
      history.push({ type: 'linkedin_connect', channel: 'linkedin', content: 'LinkedIn connection marked as sent', sentAt: now.toISOString(), status: 'sent' });
      return { lastContactedAt: now.toISOString(), linkedinStatus: 'connection_sent', nextAction: 'linkedin_dm', nextActionDate: scheduleFollowUp(lead.id, 3), messageHistory: history };
    case 'linkedin_dm':
      history.push({ type: 'linkedin_dm', channel: 'linkedin', content: 'LinkedIn DM marked as sent', sentAt: now.toISOString(), status: 'sent' });
      return { lastContactedAt: now.toISOString(), linkedinStatus: 'dm_sent', nextAction: 'followup', nextActionDate: scheduleFollowUp(lead.id, 3), messageHistory: history };
    case 'followup':
      history.push({ type: 'followup', channel: lead.channel, content: 'Follow-up marked as sent', sentAt: now.toISOString(), status: 'sent' });
      return { lastContactedAt: now.toISOString(), nextAction: 'close', nextActionDate: scheduleFollowUp(lead.id, 2), messageHistory: history };
    case 'close':
      history.push({ type: 'close', channel: lead.channel, content: 'Closing message sent — lead converted!', sentAt: now.toISOString(), status: 'converted' });
      return { status: 'converted', lastContactedAt: now.toISOString(), nextAction: null, nextActionDate: null, messageHistory: history };
    default:
      return {};
  }
}

export { PIPELINE_FLOW };
