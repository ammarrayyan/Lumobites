import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { ingredients } = await req.json();

    if (!ingredients || typeof ingredients !== 'string' || !ingredients.trim()) {
      return NextResponse.json({ error: 'Ingredients are required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Anthropic API key not configured properly.' }, { status: 500 });
    }

    const uniqueId = Math.random().toString(36).substring(7) + '-' + Date.now();
    console.log(`[Scan API] Fresh request initiated. ID: ${uniqueId}, Ingredients length: ${ingredients.length} chars`);

    // Call Anthropic Messages API directly
    const response = await fetch(`https://api.anthropic.com/v1/messages?requestId=${uniqueId}`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a pet food safety expert. Analyze these ingredients and identify any that are dangerous, concerning, or safe for cats and dogs. For each dangerous ingredient explain why. Respond in JSON only: {grade: A/B/C/D/F, dangerous: [{name, reason}], concerning: [{name, reason}], safe: [{name}], summary: one sentence overview}\n\nIngredients to analyze:\n${ingredients}`
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[Scan API] Claude API Error for ID ${uniqueId}:`, data);
      return NextResponse.json({ error: data.error?.message || 'Failed to analyze ingredients' }, { status: response.status });
    }

    const textContent = data.content?.find((c: any) => c.type === 'text')?.text || '';
    console.log(`[Scan API] Claude response completed successfully for ID ${uniqueId}. Output:`, textContent);
    
    // Parse the JSON safely
    const cleanText = textContent.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleanText);

    return NextResponse.json({
      success: true,
      grade: result.grade || 'C',
      dangerous: result.dangerous || [],
      concerning: result.concerning || [],
      safe: result.safe || [],
      summary: result.summary || 'Ingredients analyzed successfully.'
    });

  } catch (error: any) {
    console.error('Scan API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process ingredients' }, { status: 500 });
  }
}
