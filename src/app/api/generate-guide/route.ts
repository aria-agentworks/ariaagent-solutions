import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { threadContext, productTitle, targetAudience, price } = body;

    if (!threadContext || !productTitle) {
      return NextResponse.json(
        { error: 'threadContext and productTitle are required' },
        { status: 400 }
      );
    }

    // Try to use Claude via z-ai-web-dev-sdk
    let guideSections;

    try {
      // Dynamic import to avoid issues if SDK isn't available
      const { createLLMStream } = await import('z-ai-web-dev-sdk');

      const systemPrompt = `You are an expert digital product creator. Given a Reddit panic thread and product details, create a structured guide outline.
      
The guide should:
- Directly address the panic/problem described in the thread
- Include actionable step-by-step instructions
- Reference the expert advice found in the thread comments
- Be structured for someone who is panicking (clear, reassuring, actionable)
- Be worth the asking price (typically $37)

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "sections": [
    {
      "title": "Section Title",
      "content": "2-3 paragraph description of what this section covers",
      "tips": ["Tip 1", "Tip 2", "Tip 3"]
    }
  ]
}`;

      const userPrompt = `Create a guide outline for this product:

Product Title: ${productTitle}
Target Audience: ${targetAudience || 'People experiencing this specific problem'}
Price: $${price || 37}

Source Thread Context:
${threadContext}

Generate 6-8 comprehensive sections with actionable tips.`;

      const stream = await createLLMStream({
        model: 'claude-sonnet-4-20250514',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 4000,
        temperature: 0.7,
      });

      // Read the full response from the stream
      let fullResponse = '';
      for await (const chunk of stream) {
        if (chunk?.content) {
          fullResponse += chunk.content;
        }
      }

      // Parse the JSON response
      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        guideSections = parsed.sections;
      } else {
        throw new Error('Could not parse AI response');
      }
    } catch {
      // Fallback to simulated guide data
      guideSections = getFallbackGuide(productTitle, targetAudience);
    }

    const guide = {
      id: `g${Date.now().toString(36)}`,
      title: productTitle,
      targetAudience: targetAudience || 'General',
      sections: guideSections,
      wordCount: guideSections.reduce((acc: number, s: { content: string }) => acc + s.content.split(' ').length, 0),
      status: 'ready',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(guide);
  } catch (error) {
    console.error('Guide generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate guide' },
      { status: 500 }
    );
  }
}

function getFallbackGuide(title: string, audience: string) {
  return [
    {
      title: 'Understanding Your Situation',
      content: `This section helps ${audience || 'you'} understand the scope and severity of the problem. We break down exactly what's happening, what the worst-case scenarios are, and why you shouldn't panic even though it feels overwhelming right now.`,
      tips: [
        'Read the entire section before taking any action',
        'Write down your specific situation details',
        'Remember: most problems have established solutions',
      ],
    },
    {
      title: 'Immediate Actions (First 24 Hours)',
      content: 'The critical first steps you need to take right now to protect yourself. These actions are time-sensitive and will form the foundation of your resolution strategy.',
      tips: [
        'Document everything with screenshots and dates',
        'Do NOT sign anything without reading it twice',
        'Contact the relevant authority/organization immediately',
      ],
    },
    {
      title: 'Understanding Your Rights',
      content: 'A comprehensive breakdown of the legal rights and protections available to you. Many people in panic situations don\'t realize they have significant protections under the law.',
      tips: [
        'You have more rights than you think',
        'Most institutions count on you not knowing your rights',
        'Keep records of all communications',
      ],
    },
    {
      title: 'Step-by-Step Resolution Plan',
      content: 'A detailed, actionable plan to resolve this situation. Each step includes timelines, required documents, and expected outcomes.',
      tips: [
        'Complete steps in order — don\'t skip ahead',
        'Set calendar reminders for deadlines',
        'Keep copies of everything you submit',
      ],
    },
    {
      title: 'Communication Templates',
      content: 'Ready-to-use templates for all communications you\'ll need. These have been tested and refined based on what actually works in practice.',
      tips: [
        'Customize each template with your specific details',
        'Send via certified mail or email with read receipt',
        'Keep the tone professional and factual',
      ],
    },
    {
      title: 'If Things Go Wrong: Appeals & Escalation',
      content: 'What to do if your initial attempts don\'t succeed. Escalation paths, appeal processes, and alternative strategies.',
      tips: [
        'Don\'t give up after the first attempt',
        'Most denials can be appealed',
        'Consider getting professional help if stakes are high',
      ],
    },
    {
      title: 'Prevention: Making Sure This Never Happens Again',
      content: 'Long-term strategies and systems to put in place so you never find yourself in this situation again. Prevention is always cheaper than cure.',
      tips: [
        'Set up automatic alerts and reminders',
        'Build an emergency fund for unexpected situations',
        'Stay informed about changes that could affect you',
      ],
    },
    {
      title: 'Additional Resources & Support',
      content: 'A curated list of resources, organizations, professionals, and communities that can help. Includes both free and paid options.',
      tips: [
        'Start with free resources before paying for help',
        'Online communities often have the most practical advice',
        'Many professionals offer free initial consultations',
      ],
    },
  ];
}
