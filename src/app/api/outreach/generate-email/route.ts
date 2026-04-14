import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lead, product, step } = body;

    if (!lead || !product) {
      return NextResponse.json({ success: false, error: 'Lead and product are required' }, { status: 400 });
    }

    const zai = await ZAI.create();

    const stepInstructions: Record<number, string> = {
      1: `This is the FIRST cold email. Keep it SHORT (under 150 words). Be conversational, not salesy. Reference their specific company and role. End with one soft question.`,
      2: `This is a FOLLOW-UP email. Add value — share a relevant insight, case study, or data point about AI implementation in their industry. Keep it under 200 words. Soft CTA.`,
      3: `This is the CLOSING email. Mention the product name and include the product link: ${product.gumroadUrl || product.url}. Be direct but professional. Under 150 words.`,
    };

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a B2B email outreach specialist for ariaagent solutions. You sell AI strategy playbooks to CFOs and VPs.

RULES:
- Never sound like a generic mass email
- Reference their company name, industry, role specifically
- Be concise — busy executives skim
- Use a professional but conversational tone
- No exclamation marks in subject lines
- No "I hope this finds you well" or similar filler
- Personalize based on their industry pain points

PRODUCT: ${product.name} ($${product.price})
${step === 3 ? `PRODUCT URL: ${product.gumroadUrl || product.url}` : ''}
`,
        },
        {
          role: 'user',
          content: `Generate a personalized cold email for this lead:

LEAD NAME: ${lead.name || 'Unknown'}
TITLE: ${lead.title || 'Decision Maker'}
COMPANY: ${lead.company}
DOMAIN: ${lead.domain || 'N/A'}
INDUSTRY: ${lead.industry || 'Unknown'}
LOCATION: ${lead.location || 'Unknown'}
COMPANY SIZE: ${lead.employeeCount || 'Unknown'}

EMAIL STEP: ${step || 1} of 3

${stepInstructions[step || 1]}

Respond ONLY in this JSON format (no markdown, no code blocks):
{
  "subject": "email subject line",
  "body": "email body text"
}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    let content = completion.choices[0]?.message?.content || '';
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json({ success: false, error: 'Failed to parse AI response', raw: content }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
