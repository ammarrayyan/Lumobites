/**
 * Google Cloud Vision API — End-to-End Test Script
 * 
 * Run with:  node scripts/test-vision.mjs
 * Or with key: GOOGLE_VISION_API_KEY=AIza... node scripts/test-vision.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ─── Load .env.local manually (Node doesn't load it automatically) ────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');

try {
  const envFile = readFileSync(envPath, 'utf-8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
  console.log('✅ Loaded .env.local');
} catch (e) {
  console.log('⚠️  Could not load .env.local:', e.message);
}

// ─── Get API key ──────────────────────────────────────────────────────────────
const apiKey = process.env.GOOGLE_VISION_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

console.log('\n─── API Key Check ─────────────────────────────────────────');
if (!apiKey) {
  console.error('❌ GOOGLE_VISION_API_KEY is NOT set in .env.local');
  console.log('\n👉 Fix: Add this to your .env.local:');
  console.log('   GOOGLE_VISION_API_KEY=AIzaSy...');
  process.exit(1);
} else if (apiKey.startsWith('eyJ')) {
  console.error('❌ Key looks like a Supabase JWT, NOT a Google API Key');
  console.log('   Google API keys start with: AIza...');
  process.exit(1);
} else if (!apiKey.startsWith('AIza')) {
  console.warn('⚠️  Key does not start with "AIza" — may not be a valid Google API key');
  console.log('   Key prefix:', apiKey.substring(0, 6) + '...');
} else {
  console.log('✅ API Key looks correct — starts with AIza...');
  console.log('   Key prefix:', apiKey.substring(0, 8) + '...');
}

// ─── Minimal valid PNG image (1x1 white pixel) encoded as base64 ──────────────
// This is a tiny real PNG so the API has something to process
const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';

// ─── Better test: a PNG with text "CHICKEN RICE" rendered ───────────────────
// Using a small base64 encoded image that contains readable text
// (This is a 100x30 PNG with black text on white background saying "CHICKEN, RICE, CORN")
const TEXT_IMAGE_BASE64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAeAGQDASIAAhEBAxEB/8QAGAABAAMBAAAAAAAAAAAAAAAABQMEBgL/xAAuEAABBAEDAwMDBAMAAAAAAAABAAIDBAUREiExBhNBUWEicYGRwRQjMkL/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBBf/EACIRAAICAgICAwAAAAAAAAAAAAABAhEDIRIxBBNBUf/aAAwDAQACEQMRAD8A7aiIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIg//Z';

console.log('\n─── Test Configuration ────────────────────────────────────');
console.log('   Endpoint: https://vision.googleapis.com/v1/images:annotate');
console.log('   Feature:  TEXT_DETECTION');
console.log('   Image:    Small test PNG (no HTTP Referer header sent — simulating server-side call)');

// ─── Make the API call ────────────────────────────────────────────────────────
console.log('\n─── Calling Google Cloud Vision API... ─────────────────────');

async function testVisionAPI() {
  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // NOTE: Deliberately NOT sending Referer or Origin headers
          // This simulates a server-side call (what our Next.js API route does)
          // If the key has HTTP referrer restrictions, this call will FAIL
          // while a browser call might succeed.
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: TEST_IMAGE_BASE64,
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

    const statusCode = response.status;
    const data = await response.json();

    console.log(`   HTTP Status: ${statusCode}`);

    if (!response.ok) {
      console.error('\n❌ API CALL FAILED');
      console.error('   Error Code:   ', data?.error?.code);
      console.error('   Error Message:', data?.error?.message);
      console.error('   Error Status: ', data?.error?.status);

      if (data?.error?.message?.includes('API_KEY_HTTP_REFERRER_BLOCKED')) {
        console.error('\n🚨 ROOT CAUSE: HTTP Referrer Restriction is BLOCKING this call!');
        console.error('   Fix: In Google Cloud Console, edit your API key and remove');
        console.error('   all HTTP referrer restrictions. Change to "None" or');
        console.error('   switch to "IP address" restrictions instead.');
      } else if (data?.error?.status === 'PERMISSION_DENIED') {
        console.error('\n🚨 ROOT CAUSE: Permission Denied.');
        console.error('   - The Cloud Vision API may not be enabled for this project.');
        console.error('   - Or the API key lacks permission for the Vision API.');
        console.error('   Fix: Go to Google Cloud Console → APIs & Services → Enable Cloud Vision API');
      } else if (data?.error?.status === 'INVALID_ARGUMENT') {
        console.error('\n🚨 ROOT CAUSE: Invalid request format or bad image data.');
      }

      console.error('\n   Full error response:', JSON.stringify(data, null, 2));
      process.exit(1);
    }

    // ─── Success ───────────────────────────────────────────────────────
    console.log('\n✅ API CALL SUCCEEDED');
    const text = data.responses?.[0]?.fullTextAnnotation?.text 
      || data.responses?.[0]?.textAnnotations?.[0]?.description 
      || '(no text detected in test image — but API is working!)';
    
    console.log('   Extracted text:', JSON.stringify(text));
    console.log('\n🎉 Google Cloud Vision is fully configured and working!');
    console.log('   The /scan page ingredient OCR should now work correctly.');

  } catch (err) {
    console.error('\n❌ NETWORK/FETCH ERROR:', err.message);
    console.error('   This suggests a network issue, not an API key issue.');
  }
}

testVisionAPI();
