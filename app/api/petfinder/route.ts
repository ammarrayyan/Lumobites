import { NextRequest, NextResponse } from 'next/server';

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getPetfinderToken() {
  const apiKey = process.env.PETFINDER_API_KEY;
  const apiSecret = process.env.PETFINDER_SECRET;

  if (!apiKey || !apiSecret) {
    return null;
  }

  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const res = await fetch('https://api.petfinder.com/v2/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: apiKey,
        client_secret: apiSecret,
      }),
    });

    if (!res.ok) {
      console.error('[Petfinder API] Token request failed:', res.statusText);
      return null;
    }

    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return cachedToken;
  } catch (err) {
    console.error('[Petfinder API] Token fetch error:', err);
    return null;
  }
}

const MOCK_PETFINDER_PETS = [
  {
    id: 'pf-101',
    name: 'Buddy',
    species: 'Dog',
    breed: 'Golden Retriever Mix',
    age: 'Young',
    size: 'Medium',
    sex: 'Male',
    photo: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80',
    shelter_name: 'Happy Paws Rescue',
    url: 'https://www.petfinder.com',
    description: 'Friendly, energetic golden mix looking for a loving home with a yard.',
    city: 'Local Area'
  },
  {
    id: 'pf-102',
    name: 'Luna',
    species: 'Cat',
    breed: 'Domestic Shorthair',
    age: 'Adult',
    size: 'Small',
    sex: 'Female',
    photo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80',
    shelter_name: 'City Animal Shelter',
    url: 'https://www.petfinder.com',
    description: 'Calm and affectionate tabby kitten who loves snuggling on warm laps.',
    city: 'Local Area'
  },
  {
    id: 'pf-103',
    name: 'Milo',
    species: 'Dog',
    breed: 'Beagle / Terrier',
    age: 'Puppy',
    size: 'Small',
    sex: 'Male',
    photo: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=600&q=80',
    shelter_name: 'Second Chance Pet Haven',
    url: 'https://www.petfinder.com',
    description: 'Playful pup who gets along great with other pets and kids.',
    city: 'Local Area'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || searchParams.get('species');
    const age = searchParams.get('age');
    const size = searchParams.get('size');
    const location = searchParams.get('location') || searchParams.get('city');

    const token = await getPetfinderToken();

    if (!token) {
      // Filter mock pets if filters applied
      let filtered = [...MOCK_PETFINDER_PETS];
      if (type && type !== 'all') {
        filtered = filtered.filter(p => p.species.toLowerCase() === type.toLowerCase());
      }
      if (age && age !== 'all') {
        filtered = filtered.filter(p => p.age.toLowerCase() === age.toLowerCase());
      }
      if (size && size !== 'all') {
        filtered = filtered.filter(p => p.size.toLowerCase() === size.toLowerCase());
      }
      return NextResponse.json({
        animals: filtered,
        fallback: true,
        message: 'Petfinder API key not configured yet. Showing sample nearby listings.'
      });
    }

    const pfParams = new URLSearchParams({ limit: '20' });
    if (type && type !== 'all') pfParams.append('type', type);
    if (age && age !== 'all') pfParams.append('age', age);
    if (size && size !== 'all') pfParams.append('size', size);
    if (location) pfParams.append('location', location);

    const res = await fetch(`https://api.petfinder.com/v2/animals?${pfParams.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      console.error('[Petfinder API] Request failed:', res.statusText);
      return NextResponse.json({ animals: MOCK_PETFINDER_PETS, fallback: true });
    }

    const data = await res.json();
    const formattedAnimals = (data.animals || []).map((animal: any) => ({
      id: `pf-${animal.id}`,
      name: animal.name,
      species: animal.type,
      breed: animal.breeds?.primary || 'Mixed Breed',
      age: animal.age,
      size: animal.size,
      sex: animal.gender,
      photo: animal.primary_photo_cropped?.medium || animal.photos?.[0]?.medium || '/placeholder-pet.png',
      shelter_name: animal.organization_id || 'Partner Rescue',
      url: animal.url,
      description: animal.description || 'Visit Petfinder for full details.',
      city: animal.contact?.address?.city || location || 'Local Area'
    }));

    return NextResponse.json({ animals: formattedAnimals, fallback: false });
  } catch (err: any) {
    console.error('[Petfinder API] Error:', err);
    return NextResponse.json({ animals: MOCK_PETFINDER_PETS, fallback: true });
  }
}
