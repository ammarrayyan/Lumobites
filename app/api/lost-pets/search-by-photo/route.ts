import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Helper function for Haversine distance
const getDistanceInMiles = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 3958.8; // Radius of earth in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      photo,
      description,
      lat,
      lng,
      radius,
      timeframe,
      species,
      minMatchScore
    } = body;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Anthropic API key not configured.' }, { status: 500 });
    }

    if (!photo && !description) {
      return NextResponse.json({ error: 'Either a photo or a description must be provided.' }, { status: 400 });
    }

    let extractedFeatures: any = null;

    // 1. Extract features using Claude
    if (photo) {
      let base64Data = photo;
      let mediaType = 'image/jpeg';
      const matches = photo.match(/^data:(image\/[a-zA-Z0-9]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        mediaType = matches[1];
        base64Data = matches[2];
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Data
                }
              },
              {
                type: 'text',
                text: `Analyze this pet photo and extract features. Return ONLY JSON:
{
  "species": "dog or cat or other",
  "breed": "breed name or mixed or unknown",
  "color": ["primary color", "secondary color"],
  "size": "small or medium or large",
  "markings": "any distinctive markings",
  "gender": "male or female or unknown",
  "age": "puppy/kitten or young or adult or senior or unknown"
}`
              }
            ]
          }]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Claude API feature extraction error:', errText);
        return NextResponse.json({ error: 'Failed to extract features from photo' }, { status: 502 });
      }

      const data = await response.json();
      const textContent = data.content?.find((c: any) => c.type === 'text')?.text || '';
      const cleanText = textContent.replace(/```json|```/g, '').trim();
      extractedFeatures = JSON.parse(cleanText);
    } else if (description) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this pet description and extract features. Return ONLY JSON:
{
  "species": "dog or cat or other",
  "breed": "breed name or mixed or unknown",
  "color": ["primary color", "secondary color"],
  "size": "small or medium or large",
  "markings": "any distinctive markings",
  "gender": "male or female or unknown",
  "age": "puppy/kitten or young or adult or senior or unknown"
}

Description: "${description}"`
              }
            ]
          }]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Claude API text feature extraction error:', errText);
        return NextResponse.json({ error: 'Failed to extract features from description' }, { status: 502 });
      }

      const data = await response.json();
      const textContent = data.content?.find((c: any) => c.type === 'text')?.text || '';
      const cleanText = textContent.replace(/```json|```/g, '').trim();
      extractedFeatures = JSON.parse(cleanText);
    }

    console.log('[AI Match API] Extracted features:', extractedFeatures);

    // 2. Fetch all active found pets from database
    const { data: foundPets, error: dbError } = await supabaseAdmin
      .from('lost_pets')
      .select('*')
      .eq('pet_type', 'found')
      .eq('status', 'active');

    if (dbError || !foundPets) {
      console.error('[AI Match API] Database query error:', dbError);
      return NextResponse.json({ error: 'Failed to query database for found pets' }, { status: 500 });
    }

    console.log('[AI Match API] Total active found pets fetched from DB:', foundPets.length);

    // 3. Pre-filter found pets based on constraints
    let filteredPets = foundPets.map(pet => {
      let distance = null;
      if (lat !== undefined && lng !== undefined && pet.latitude && pet.longitude) {
        distance = getDistanceInMiles(lat, lng, pet.latitude, pet.longitude);
      }

      // Format photos array with fallback parsing
      let photos = pet.photos;
      let cleanDesc = pet.description;
      
      if (!Array.isArray(photos) || photos.length === 0) {
        if (pet.description && pet.description.startsWith('{"photos":')) {
          try {
            const dividerIndex = pet.description.indexOf(' || ');
            if (dividerIndex !== -1) {
              const jsonStr = pet.description.substring(0, dividerIndex);
              const payload = JSON.parse(jsonStr);
              if (Array.isArray(payload.photos)) {
                photos = payload.photos;
              }
              cleanDesc = pet.description.substring(dividerIndex + 4);
            }
          } catch (e) {}
        }
      }

      if (!Array.isArray(photos) || photos.length === 0) {
        photos = pet.photo_url ? [pet.photo_url] : [];
      }

      return {
        ...pet,
        distance,
        photos,
        description: cleanDesc
      };
    });

    // Distance Filter
    if (lat !== undefined && lng !== undefined && radius && radius !== 'any') {
      const radiusNum = parseFloat(radius);
      filteredPets = filteredPets.filter(p => p.distance !== null && p.distance <= radiusNum);
    }

    // Timeframe Filter
    if (timeframe && timeframe !== 'any') {
      const now = Date.now();
      const timeframeLimits: Record<string, number> = {
        'today': 24 * 60 * 60 * 1000,
        '3days': 3 * 24 * 60 * 60 * 1000,
        'week': 7 * 24 * 60 * 60 * 1000,
        'month': 30 * 24 * 60 * 60 * 1000
      };
      
      const limitMs = timeframeLimits[timeframe];
      if (limitMs) {
        filteredPets = filteredPets.filter(p => {
          const postDate = new Date(p.created_at || p.date_lost_found).getTime();
          return now - postDate <= limitMs;
        });
      }
    }

    // Species UI Filter
    if (species && species !== 'all') {
      filteredPets = filteredPets.filter(p => p.species === species);
    }

    console.log('[AI Match API] Filtered found pets count:', filteredPets.length, 'using filters:', { lat, lng, radius, timeframe, species });

    if (filteredPets.length === 0) {
      return NextResponse.json({ success: true, matches: [] });
    }

    // 4. Semantic scoring by Claude
    const scoringResponse = await fetch('https://api.anthropic.com/v1/messages', {
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
          content: [
            {
              type: 'text',
              text: `We are searching for a lost pet. Here are the features of the lost pet:
