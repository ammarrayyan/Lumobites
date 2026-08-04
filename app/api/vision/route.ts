import { NextResponse } from 'next/server';
import { checkAndTrackAiUsage } from '@/lib/aiLimiter';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File | null;
    const userEmail = (formData.get('email') as string | null) || (formData.get('userEmail') as string | null);

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const limitCheck = await checkAndTrackAiUsage({
      feature: 'vision_scanner',
      userEmail,
      request: req,
    });

    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.reason }, { status: 429 });
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
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
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
                text: 'Look at this photo. 1) Is this a cat, dog, or human/something else? 2) What specific breed of pet is it? If a human is detected instead of a pet, set petType to "none" and breed to "N/A - This is a human". 3) Confidence level: High, Medium, or Low. Respond in JSON only: {petType: "cat" | "dog" | "none", breed: string, confidence: "High" | "Medium" | "Low", breedDescription: string}'
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
    
    // Parse the JSON safely
    const cleanText = textContent.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleanText);

    return NextResponse.json({
      success: true,
      breed: result.breed,
      petType: result.petType,
      confidence: result.confidence,
      breedDescription: result.breedDescription || ''
    });

  } catch (error: any) {
    console.error('Vision API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process image' }, { status: 500 });
  }
}
