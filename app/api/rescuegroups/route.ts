import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || searchParams.get('species');
    const age = searchParams.get('age');
    const size = searchParams.get('size');
    const location = searchParams.get('location') || searchParams.get('city');

    const apiKey = process.env.RESCUEGROUPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        pets: [],
        message: "We're connecting with more rescue partners soon — check back for more adoptable pets nearby!"
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
