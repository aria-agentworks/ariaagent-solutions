import type { Lead, LeadAction, MessageHistoryEntry } from '@/types/marketing';

/**
 * Automated Outreach Engine for ariaagent Marketing Platform
 * Handles follow-up scheduling, pipeline advancement, and auto-reply generation.
 */

// Pipeline timing configuration (in days)
const PIPELINE_TIMING: Record<string, number> = {
  new_to_contacted: 0,       // Immediate
  contacted_to_replied: 3,   // 3 days after contact
  replied_to_interested: 2,  // 2 days after reply
  interested_to_converted: 3, // 3 days after showing interest
};

// Pipeline stage mapping
const PIPELINE_FLOW: Record<string, string> = {
  new: 'contacted',
  contacted: 'replied',
  replied: 'interested',
  interested: 'converted',
};

// Action labels for display
const ACTION_LABELS: Record<LeadAction, string> = {
  connect: 'Send Connection',
  followup1: 'Send Follow-up #1',
  followup2: 'Send Follow-up #2',
  close: 'Close the Deal',
  reply: 'Send Reply',
};

/**
 * Calculate the next action date based on days delay from now.
 */
export function scheduleFollowUp(leadId: string, daysDelay: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysDelay);
  return date.toISOString();
}

/**
 * Get leads that have overdue follow-ups (nextActionDate is past).
 */
export function getOverdueFollowUps(leads: Lead[]): Lead[] {
  const now = new Date();
  return leads.filter((lead) => {
    if (!lead.nextAction || !lead.nextActionDate) return false;
    if (lead.status === 'converted' || lead.status === 'lost') return false;
    constactionDate = new Date(lead.nextActionDate);
    return actionDate <= now;
  });
}

/**
 * Get leads that need action, sorted by urgency (most overdue first).
 */
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
    if (lead.status === 'converted' || lead.status === 'lost') continue;

    if (lead.nextAction && lead.nextActionDate) {
      constactionDate = new Date(lead.nextActionDate);
      if (actionDate <= now) {
        overdue.push(lead);
      } else {
        upcoming.push(lead);
      }
    }

    // Categorize by action type
    switch (lead.nextAction) {
      case 'connect':
        needsConnection.push(lead);
        break;
      case 'followup1':
      case 'followup2':
        needsFollowUp.push(lead);
        break;
      case 'close':
        needsClose.push(lead);
        break;
      case 'reply':
        needsReply.push(lead);
        break;
    }
  }

  // Sort overdue by most overdue first
  overdue.sort((a, b) => {
    const dateA = a.nextActionDate ? new Date(a.nextActionDate).getTime() : 0;
    const dateB = b.nextActionDate ? new Date(b.nextActionDate).getTime() : 0;
    return dateA - dateB;
  });

  return { overdue, upcoming, needsConnection, needsFollowUp, needsClose, needsReply };
}

/**
 * Auto-advance lead through pipeline based on current status and timing.
 * Returns the updated lead fields to apply.
 */
export function autoAdvancePipeline(lead: Lead): Partial<Lead> {
  const now = new Date();
  const updates: Partial<Lead> = {};

  if (lead.status === 'converted' || lead.status === 'lost') {
    return updates;
  }

  // If no nextAction set, initialize based on current status
  if (!lead.nextAction) {
    switch (lead.status) {
      case 'new':
        updates.nextAction = 'connect';
        updates.nextActionDate = now.toISOString();
        break;
      case 'contacted':
        updates.nextAction = 'followup1';
        updates.nextActionDate = scheduleFollowUp(lead.id, PIPELINE_TIMING.contacted_to_replied);
        break;
      case 'replied':
        updates.nextAction = 'reply';
        updates.nextActionDate = now.toISOString();
        break;
      case 'interested':
        updates.nextAction = 'close';
        updates.nextActionDate = scheduleFollowUp(lead.id, PIPELINE_TIMING.interested_to_converted);
        break;
    }
    return updates;
  }

  // Check if the next action is overdue
  if (lead.nextActionDate && new Date(lead.nextActionDate) <= now) {
    switch (lead.nextAction) {
      case 'connect':
        updates.status = 'contacted';
        updates.lastContactedAt = now.toISOString();
        updates.nextAction = 'followup1';
        updates.nextActionDate = scheduleFollowUp(lead.id, PIPELINE_TIMING.contacted_to_replied);
        updates.messageHistory = [
          ...(lead.messageHistory || []),
          { step: 'connection', sentAt: now.toISOString(), content: 'Connection request sent' },
        ];
        break;
      case 'followup1':
        updates.nextAction = 'followup2';
        updates.nextActionDate = scheduleFollowUp(lead.id, 3);
        updates.lastContactedAt = now.toISOString();
        updates.messageHistory = [
          ...(lead.messageHistory || []),
          { step: 'followup1', sentAt: now.toISOString(), content: 'Follow-up #1 sent' },
        ];
        break;
      case 'followup2':
        updates.nextAction = 'close';
        updates.lastContactedAt = now.toISOString();
        updates.messageHistory = [
          ...(lead.messageHistory || []),
          { step: 'followup2', sentAt: now.toISOString(), content: 'Follow-up #2 sent' },
        ];
        break;
      case 'reply':
        updates.status = 'interested';
        updates.nextAction = 'close';
        updates.nextActionDate = scheduleFollowUp(lead.id, PIPELINE_TIMING.interested_to_converted);
        updates.lastContactedAt = now.toISOString();
        updates.messageHistory = [
          ...(lead.messageHistory || []),
          { step: 'reply', sentAt: now.toISOString(), content: 'Auto-reply sent' },
        ];
        break;
      case 'close':
        updates.status = 'converted';
        updates.nextAction = undefined;
        updates.nextActionDate = undefined;
        updates.messageHistory = [
          ...(lead.messageHistory || []),
          { step: 'close', sentAt: now.toISOString(), content: 'Closing message sent — lead converted!' },
        ];
        break;
    }
  }

  return updates;
}

