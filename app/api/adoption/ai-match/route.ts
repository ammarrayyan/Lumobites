import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkAndTrackAiUsage } from '@/lib/aiLimiter';
import { getVerifiedSessionEmail } from '@/lib/accountAuth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, species, email } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Please describe what type of pet you are looking for.' }, { status: 400 });
    }

    const verifiedEmail = await getVerifiedSessionEmail(request);
    const limitCheck = await checkAndTrackAiUsage({
      feature: 'adoption_matcher',
      userEmail: email,
      verifiedEmail,
      request,
    });

    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.reason, isPro: limitCheck.isPro }, { status: 429 });
    }

    // Fetch Lumo Bites shelter listings
    const { data: localPets } = await supabaseAdmin
      .from('adoption_pets')
      .select('*, shelters(org_name, phone, email, website, city)')
      .eq('status', 'available');

    const formattedLocalPets = (localPets || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      species: p.species,
      breed: p.breed,
      age: p.age,
      size: p.size,
      sex: p.sex,
      temperament: p.temperament,
      description: p.description,
      photo: p.photo_urls?.[0] || '/placeholder-pet.png',
      source: 'lumo_bites',
      shelter_name: p.shelters?.org_name || 'Local Rescue',
      city: p.city || p.shelters?.city || ''
    }));

    const candidatesForPrompt = formattedLocalPets.map((c: any, i: number) => ({
      index: i,
      id: c.id,
      name: c.name,
      species: c.species,
      breed: c.breed,
      age: c.age,
      size: c.size,
      sex: c.sex,
      city: c.city || 'Location unspecified',
      shelter_name: c.shelter_name,
      temperament: c.temperament,
      description: c.description ? c.description.slice(0, 150) : ''
    }));

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Fallback ranking if Anthropic key is missing
      const queryLower = prompt.toLowerCase();
      const scored = formattedLocalPets.map((c: any) => {
        let score = 50;
        const text = `${c.name} ${c.breed} ${c.species} ${c.age} ${c.size} ${c.temperament} ${c.description} ${c.city} ${c.shelter_name}`.toLowerCase();
        if (queryLower.includes('dog') && c.species.toLowerCase() === 'dog') score += 20;
        if (queryLower.includes('cat') && c.species.toLowerCase() === 'cat') score += 20;
        if (queryLower.includes('small') && c.size.toLowerCase() === 'small') score += 15;
        if (queryLower.includes('low energy') && text.includes('calm')) score += 15;

        // Check if query contains city/location matching pet's city
        if (c.city) {
          const cityLower = c.city.toLowerCase();
          const cityWords = cityLower.split(/[\s,]+/);
          const hasCityMatch = cityWords.some(w => w.length > 2 && queryLower.includes(w));
          if (hasCityMatch) {
            score += 25;
          }
        }

        let reason = `Matches your search for ${c.species} (${c.breed}, ${c.size})`;
        if (c.city) {
          reason += ` in ${c.city}`;
        }
        return {
          pet: c,
          score: Math.min(score, 99),
          reason
        };
      }).sort((a, b) => b.score - a.score);

      return NextResponse.json({ matches: scored.slice(0, 6) });
    }

    // Call Anthropic API to rank candidate pets
    const res = await fetch('https://api.anthropic.com/v1/messages', {
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
          content: `You are an AI Pet Adoption Matcher. Match user lifestyle and search query against candidate pets.
User query: "${prompt}"

Candidate Pets:
${JSON.stringify(candidatesForPrompt, null, 2)}

MATCHING & SCORING RULES:
1. Pay strict attention to species, breed, color, age, size, temperament, and LOCATION/CITY mentioned in the query.
2. LOCATION/CITY EVALUATION:
   - If the user query specifies a city or location (e.g. "in Lexington", "near Austin", "Lexington KY"):
     - Pets located IN or NEAR the requested city should be heavily prioritized with higher match scores (85-100).
     - If a candidate pet matches the pet attributes (e.g. species/color) BUT is located in a DIFFERENT city/location, lower its match score (e.g. 50-70) and explicitly note in the "reason" field that the pet is NOT in the requested city (e.g. "Great match for an orange cat, but located in Austin, TX instead of Lexington").
     - If no pets exist in or near the requested city, explicitly state in the reason field that no direct matches were found in that city and list the closest matching pet with its actual location noted.
3. Return a JSON array of up to 6 matches ordered by highest relevance score (0-100).

JSON Format MUST be:
{
  "matches": [
    { "index": 0, "score": 95, "reason": "Orange cat matching your criteria, located in Lexington, KY." }
  ]
}`
        }]
      })
    });

    if (!res.ok) {
      console.error('[AI Lifestyle Matcher] Anthropic error:', res.statusText);
      return NextResponse.json({ matches: formattedLocalPets.slice(0, 6).map((c: any) => ({ pet: c, score: 85, reason: 'Great match for your lifestyle preferences' })) });
    }

    const data = await res.json();
    const responseText = data.content?.[0]?.text || '';
    const cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(cleanJsonStr);
      const rankedMatches = (parsed.matches || []).map((m: any) => ({
        pet: formattedLocalPets[m.index] || formattedLocalPets[0],
        score: m.score,
        reason: m.reason
      })).filter((m: any) => m.pet);

      return NextResponse.json({ matches: rankedMatches });
    } catch {
      return NextResponse.json({ matches: formattedLocalPets.slice(0, 6).map((c: any) => ({ pet: c, score: 80, reason: 'Matches your pet criteria' })) });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
