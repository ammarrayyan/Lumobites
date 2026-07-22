import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { prompt, species, petfinderPets } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Please describe what type of pet you are looking for.' }, { status: 400 });
    }

    // Fetch Lumo Bites shelter listings
    const { data: localPets } = await supabaseAdmin
      .from('adoption_pets')
      .select('*, shelters(org_name, phone, email, website)')
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
      shelter_name: p.shelters?.org_name || 'Local Rescue'
    }));

    const formattedPetfinder = (petfinderPets || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      species: p.species,
      breed: p.breed,
      age: p.age,
      size: p.size,
      sex: p.sex,
      temperament: p.description,
      description: p.description,
      photo: p.photo,
      url: p.url,
      source: 'petfinder',
      shelter_name: p.shelter_name
    }));

    const allCandidates = [...formattedLocalPets, ...formattedPetfinder];

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Fallback ranking if Anthropic key is missing
      const queryLower = prompt.toLowerCase();
      const scored = allCandidates.map(c => {
        let score = 50;
        const text = `${c.name} ${c.breed} ${c.species} ${c.age} ${c.size} ${c.temperament} ${c.description}`.toLowerCase();
        if (queryLower.includes('dog') && c.species.toLowerCase() === 'dog') score += 20;
        if (queryLower.includes('cat') && c.species.toLowerCase() === 'cat') score += 20;
        if (queryLower.includes('small') && c.size.toLowerCase() === 'small') score += 15;
        if (queryLower.includes('low energy') && text.includes('calm')) score += 15;
        return {
          pet: c,
          score,
          reason: `Matches your search for ${c.species} (${c.breed}, ${c.size})`
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
          content: `You are an AI Pet Adoption Matcher. Match user lifestyle query against candidate pets.
User query: "${prompt}"

Candidate Pets:
${JSON.stringify(allCandidates.map((c, i) => ({ index: i, id: c.id, name: c.name, species: c.species, breed: c.breed, age: c.age, size: c.size, temperament: c.temperament })), null, 2)}

Return a JSON array of up to 6 matches ordered by highest relevance score (0-100).
JSON Format MUST be:
{
  "matches": [
    { "index": 0, "score": 95, "reason": "Small, calm dog ideal for apartments and great with children." }
  ]
}`
        }]
      })
    });

    if (!res.ok) {
      console.error('[AI Lifestyle Matcher] Anthropic error:', res.statusText);
      return NextResponse.json({ matches: allCandidates.slice(0, 6).map(c => ({ pet: c, score: 85, reason: 'Great match for your lifestyle preferences' })) });
    }

    const data = await res.json();
    const responseText = data.content?.[0]?.text || '';
    const cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(cleanJsonStr);
      const rankedMatches = (parsed.matches || []).map((m: any) => ({
        pet: allCandidates[m.index] || allCandidates[0],
        score: m.score,
        reason: m.reason
      })).filter((m: any) => m.pet);

      return NextResponse.json({ matches: rankedMatches });
    } catch {
      return NextResponse.json({ matches: allCandidates.slice(0, 6).map(c => ({ pet: c, score: 80, reason: 'Matches your pet criteria' })) });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