/**
 * Generate a contextual AI reply for an interested/replied lead.
 * This is a template-based generator for the API to enhance with AI.
 */
export function generateAutoReply(lead: Lead, context?: string): string {
  const productName = context || 'our AI playbook';

  switch (lead.status) {
    case 'replied':
      return `Hi ${lead.name.split(' ')[0]}, thanks for getting back to me! I noticed you're ${lead.title} at ${lead.company} — that's exactly the profile ${productName} was built for. Would love to share a quick case study relevant to your ${lead.industry} space. Want me to send it over?`;

    case 'interested':
      return `Hi ${lead.name.split(' ')[0]}, great to hear you're interested! Here's what ${productName} covers that directly applies to ${lead.company}:\n\n1. A phased implementation roadmap tailored to ${lead.industry}\n2. ROI projections based on companies of your size (${lead.employeeCount} employees)\n3. Vendor comparison matrix to save you weeks of research\n\nWould a 10-min walkthrough this week work?`;

    default:
      return `Hi ${lead.name.split(' ')[0]}, wanted to follow up on my earlier message. Happy to share more details about ${productName} whenever you're ready.`;
  }
}

/**
 * Get a time-until string for a lead's next action (e.g., "2 days overdue", "Due tomorrow").
 */
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

/**
 * Mark a lead's current action as completed and advance to next step.
 */
export function markActionComplete(lead: Lead): Partial<Lead> {
  const now = new Date();
  const history: MessageHistoryEntry[] = [...(lead.messageHistory || [])];

  switch (lead.nextAction) {
    case 'connect':
      history.push({ step: 'connection', sentAt: now.toISOString(), content: 'Connection request marked as sent' });
      return {
        status: 'contacted',
        lastContactedAt: now.toISOString(),
        nextAction: 'followup1',
        nextActionDate: scheduleFollowUp(lead.id, PIPELINE_TIMING.contacted_to_replied),
        messageHistory: history,
      };
    case 'followup1':
      history.push({ step: 'followup1', sentAt: now.toISOString(), content: 'Follow-up #1 marked as sent' });
      return {
        lastContactedAt: now.toISOString(),
        nextAction: 'followup2',
        nextActionDate: scheduleFollowUp(lead.id, 3),
        messageHistory: history,
      };
    case 'followup2':
      history.push({ step: 'followup2', sentAt: now.toISOString(), content: 'Follow-up #2 marked as sent' });
      return {
        lastContactedAt: now.toISOString(),
        nextAction: 'close',
        nextActionDate: scheduleFollowUp(lead.id, 2),
        messageHistory: history,
      };
    case 'reply':
      history.push({ step: 'reply', sentAt: now.toISOString(), content: 'Reply marked as sent' });
      return {
        status: 'interested',
        lastContactedAt: now.toISOString(),
        nextAction: 'close',
        nextActionDate: scheduleFollowUp(lead.id, PIPELINE_TIMING.interested_to_converted),
        messageHistory: history,
      };
    case 'close':
      history.push({ step: 'close', sentAt: now.toISOString(), content: 'Closing message sent — lead converted!' });
      return {
        status: 'converted',
        lastContactedAt: now.toISOString(),
        nextAction: undefined,
        nextActionDate: undefined,
        messageHistory: history,
      };
    default:
      return {};
  }
}

export { ACTION_LABELS, PIPELINE_FLOW };
