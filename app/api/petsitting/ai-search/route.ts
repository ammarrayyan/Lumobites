import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { formatPublicCity } from '@/lib/formatCity';
import { checkAndTrackAiUsage } from '@/lib/aiLimiter';
import { getVerifiedSessionEmail } from '@/lib/accountAuth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Anthropic API key not configured.' }, { status: 500 });
    }

    const body = await request.json();
    const { query: searchQuery, email: ownerEmail, sitterIds } = body;

    const verifiedEmail = await getVerifiedSessionEmail(request);
    const limitCheck = await checkAndTrackAiUsage({
      feature: 'sitter_search',
      userEmail: ownerEmail,
      verifiedEmail,
      request,
    });

    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.reason, isPro: limitCheck.isPro }, { status: 429 });
    }

    if (!searchQuery || !searchQuery.trim()) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    // 1. Fetch all active approved sitters from database
    const { data: sitters, error: dbError } = await supabaseAdmin
      .from('sitters')
      .select('id, name, photo_url, cover_photo_url, cover_photo_position, city, zip, country, lat, lng, bio, pet_types, rate_per_night, rate_type, rate_dropins, rate_walking, rate_overnight, rate_boarding, rate_daycare, phone_number, phone_visible, approval_status, avg_rating, review_count, available_days, available_times, service_types, completed_bookings')
      .eq('approval_status', 'approved')
      .eq('availability', true);

    if (dbError) throw dbError;

    if (!sitters || sitters.length === 0) {
      return NextResponse.json({ sitters: [] });
    }

    // Filter to selected area sitters if specified
    let candidateSitters = sitters;
    if (sitterIds && Array.isArray(sitterIds)) {
      candidateSitters = sitters.filter(s => sitterIds.includes(s.id));
    }

    if (candidateSitters.length === 0) {
      return NextResponse.json({ sitters: [] });
    }

    const sitterDataForClaude = candidateSitters.map(s => ({
      id: s.id,
      name: s.name,
      bio: s.bio,
      pet_types: s.pet_types,
      rating: s.avg_rating,
      price: s.rate_per_night,
      location: formatPublicCity(s.city),
      services: s.service_types
    }));

    console.log('[AI Sitter Search] Sitter data sent to Claude:', JSON.stringify(sitterDataForClaude, null, 2));

    // 2. Query Claude AI to rank and score the sitters
    const prompt = `You are a pet sitter matching assistant.

User is looking for: "${searchQuery}"

Available sitters:
${JSON.stringify(sitterDataForClaude)}

Evaluate all sitters based on how well they match the user's description. Read their bio carefully to extract gender details, background qualifications, vet experience, preferences, etc.
Rank them from best to worst match.
Return ONLY a valid JSON array of sitter IDs ranked by best match, with a match score (0-100) and a short one-sentence reason explaining why they match the query:
[{"id": "sitter_id", "score": 95, "reason": "Female sitter with 5 years vet experience"}]

Do not include any intro, outro, markdown block, or conversational text. Return ONLY the raw JSON array.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI Sitter Search] Anthropic API Error:', errorText);
      throw new Error(`Anthropic API returned status ${response.status}`);
    }

    const apiData = await response.json();
    let text = apiData.content[0].text.trim();

    // Clean JSON markdown tags if present
    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      text = text.substring(jsonStart, jsonEnd + 1);
    }

    const rankings = JSON.parse(text);

    // 3. Match rankings back to original sitters
    const rankedSitters = rankings
      .map((r: any) => {
        const sitter = sitters.find(s => s.id === r.id);
        if (!sitter) return null;
        return {
          ...sitter,
          matchScore: r.score,
          matchReason: r.reason
        };
      })
      .filter(Boolean);

    // 4. Return full sitter profile for signed-in users, prompt sign-in for visitors
    const cleanOwnerEmail = ownerEmail ? ownerEmail.toLowerCase().trim() : '';
    const isSignedIn = !!cleanOwnerEmail;

    const maskedSitters = rankedSitters.map((sitter: any) => {
      if (isSignedIn) {
        return {
          ...sitter,
          phone_number: sitter.phone_visible ? sitter.phone_number : null
        };
      }
      
      return {
        ...sitter,
        name: 'Local Sitter',
        photo_url: '',
        bio: "Sign in to view full profile, photos, and contact information.",
        phone_number: sitter.phone_visible && sitter.phone_number ? '(***) ***-****' : null
      };
    });

    return NextResponse.json({ sitters: maskedSitters, isSignedIn });
  } catch (error: any) {
    console.error('[AI Sitter Search API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
