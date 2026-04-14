import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, company, domain, name } = body;

    if (!company) {
      return NextResponse.json({ success: false, error: 'Company name is required' }, { status: 400 });
    }

    // Generate email patterns based on name and domain
    const emails: string[] = [];
    const cleanDomain = domain || company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';

    if (name && name.includes(' ')) {
      const parts = name.split(' ');
      const firstName = parts[0].toLowerCase();
      const lastName = parts[parts.length - 1].toLowerCase();
      const firstInitial = firstName[0];

      // Common email patterns
      emails.push(`${firstName}.${lastName}@${cleanDomain}`);
      emails.push(`${firstInitial}${lastName}@${cleanDomain}`);
      emails.push(`${firstName}${lastName}@${cleanDomain}`);
      emails.push(`${firstName}@${cleanDomain}`);
      emails.push(`${firstInitial}.${lastName}@${cleanDomain}`);
      emails.push(`${lastName}.${firstName}@${cleanDomain}`);
      emails.push(`${firstName}_${lastName}@${cleanDomain}`);
      emails.push(`${firstInitial}_${lastName}@${cleanDomain}`);
    } else if (domain) {
      // Try common role-based emails
      const roles = ['info', 'contact', 'hello', 'sales', 'support', 'admin', 'office'];
      for (const role of roles) {
        emails.push(`${role}@${cleanDomain}`);
      }
    }

    // LinkedIn search URL
    const linkedinUrl = `https://www.linkedin.com/sales/search?keywords=${encodeURIComponent(company)}`;

    return NextResponse.json({
      success: true,
      leadId,
      emails: [...new Set(emails)],
      linkedinUrl,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
