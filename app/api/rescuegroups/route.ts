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
    const locationParam = searchParams.get('location') || searchParams.get('city') || '';
    const isZip = /^\d{5}$/.test(locationParam.trim());
    
    let filterRadius: any = {
      miles: 50,
      postalcode: "40202"
    };

    if (isZip) {
      filterRadius.postalcode = locationParam.trim();
    } else if (locationParam.trim().length > 0) {
      // Geocode the city name to lat/lon since RescueGroups strictly requires a zip or lat/lon
      let geocoded = false;
      try {
        const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_VISION_API_KEY;
        if (googleKey) {
          const geocodeRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationParam)}&region=us&key=${googleKey}`);
          const geocodeData = await geocodeRes.json();
          if (geocodeData.status === 'OK' && geocodeData.results?.length > 0) {
            const loc = geocodeData.results[0].geometry.location;
            filterRadius = {
              miles: 50,
              lat: loc.lat,
              lon: loc.lng
            };
            geocoded = true;
          } else {
             console.error('[RescueGroups Geocode error] Google API returned:', geocodeData.status);
          }
        }
      } catch (e) {
        console.error('[RescueGroups Geocode error]', e);
      }
      
      if (!geocoded) {
         return NextResponse.json({
           pets: [],
           message: "Could not find that location. Please try searching with a 5-digit zip code."
         });
      }
    }

    const apiKey = process.env.RESCUEGROUPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        pets: [],
        message: "We're connecting with more rescue partners soon — check back for more adoptable pets nearby!"
      });
    }

    // Map frontend filters to RescueGroups V5 format
    const filters = [];
    
    // Always filter for Available pets only (per user request)
    filters.push({
      fieldName: "statuses.name",
      operation: "equals",
      criteria: "Available"
    });

    // Exclude stale/abandoned listings (not updated in the last year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    filters.push({
      fieldName: "animals.updatedDate",
      operation: "greaterthan",
      criteria: oneYearAgo.toISOString()
    });

    if (type && type.toLowerCase() !== 'all') {
      filters.push({
        fieldName: "species.singular",
        operation: "equals",
        criteria: type.toLowerCase() === 'dog' ? 'Dog' : 'Cat'
      });
    }

    if (age && age.toLowerCase() !== 'any age') {
      const criteriaAge = age.toLowerCase() === 'puppy' ? 'Baby' : normalizeSentenceCase(age);
      filters.push({
        fieldName: "animals.ageGroup",
        operation: "equals",
        criteria: criteriaAge
      });
    }

    if (size && size.toLowerCase() !== 'any size') {
      filters.push({
        fieldName: "animals.sizeGroup",
        operation: "equals",
        criteria: normalizeSentenceCase(size)
      });
    }
    
    // Construct the RescueGroups V5 API request payload
    const payload: any = {
      data: {
        filters: filters,
        filterProcessing: filters.length > 1 ? "2" : "1",
        filterRadius: filterRadius
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
      // If no pet-specific URL exists, perform a targeted Google search for the EXACT pet at that shelter
      // This is much better than dumping the user on a generic shelter homepage where they have to hunt.
      const petName = normalizeSentenceCase(attrs.name || 'Not specified');
      let finalUrl = attrs.animalUrl || attrs.url;
      if (!finalUrl) {
        finalUrl = `https://www.google.com/search?q=${encodeURIComponent(`"${attrs.name}" adopt "${orgName}" ${city}`)}`;
      }

      return {
        id: animal.id,
        name: petName,
        species: species,
        breed: attrs.breedPrimary || attrs.breedString || 'Mixed',
        age: attrs.ageGroup || attrs.ageString || 'Not specified',
        size: attrs.sizeGroup || 'Not specified',
        sex: attrs.sex || 'Not specified',
        photo: photoUrl,
        shelter_name: orgName,
        url: finalUrl,
        description: description,
        city: city,
        lat: org?.attributes?.lat,
        lng: org?.attributes?.lon
      };
    });

    return NextResponse.json({ pets });
  } catch (error) {
    console.error('[RescueGroups API] error:', error);
    return NextResponse.json({ pets: [] });
  }
}
