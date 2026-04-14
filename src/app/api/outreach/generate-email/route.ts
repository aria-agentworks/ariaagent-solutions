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
    const productLink = product.gumroadUrl || product.url;

    const stepInstructions: Record<number, string> = {
      1: `This is a COLD EMAIL. SHORT and punchy (under 120 words). Open with something specific about their company/role. Middle: one insight about AI savings relevant to their industry. Close: include the Gumroad product link and tell them to grab it — it's only $${product.price}. The link: ${productLink}`,
      2: `This is a FOLLOW-UP. Add real value — share a stat, case study, or ROI number about AI in their industry. Keep it under 150 words. Close: remind them the playbook is at ${productLink} — instant download, $${product.price}.`,
      3: `This is the FINAL email. Be direct. "Hey, I noticed you haven't grabbed this yet." Reiterate the one biggest benefit. Include the product link: ${productLink}. Tell them it's instant download and they'll see ROI within 30 days. Under 100 words.`,
    };

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are writing cold outreach emails for ariaagent solutions. You sell low-cost AI strategy playbooks ($49-$79) to CFOs and VPs via Gumroad.

CRITICAL RULES:
- The product link MUST appear in EVERY email: ${productLink}
- These are impulse-buy priced products ($${product.price}) — no back-and-forth negotiation needed
- Direct CTA: "Grab it here: ${productLink}" or "Download now: ${productLink}"
- Never ask for a call or meeting — they buy directly from the link
- Keep emails SHORT — executives skim
- Personalize with their company name, industry, role
- No "I hope this finds you well" or filler
- Sound like a peer sharing something useful, not a salesperson

PRODUCT: ${product.name} — $${product.price}
PRODUCT LINK: ${productLink}
`,
        },
        {
          role: 'user',
          content: `Generate a personalized outreach email:

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
  "subject": "email subject line (under 60 chars, no exclamation marks)",
  "body": "email body with the product link ${productLink} included naturally",
  "html": "same body but formatted as simple HTML with <p> tags and the link as a <a href=\"${productLink}\">clickable link</a>"
}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1200,
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

    // Ensure the Gumroad link is in the body
    const linkRegex = new RegExp(productLink, 'g');
    if (!linkRegex.test(result.body || '')) {
      result.body = (result.body || '') + `\n\nGrab the playbook here: ${productLink}`;
    }
    if (!linkRegex.test(result.html || '')) {
      result.html = (result.html || '') + `<p style="margin-top:16px"><a href="${productLink}" style="color:#10b981;font-weight:bold">Grab the playbook here &rarr;</a></p>`;
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
