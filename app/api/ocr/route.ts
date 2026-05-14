import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // Call Google Cloud Vision API
    // The user mentioned this is already set up, so we expect GOOGLE_VISION_API_KEY to be in env
    const apiKey = process.env.GOOGLE_VISION_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey.includes('eyJhbGci')) {
      return NextResponse.json({ error: 'Google Vision API key not configured or invalid. Please ensure GOOGLE_VISION_API_KEY is set in your environment.' }, { status: 500 });
    }

    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Image,
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Vision API Error:', errorData);
      return NextResponse.json({ error: 'Failed to process image via Google Vision' }, { status: response.status });
    }

    const data = await response.json();
    const text = data.responses[0]?.fullTextAnnotation?.text || data.responses[0]?.textAnnotations?.[0]?.description || '';

    return NextResponse.json({ text });
  } catch (error) {
    console.error('OCR API Route Error:', error);
    return NextResponse.json({ error: 'Internal server error during OCR processing' }, { status: 500 });
  }
}
