import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { generateAutoReply } from '@/lib/outreach-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, status, message, channel, leadName, leadTitle, leadCompany, leadIndustry, productContext } = body;

    if (!leadId || !status) {
      return NextResponse.json({ success: false, error: 'leadId and status are required' }, { status: 400 });
    }

    const validStatuses = ['new', 'enriching', 'contacted', 'replied', 'interested', 'converted', 'lost', 'bounced'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const syntheticLead = {
      id: leadId,
      name: leadName || 'Lead',
      title: leadTitle || 'Decision Maker',
      company: leadCompany || 'Company',
      domain: '',
      industry: leadIndustry || 'Tech',
      employeeCount: '',
      channel: (channel || 'email') as 'email' | 'linkedin',
      status: status as 'new' | 'contacted' | 'replied' | 'interested' | 'converted' | 'lost',
      notes: message || '',
      createdAt: new Date().toISOString(),
      email: '',
      phone: '',
      website: '',
      location: '',
      country: '',
      source: 'manual' as const,
      productId: null,
      nextAction: null as null,
      nextActionDate: null as null,
      emailSequenceStep: 0,
      linkedinStatus: 'none' as const,
      tags: [],
      lastContactedAt: null,
      messageHistory: [],
    };

    let suggestedReply: string | null = null;

    if (status === 'interested' || status === 'replied') {
      try {
        const zai = await ZAI.create();
        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'system', content: 'You are a B2B outreach specialist. Generate a personalized, non-salesy reply. Keep it under 200 words.' },
            { role: 'user', content: `Generate a reply for: ${leadName} (${leadTitle}) at ${leadCompany}. Status: ${status}. ${message ? `Their message: ${message}` : ''}` },
          ],
          temperature: 0.7,
          max_tokens: 500,
        });
        suggestedReply = completion.choices[0]?.message?.content?.trim() || generateAutoReply(syntheticLead, productContext);
      } catch {
        suggestedReply = generateAutoReply(syntheticLead, productContext);
      }
    }

    let nextAction: string | null = null;
    let nextActionDate: string | null = null;

    switch (status) {
      case 'new': nextAction = 'enrich'; nextActionDate = new Date().toISOString(); break;
      case 'contacted': nextAction = 'email2'; nextActionDate = new Date(Date.now() + 3 * 86400000).toISOString(); break;
      case 'replied': nextAction = 'followup'; nextActionDate = new Date().toISOString(); break;
      case 'interested': nextAction = 'close'; nextActionDate = new Date(Date.now() + 2 * 86400000).toISOString(); break;
      case 'converted': nextAction = null; nextActionDate = null; break;
    }

    return NextResponse.json({
      success: true,
      updatedLead: { id: leadId, status, nextAction, nextActionDate, lastContactedAt: new Date().toISOString(), channel },
      suggestedReply,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
