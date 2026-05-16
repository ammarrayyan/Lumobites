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
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 });
    }

    // Convert file to base64 and get mime type
    const buffer = Buffer.from(await image.arrayBuffer());
    const base64Image = buffer.toString('base64');
    const mediaType = image.type || 'image/jpeg';

    const systemPrompt = "Respond in JSON format only: {\"petType\": \"cat\" | \"dog\" | \"none\", \"breed\": \"string\", \"confidence\": \"High\" | \"Medium\" | \"Low\", \"breedDescription\": \"one sentence about this breed\"}";
    const userPrompt = "Look at this photo and identify: 1) Is this a cat or dog? 2) What breed is it? If mixed breed say Mixed breed and list the likely breeds. 3) How confident are you?";

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType === 'image/jpg' ? 'image/jpeg' : mediaType,
                  data: base64Image
                }
              },
              {
                type: 'text',
                text: userPrompt
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API Error:', data);
      return NextResponse.json({ error: 'Failed to analyze image' }, { status: response.status });
    }

    const content = data.content?.[0]?.text || '{}';
    
    // Parse JSON
    let parsedInfo;
    try {
      // Extract JSON block if it's wrapped in markdown
      const jsonStr = content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1);
      parsedInfo = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse Claude JSON:', content);
      return NextResponse.json({ error: 'Invalid response from AI' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      breed: parsedInfo.breed,
      petType: parsedInfo.petType?.toLowerCase() || 'none', 
      confidence: parsedInfo.confidence,
      breedDescription: parsedInfo.breedDescription
    });

  } catch (error) {
    console.error('Vision API Error:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
