import { NextRequest, NextResponse } from 'next/server';

// Minimal 1x1 white PNG in base64 — used for API connectivity test
const TEST_IMAGE =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';

/**
 * GET /api/ocr
 * Quick diagnostic endpoint — returns detailed info about the API key and
 * makes a real test call to Google Cloud Vision so you can debug without
 * needing a camera or base64 image.
 * 
 * Usage: visit http://localhost:3000/api/ocr in your browser
 */
export async function GET(_req: NextRequest) {
  const apiKey =
    process.env.GOOGLE_VISION_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      GOOGLE_VISION_API_KEY_present: !!process.env.GOOGLE_VISION_API_KEY,
      GOOGLE_VISION_API_KEY_prefix: process.env.GOOGLE_VISION_API_KEY
        ? process.env.GOOGLE_VISION_API_KEY.substring(0, 8) + '...'
        : 'NOT SET',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_present:
        !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_prefix:
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.substring(0, 8) + '...'
          : 'NOT SET',
      resolvedKey_prefix: apiKey ? apiKey.substring(0, 8) + '...' : 'NONE',
    },
    keyValidation: {
      isPresent: !!apiKey,
      looksLikeGoogleKey: apiKey ? apiKey.startsWith('AIza') : false,
      looksLikeJWT: apiKey ? apiKey.startsWith('eyJ') : false,
    },
  };

  if (!apiKey) {
    return NextResponse.json(
      {
        ...diagnostics,
        status: 'ERROR',
        error: 'No API key found. Add GOOGLE_VISION_API_KEY to your .env.local file.',
      },
      { status: 500 }
    );
  }

  if (apiKey.startsWith('eyJ')) {
    return NextResponse.json(
      {
        ...diagnostics,
        status: 'ERROR',
        error:
          'Key looks like a Supabase JWT, not a Google Cloud API key. Google API keys start with "AIza...".',
      },
      { status: 500 }
    );
  }

  // Make a real test call to Google Cloud Vision API
  let visionResponse: any = null;
  let visionStatus = 0;

  try {
    const res = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: TEST_IMAGE },
              features: [{ type: 'TEXT_DETECTION' }],
            },
          ],
        }),
      }
    );

    visionStatus = res.status;
    visionResponse = await res.json();

    if (!res.ok) {
      const errMsg = visionResponse?.error?.message || 'Unknown error';
      const errStatus = visionResponse?.error?.status || 'UNKNOWN';
      const errCode = visionResponse?.error?.code;

      let diagnosis = '';
      if (
        errMsg.includes('API_KEY_HTTP_REFERRER_BLOCKED') ||
        errStatus === 'API_KEY_HTTP_REFERRER_BLOCKED'
      ) {
        diagnosis =
          '🚨 HTTP Referrer Restriction is blocking server-side calls. In Google Cloud Console → Credentials → Edit your key → Application Restrictions → change from "HTTP referrers" to "None" (or IP addresses).';
      } else if (errStatus === 'PERMISSION_DENIED') {
        diagnosis =
          '🚨 Permission denied. Either the Cloud Vision API is not enabled in your project, OR the API key is restricted to other APIs. Go to: console.cloud.google.com → APIs & Services → Enable "Cloud Vision API".';
      } else if (errStatus === 'INVALID_ARGUMENT') {
        diagnosis = '🚨 Invalid request format. The test image or request body may be malformed.';
      } else if (errCode === 403) {
        diagnosis = '🚨 403 Forbidden — likely a referrer restriction or the Vision API is not enabled.';
      }

      return NextResponse.json(
        {
          ...diagnostics,
          status: 'VISION_API_ERROR',
          visionApiStatus: visionStatus,
          visionApiError: {
            message: errMsg,
            status: errStatus,
            code: errCode,
          },
          visionApiFullResponse: visionResponse,
          diagnosis,
        },
        { status: 500 }
      );
    }

    // SUCCESS
    const extractedText =
      visionResponse.responses?.[0]?.fullTextAnnotation?.text ||
      visionResponse.responses?.[0]?.textAnnotations?.[0]?.description ||
      '(no text in test image — but API call succeeded!)';

    return NextResponse.json({
      ...diagnostics,
      status: 'SUCCESS',
      message: '✅ Google Cloud Vision API is working correctly!',
      visionApiStatus: visionStatus,
      extractedText,
    });
  } catch (fetchError: any) {
    return NextResponse.json(
      {
        ...diagnostics,
        status: 'NETWORK_ERROR',
        error: fetchError.message,
        diagnosis: 'Could not reach Google Vision API. Check your network connection.',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ocr
 * Main OCR endpoint — sends a base64 image to Google Cloud Vision
 */
export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const apiKey =
      process.env.GOOGLE_VISION_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey.startsWith('eyJ')) {
      const msg = !apiKey
        ? 'GOOGLE_VISION_API_KEY is not set in environment variables'
        : 'GOOGLE_VISION_API_KEY appears to be a Supabase JWT, not a Google API key (should start with AIza...)';
      console.error('OCR ERROR:', msg);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    // Strip data URL header if present
    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

    console.log(
      `OCR: Calling Google Vision API... (payload: ${Math.round(base64Image.length / 1024)} KB)`
    );

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Image },
              features: [{ type: 'TEXT_DETECTION' }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      const errMsg = errorData?.error?.message || 'Unknown error';
      const errStatus = errorData?.error?.status || 'UNKNOWN';

      console.error(
        `Google Vision API Error [${response.status} ${errStatus}]: ${errMsg}`
      );
      console.error('Full error:', JSON.stringify(errorData, null, 2));

      if (
        errMsg.includes('API_KEY_HTTP_REFERRER_BLOCKED') ||
        errStatus === 'API_KEY_HTTP_REFERRER_BLOCKED'
      ) {
        return NextResponse.json(
          {
            error:
              'API key has HTTP referrer restrictions that block server-side calls. Remove HTTP referrer restrictions in Google Cloud Console.',
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: `Google Vision API Error (${errStatus}): ${errMsg}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.responses?.[0]) {
      console.error('OCR ERROR: Unexpected response structure:', data);
      return NextResponse.json(
        { error: 'Unexpected response from Google Vision API' },
        { status: 500 }
      );
    }

    const text =
      data.responses[0]?.fullTextAnnotation?.text ||
      data.responses[0]?.textAnnotations?.[0]?.description ||
      '';

    console.log(`OCR SUCCESS: Extracted ${text.length} characters`);

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('OCR Route Internal Error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
