import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { generateAutoReply } from '@/lib/outreach-engine';

interface LeadUpdateRequest {
  leadId: string;
  status: string;
  message?: string;
  channel?: string;
  leadName?: string;
  leadTitle?: string;
  leadCompany?: string;
  leadIndustry?: string;
  productContext?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LeadUpdateRequest = await request.json();
    const { leadId, status, message, channel, leadName, leadTitle, leadCompany, leadIndustry, productContext } = body;

    if (!leadId || !status) {
      return NextResponse.json(
        { success: false, error: 'leadId and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['new', 'contacted', 'replied', 'interested', 'converted', 'lost'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Build a synthetic lead object for auto-reply generation
    const syntheticLead = {
      id: leadId,
      projectId: '',
      name: leadName || 'Lead',
      title: leadTitle || 'Decision Maker',
      company: leadCompany || 'Company',
      domain: '',
      industry: leadIndustry || 'Tech',
      employeeCount: '',
      channel: (channel || 'manual') as 'linkedin' | 'twitter' | 'reddit' | 'email' | 'manual',
      status: status as 'new' | 'contacted' | 'replied' | 'interested' | 'converted' | 'lost',
      notes: message || '',
      createdAt: new Date().toISOString(),
    };

    // Auto-generate reply if status is 'interested' or 'replied'
    let suggestedReply: string | null = null;

    if (status === 'interested' || status === 'replied') {
      try {
        const zai = await ZAI.create();

        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `You are a LinkedIn outreach specialist for ariaagent solutions. Generate a personalized, non-salesy reply message. Keep it under 200 words. Sound like a peer, not a vendor. Be specific about their role and company.`,
            },
            {
              role: 'user',
              content: `Generate a reply for this lead:
Name: ${syntheticLead.name}
Title: ${syntheticLead.title}
Company: ${syntheticLead.company}
Industry: ${syntheticLead.industry}
Their status changed to: ${status}
${message ? `Their message: ${message}` : 'They expressed interest in our AI playbook.'}
${productContext ? `Product context: ${productContext}` : ''}

Write a concise, warm reply that moves the conversation forward.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        });

        suggestedReply = completion.choices[0]?.message?.content?.trim() || generateAutoReply(syntheticLead, productContext);
      } catch {
        // Fallback to template-based reply
        suggestedReply = generateAutoReply(syntheticLead, productContext);
      }
    }

    // Calculate next action based on new status
    let nextAction: string | null = null;
    let nextActionDate: string | null = null;

    switch (status) {
      case 'new':
        nextAction = 'connect';
        nextActionDate = new Date().toISOString();
        break;
      case 'contacted':
        nextAction = 'followup1';
        nextActionDate = new Date(Date.now() + 3 * 86400000).toISOString();
        break;
      case 'replied':
        nextAction = 'reply';
        nextActionDate = new Date().toISOString();
        break;
      case 'interested':
        nextAction = 'close';
        nextActionDate = new Date(Date.now() + 2 * 86400000).toISOString();
        break;
      case 'converted':
        nextAction = null;
        nextActionDate = null;
        break;
    }

    return NextResponse.json({
      success: true,
      updatedLead: {
        id: leadId,
        status,
        nextAction,
        nextActionDate,
        lastContactedAt: new Date().toISOString(),
        channel,
      },
      suggestedReply,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
