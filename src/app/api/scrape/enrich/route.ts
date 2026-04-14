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

    if (name && name.trim().includes(' ')) {
      const parts = name.trim().split(/\s+/);
      const firstName = parts[0].toLowerCase();
      const lastName = parts[parts.length - 1].toLowerCase();
      const firstInitial = firstName[0];

      // Common email patterns — ordered by likelihood
      const patterns = [
        `${firstName}.${lastName}`,       // john.smith@domain.com
        `${firstInitial}${lastName}`,      // jsmith@domain.com
        `${firstName}${lastName}`,          // johnsmith@domain.com
        `${firstInitial}.${lastName}`,      // j.smith@domain.com
        `${firstName}@`,                    // john@domain.com
        `${lastName}.${firstName}`,          // smith.john@domain.com
        `${firstName}_${lastName}`,          // john_smith@domain.com
        `${firstInitial}_${lastName}`,       // j_smith@domain.com
      ];

      for (const p of patterns) {
        emails.push(`${p}${cleanDomain}`);
      }
    } else if (name && !name.includes(' ')) {
      // Single name — just try first letter patterns
      const firstName = name.toLowerCase();
      emails.push(`${firstName}@${cleanDomain}`);
      emails.push(`${firstName[0]}@${cleanDomain}`);
    } else {
      // No name — provide generic role emails as fallback
      const roles = ['info', 'contact', 'hello', 'sales', 'support', 'admin', 'office'];
      for (const role of roles) {
        emails.push(`${role}@${cleanDomain}`);
      }
    }

    // LinkedIn search URL — use regular search (not Sales Navigator which needs paid account)
    const linkedinSearchQuery = name ? `${name} ${company}` : company;
    const linkedinUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(linkedinSearchQuery)}`;

    return NextResponse.json({
      success: true,
      leadId,
      emails: [...new Set(emails)],
      linkedinUrl,
      note: name ? `Generated ${emails.length} email patterns for "${name}"` : 'No contact name provided — showing generic role emails. Add a name for better results.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
