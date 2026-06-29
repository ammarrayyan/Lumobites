import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File | null;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
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
Identify: species, breed, approximate age, size/weight
Then recommend 3-5 specific pet food types that would be ideal for this pet.
Consider: age-appropriate nutrition, breed-specific needs, size-appropriate portions
Return recommendations in a clear, friendly format. Use markdown formatting with bullet points and clear sections.`
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

    return NextResponse.json({
      success: true,
      analysis: textContent
    });

  } catch (error: any) {
    console.error('Vision Food API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process image' }, { status: 500 });
  }
}