${JSON.stringify(extractedFeatures, null, 2)}

Here is a list of active "found" pet reports in the database:
${JSON.stringify(filteredPets.map(p => ({
  id: p.id,
  pet_name: p.pet_name,
  species: p.species,
  description: p.description,
  city: p.city,
  date_lost_found: p.date_lost_found,
  ai_features: p.ai_features
})), null, 2)}

Compare the lost pet features against each found pet report. For each found pet report, calculate a matching score (percentage integer from 0 to 100) representing how likely they are to be the same pet, and provide a short, descriptive match rationale.
Use the pre-extracted structured 'ai_features' if available, as well as contextual details in the 'description'.
Consider:
1. Species (if species do not match, the score should be 0).
2. Breed similarity, size, age, gender.
3. Color overlap and markings.
4. Contextual clues in the description.

Return ONLY a JSON array of objects, containing the found pet ID, the match percentage score, and the concise match summary string (e.g. "87% Match — Gray tabby found 2 miles away" - include the approximate score in this summary as shown):
[
  {
    "id": "found-pet-id",
    "score": 87,
    "summary": "87% Match — Gray tabby found 2 miles away"
  }
]`
            }
          ]
        }]
      })
    });

    if (!scoringResponse.ok) {
      const errText = await scoringResponse.text();
      console.error('Claude API scoring error:', errText);
      return NextResponse.json({ error: 'Failed to score matched pets' }, { status: 502 });
    }

    const scoringData = await scoringResponse.json();
    const scoringTextContent = scoringData.content?.find((c: any) => c.type === 'text')?.text || '';
    console.log('[AI Match API] Raw Claude scoring response:', scoringTextContent);
    const cleanScoringText = scoringTextContent.replace(/```json|```/g, '').trim();
    const scoredList: any[] = JSON.parse(cleanScoringText);

    // Map scores back to filtered pets list
    let matchedPets = filteredPets.map(pet => {
      const scoreObj = scoredList.find(s => s.id === pet.id);
      return {
        ...pet,
        score: scoreObj ? scoreObj.score : 0,
        matchSummary: scoreObj ? scoreObj.summary : 'No match information'
      };
    });

    console.log('[AI Match API] Scored pets before filtering:', matchedPets.map(p => ({ id: p.id, name: p.pet_name, score: p.score, summary: p.matchSummary })));

    // 5. Apply minMatchScore filter and sort
    const minScore = minMatchScore ? parseInt(minMatchScore) : 10;
    console.log('[AI Match API] Applying minMatchScore filter of:', minScore);
    matchedPets = matchedPets.filter(p => p.score >= minScore);
    matchedPets.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      success: true,
      matches: matchedPets
    });

  } catch (err: any) {
    console.error('[AI Match API Error]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
