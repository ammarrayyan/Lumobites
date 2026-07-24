import { NextRequest, NextResponse } from 'next/server';

const MOCK_RESCUEGROUPS_PETS = [
  {
    id: 'rg-101',
    name: 'Buddy',
    species: 'Dog',
    breed: 'Golden Retriever Mix',
    age: 'Young',
    size: 'Medium',
    sex: 'Male',
    photo: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80',
    shelter_name: 'Happy Paws Rescue',
    url: 'https://rescuegroups.org',
    description: 'Friendly, energetic golden mix looking for a loving home with a yard.',
    city: 'Local Area'
  },
  {
    id: 'rg-102',
    name: 'Luna',
    species: 'Cat',
    breed: 'Domestic Shorthair',
    age: 'Adult',
    size: 'Small',
    sex: 'Female',
    photo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80',
    shelter_name: 'City Animal Shelter',
    url: 'https://rescuegroups.org',
    description: 'Calm and affectionate tabby kitten who loves snuggling on warm laps.',
    city: 'Local Area'
  },
  {
    id: 'rg-103',
    name: 'Milo',
    species: 'Dog',
    breed: 'Beagle / Terrier',
    age: 'Puppy',
    size: 'Small',
    sex: 'Male',
    photo: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=600&q=80',
    shelter_name: 'Second Chance Pet Haven',
    url: 'https://rescuegroups.org',
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

    const apiKey = process.env.RESCUEGROUPS_API_KEY;

    if (!apiKey) {
      // Filter mock pets if filters applied
      let results = [...MOCK_RESCUEGROUPS_PETS];
      
      if (type && type.toLowerCase() !== 'all') {
        results = results.filter(p => p.species.toLowerCase() === type.toLowerCase());
      }
      if (age && age.toLowerCase() !== 'all') {
        results = results.filter(p => p.age.toLowerCase() === age.toLowerCase());
      }
      if (size && size.toLowerCase() !== 'all') {
        results = results.filter(p => p.size.toLowerCase() === size.toLowerCase());
      }

      return NextResponse.json({
        pets: results,
        message: 'RescueGroups API key not configured yet. Showing sample local pets.'
      });
    }

    // Map frontend filters to RescueGroups V5 format
    const filters = [];
    if (type && type.toLowerCase() !== 'all') {
      filters.push({
        fieldName: "species.name",
        operation: "equals",
        criteria: type.toLowerCase() === 'dog' ? 'Dog' : 'Cat'
      });
    }
    // Note: RescueGroups age/size might require more complex mapping in production.
    
    // Construct the RescueGroups V5 API request payload
    const payload: any = {
      data: {
        filters: filters,
        filterProcessing: "1",
        filterRadius: {
          miles: 25,
          postalcode: location || "90210" // Default to a zip if location is empty
        }
      }
    };

    const res = await fetch('https://api.rescuegroups.org/v5/public/animals/search', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/vnd.api+json',
        'Authorization': apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error('[RescueGroups API] request failed:', res.statusText);
      return NextResponse.json({ pets: [] });
    }

    const json = await res.json();
    const animals = json.data || [];
    const included = json.included || [];

    // Map JSON:API to our flat frontend PetListing structure
    const pets = animals.map((animal: any) => {
      const attrs = animal.attributes || {};
      
      // Extract relationships
      const orgId = animal.relationships?.orgs?.data?.[0]?.id;
      const pictureId = animal.relationships?.pictures?.data?.[0]?.id;

      // Find included org
      const org = included.find((inc: any) => inc.type === 'orgs' && inc.id === orgId);
      const orgName = org?.attributes?.name || 'Local Rescue';
      const city = org?.attributes?.city || 'Local Area';

      // Find included picture
      const pic = included.find((inc: any) => inc.type === 'pictures' && inc.id === pictureId);
      const photoUrl = pic?.attributes?.original?.url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80';

      return {
        id: animal.id,
        name: attrs.name || 'Unknown',
        species: attrs.speciesString || 'Unknown',
        breed: attrs.breedPrimaryString || 'Mixed',
        age: attrs.ageString || 'Unknown',
        size: attrs.sizeString || 'Unknown',
        sex: attrs.sexString || 'Unknown',
        photo: photoUrl,
        shelter_name: orgName,
        url: attrs.url || 'https://rescuegroups.org',
        description: attrs.descriptionText || 'No description provided.',
        city: city
      };
    });

    return NextResponse.json({ pets });
  } catch (error) {
    console.error('[RescueGroups API] error:', error);
    return NextResponse.json({ pets: [] });
  }
}
