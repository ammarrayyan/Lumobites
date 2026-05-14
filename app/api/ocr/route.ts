import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // Call Google Cloud Vision API
    const apiKey = process.env.GOOGLE_VISION_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    // Log API key presence (don't log the full key for security)
    if (!apiKey) {
      console.error('OCR ERROR: No API Key found in environment variables');
    } else if (apiKey.includes('eyJhbGci')) {
      console.error('OCR ERROR: API Key looks like a JWT (Supabase key?), not a Google Cloud API Key');
    }

    if (!apiKey || apiKey.includes('eyJhbGci')) {
      return NextResponse.json({ 
        error: 'Google Vision API key not configured correctly. Please ensure GOOGLE_VISION_API_KEY is set in your environment (it should start with AIza...).' 
      }, { status: 500 });
    }

    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

    console.log(`OCR: Sending request to Google Vision API... (Image size: ${Math.round(base64Image.length / 1024)} KB)`);

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
      console.error('Google Vision API Detailed Error:', JSON.stringify(errorData, null, 2));
      
      const errorMessage = errorData.error?.message || 'Failed to process image via Google Vision';
      return NextResponse.json({ 
        error: `Google Vision API Error: ${errorMessage}`,
        details: errorData
      }, { status: response.status });
    }

    const data = await response.json();
    
    if (!data.responses || !data.responses[0]) {
      console.error('OCR ERROR: Unexpected response format from Google Vision', data);
      return NextResponse.json({ error: 'Invalid response from Google Vision API' }, { status: 500 });
    }

    const text = data.responses[0]?.fullTextAnnotation?.text || data.responses[0]?.textAnnotations?.[0]?.description || '';

    console.log(`OCR SUCCESS: Extracted ${text.length} characters`);
    
    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('OCR API Internal Route Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during OCR processing',
      details: error.message 
    }, { status: 500 });
  }
}
