import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

interface OutreachRequest {
  companyName: string;
  domain: string;
  industry: string;
  employeeCount: string;
  leadTitle: string;
  productName: string;
  productUrl: string;
  productPrice: string;
  leadContext?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: OutreachRequest = await request.json();
    const { companyName, domain, industry, employeeCount, leadTitle, productName, productUrl, productPrice, leadContext } = body;

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a LinkedIn outreach specialist for ariaagent solutions, a company that sells CFO-level AI strategy playbooks on Gumroad. You write hyper-personalized, non-spammy LinkedIn connection requests and follow-up messages.

RULES:
- Never sound like a sales pitch in the first message
- Reference something specific about their company, industry, or role
- Keep connection request under 300 characters
- Keep follow-up messages under 500 words
- Always mention a specific pain point relevant to their role
- Include the product link naturally, not aggressively
- Sound like a peer, not a vendor
- Use their company name, industry, and role context`
        },
        {
          role: 'user',
          content: `Generate a LinkedIn outreach sequence for this lead:

COMPANY: ${companyName}
DOMAIN: ${domain}
INDUSTRY: ${industry}
COMPANY SIZE: ${employeeCount}
LEAD TITLE: ${leadTitle}
${leadContext ? `ADDITIONAL CONTEXT: ${leadContext}` : ''}

PRODUCT: ${productName} ($${productPrice})
PRODUCT URL: ${productUrl}

Generate exactly 3 messages:
1. Connection Request (under 300 chars - this goes in the connection note)
2. Follow-up Message #1 (send 2-3 days after connection accepted - add value, share insight)
3. Follow-up Message #2 (send 5-7 days later - soft mention of the playbook with link)

Respond ONLY in this JSON format (no markdown, no code blocks):
{
  "connectionRequest": "...",
  "followUp1": "...",
  "followUp2": "...",
  "subjectLine": "..."
}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    let content = completion.choices[0]?.message?.content || '';

    // Clean up response
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let messages;
    try {
      messages = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        messages = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json({
          success: false,
          error: 'Failed to parse AI response',
          raw: content,
        }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, messages });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
