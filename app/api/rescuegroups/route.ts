import { NextRequest, NextResponse } from 'next/server';

function decodeHTMLEntities(text: string) {
  if (!text) return text;
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function normalizeSentenceCase(text: string) {
  if (!text) return text;
  // If the text is 80%+ uppercase, consider it ALL CAPS and normalize
  const upperCount = (text.match(/[A-Z]/g) || []).length;
  const alphaCount = (text.match(/[a-zA-Z]/g) || []).length;
  if (alphaCount > 0 && (upperCount / alphaCount) > 0.8) {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
  return text;
}

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
    
    // Construct the RescueGroups V5 API request payload
    // Default to Louisville ZIP (40202) instead of LA (90210) to match Lumo Bites local area
    const payload: any = {
      data: {
        filters: filters,
        filterProcessing: "1",
        filterRadius: {
          miles: 50,
          postalcode: location || "40202"
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
      const orgName = org?.attributes?.name || 'Local Rescue Partner';
      const city = org?.attributes?.city || 'Local Area';
      const orgUrl = org?.attributes?.url || org?.attributes?.websiteUrl;

      // Find included picture
      const pic = included.find((inc: any) => inc.type === 'pictures' && inc.id === pictureId);
      const photoUrl = pic?.attributes?.original?.url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80';

      // Clean up description
      let description = attrs.descriptionText || 'No description provided.';
      description = decodeHTMLEntities(description);
      description = normalizeSentenceCase(description);

      // Guess species if missing
      let species = attrs.speciesString || 'Not specified';
      if (species === 'Not specified' && attrs.searchString) {
        if (attrs.searchString.toLowerCase().includes('dog')) species = 'Dog';
        if (attrs.searchString.toLowerCase().includes('cat')) species = 'Cat';
      }

      // Find a working URL
      // Fallback to searching Google for the rescue if no direct URL is provided
      const finalUrl = attrs.url || orgUrl || `https://www.google.com/search?q=${encodeURIComponent(orgName + ' ' + city + ' pet adoption')}`;

      return {
        id: animal.id,
        name: normalizeSentenceCase(attrs.name || 'Not specified'),
        species: species,
        breed: attrs.breedPrimary || attrs.breedString || 'Mixed',
        age: attrs.ageString || 'Not specified',
        size: attrs.sizeGroup || 'Not specified',
        sex: attrs.sex || 'Not specified',
        photo: photoUrl,
        shelter_name: orgName,
        url: finalUrl,
        description: description,
        city: city
      };
    });

    return NextResponse.json({ pets });
  } catch (error) {
    console.error('[RescueGroups API] error:', error);
    return NextResponse.json({ pets: [] });
  }
}
