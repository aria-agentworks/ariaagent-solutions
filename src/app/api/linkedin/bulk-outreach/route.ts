import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

interface BulkOutreachRequest {
  leads: {
    companyName: string;
    name: string;
    title: string;
    domain: string;
    industry: string;
    employeeCount: string;
  }[];
  productName: string;
  productUrl: string;
  productPrice: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BulkOutreachRequest = await request.json();
    const { leads, productName, productUrl, productPrice } = body;

    const zai = await ZAI.create();

    const leadList = leads.slice(0, 20).map((l, i) =>
      `${i + 1}. ${l.name}, ${l.title} at ${l.companyName} (${l.industry}, ${l.employeeCount} employees, ${l.domain})`
    ).join('\n');

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a LinkedIn outreach specialist. Generate hyper-personalized connection requests for a batch of leads. Each message must feel unique and reference the specific lead's company and role.`
        },
        {
          role: 'user',
          content: `Generate a personalized LinkedIn connection request (under 300 characters each) for each of these leads. The product is "${productName}" ($${productPrice}) at ${productUrl}.

LEADS:
${leadList}

Respond ONLY as a JSON array (no markdown, no code blocks). Each object must have:
{"name": "...", "connectionRequest": "...", "followUp1": "...", "followUp2": "..."}`
        }
      ],
      temperature: 0.8,
      max_tokens: 4000,
    });

    let content = completion.choices[0]?.message?.content || '';
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let messages;
    try {
      messages = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        messages = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json({ success: false, error: 'Failed to parse AI response' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, messages });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
