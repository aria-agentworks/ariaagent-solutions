import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, company, domain, name } = body;

    if (!company) {
      return NextResponse.json({ success: false, error: 'Company name is required' }, { status: 400 });
    }

    const results: {
      contacts: Array<{ name: string; title: string; confidence: string; source: string }>;
      emails: string[];
      linkedinUrl: string;
      companyWebsite: string;
      note: string;
    } = {
      contacts: [],
      emails: [],
      linkedinUrl: '',
      companyWebsite: domain || '',
      note: '',
    };

    const cleanDomain = domain || company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
    results.companyWebsite = cleanDomain;

    // --- STEP 1: If no name provided, use web search to find real decision-makers ---
    if (!name || !name.trim()) {
      try {
        const zai = await ZAI.create();
        const searchQueries = [
          `${company} CEO founder executive leadership`,
          `${company} CFO CTO VP director contact`,
          `"${company}" site:linkedin.com`,
        ];

        const allSearchResults: Array<{ name: string; snippet: string; url: string }> = [];

        for (const query of searchQueries) {
          try {
            const searchResult = await zai.functions.invoke('web_search', {
              query,
              num: 8,
            });
            if (Array.isArray(searchResult) && searchResult.length > 0) {
              for (const item of searchResult) {
                allSearchResults.push({
                  name: item.name || '',
                  snippet: item.snippet || '',
                  url: item.url || '',
                });
              }
            }
          } catch {
            // continue with next query
          }
        }

        // Extract contact names from search results using AI
        if (allSearchResults.length > 0) {
          const contactExtractionPrompt = `You are a B2B lead research assistant. Extract REAL people's names, titles, and roles from these search results about the company "${company}".

IMPORTANT RULES:
- Only extract real people's names (not job posting titles, not "we are hiring")
- Focus on executives, decision-makers: CEO, CFO, CTO, VP, Director, Founder, Co-founder, Owner, Managing Director, Head of...
- Each person must have a REAL full name (first + last)
- Include their title/role if mentioned
- Assign confidence: "high" if found on LinkedIn/company site, "medium" if from a news article/directory, "low" if uncertain
- Return max 5 contacts
- Sort by confidence (high first)

Search Results:
${allSearchResults.slice(0, 20).map((r, i) => `${i + 1}. Title: "${r.name}" | Snippet: "${r.snippet}" | URL: ${r.url}`).join('\n')}

Respond in this JSON format ONLY (no markdown, no code blocks):
{"contacts":[{"name":"Full Name","title":"Job Title","confidence":"high|medium|low","source":"url where found"}]}`;

          const extraction = await zai.chat.completions.create({
            messages: [
              { role: 'system', content: 'You extract contact information from search results. Return ONLY valid JSON, no markdown.' },
              { role: 'user', content: contactExtractionPrompt },
            ],
            temperature: 0.1,
          });

          const raw = extraction.choices?.[0]?.message?.content || '';
          // Clean up response - remove markdown code blocks if present
          const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(cleaned);

          if (parsed.contacts && Array.isArray(parsed.contacts)) {
            results.contacts = parsed.contacts.filter(
              (c: { name: string }) => c.name && c.name.includes(' ') && c.name.length > 3 && !c.name.toLowerCase().includes('hiring') && !c.name.toLowerCase().includes('job')
            );
          }
        }

        if (results.contacts.length === 0) {
          results.note = `Could not find specific contacts for "${company}". Try searching on LinkedIn directly, or enter a contact name manually.`;
        } else {
          results.note = `Found ${results.contacts.length} potential contact(s) for "${company}". Click "Apply" on a contact to set their name, then enrich again for email patterns.`;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Search failed';
        results.note = `Web search error: ${msg}. You can still enter a contact name manually.`;
      }
    } else {
      // --- STEP 2: Name IS provided — generate email patterns + also search for verification ---
      const parts = name.trim().split(/\s+/);
      const firstName = parts[0].toLowerCase();
      const lastName = parts[parts.length - 1].toLowerCase();
      const firstInitial = firstName[0];

      // Common email patterns ordered by likelihood
      const patterns = [
        `${firstName}.${lastName}@${cleanDomain}`,
        `${firstInitial}${lastName}@${cleanDomain}`,
        `${firstName}${lastName}@${cleanDomain}`,
        `${firstInitial}.${lastName}@${cleanDomain}`,
        `${firstName}@${cleanDomain}`,
        `${lastName}.${firstName}@${cleanDomain}`,
        `${firstName}_${lastName}@${cleanDomain}`,
        `${firstInitial}_${lastName}@${cleanDomain}`,
      ];
      results.emails = [...new Set(patterns)];

      // Also try to verify/find the real email via web search
      try {
        const zai = await ZAI.create();
        const searchResult = await zai.functions.invoke('web_search', {
          query: `"${name}" "${company}" email contact`,
          num: 5,
        });
        if (Array.isArray(searchResult) && searchResult.length > 0) {
          for (const item of searchResult) {
            // Try to extract email from snippets
            const emailMatch = (item.snippet || '').match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            if (emailMatch) {
              const foundEmail = emailMatch[0].toLowerCase();
              if (!results.emails.includes(foundEmail)) {
                results.emails.unshift(foundEmail); // Add verified email first
              }
            }
          }
        }
      } catch {
        // Email verification search failed, pattern emails still available
      }

      results.note = `Generated ${results.emails.length} email pattern(s) for "${name}" at ${cleanDomain}. Click "Apply" to use an email.`;
    }

    // --- LinkedIn search URL ---
    const linkedinSearchQuery = name ? `${name} ${company}` : `${company} CEO OR CFO OR CTO OR founder OR director`;
    results.linkedinUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(linkedinSearchQuery)}`;

    return NextResponse.json({
      success: true,
      leadId,
      ...results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
