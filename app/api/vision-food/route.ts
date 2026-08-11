import { NextRequest, NextResponse } from 'next/server';
import { checkAndTrackAiUsage } from '@/lib/aiLimiter';
import { getVerifiedSessionEmail } from '@/lib/accountAuth';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File | null;
    const userEmail = (formData.get('email') as string | null) || (formData.get('userEmail') as string | null);
    const verifiedEmail = await getVerifiedSessionEmail(req);

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const limitCheck = await checkAndTrackAiUsage({
      feature: 'vision_scanner',
      userEmail,
      verifiedEmail,
      request: req,
    });

    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.reason, isPro: limitCheck.isPro }, { status: 429 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Anthropic API key not configured properly.' }, { status: 500 });
    }

    // Convert file to base64
    const buffer = Buffer.from(await image.arrayBuffer());
    const base64Image = buffer.toString('base64');
    const mediaType = image.type || 'image/jpeg';

    // Call Anthropic Messages API directly
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Image
                }
              },
              {
                type: 'text',
                text: `Analyze this pet photo and suggest the best pet food options.
Identify: species, breed, approximate age, size/weight.
Then recommend 3-5 specific pet food types that would be ideal for this pet.
Consider: age-appropriate nutrition, breed-specific needs, size-appropriate portions.

Return the response in JSON format only. Do not include any other text or markdown wrapper outside the JSON itself.
The JSON must have the following keys:
1. "analysis": A clear, friendly description of your findings, using markdown for list items and headers.
2. "recommendations": An array of 3-4 specific pet food product names or search queries that would be ideal to search on Amazon (e.g. ["Royal Canin Kitten Food", "Hill's Science Diet Sensitive Stomach Dog Food"]).

JSON structure example:
{
  "analysis": "Markdown text here",
  "recommendations": ["Query 1", "Query 2", "Query 3"]
}`
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Claude API Error:', data);
      return NextResponse.json({ error: data.error?.message || 'Failed to analyze image' }, { status: response.status });
    }

    const textContent = data.content?.find((c: any) => c.type === 'text')?.text || '';
    const cleanText = textContent.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleanText);

    return NextResponse.json({
      success: true,
      analysis: result.analysis || '',
      recommendations: result.recommendations || []
    });

  } catch (error: any) {
    console.error('Vision Food API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process image' }, { status: 500 });
  }
}
