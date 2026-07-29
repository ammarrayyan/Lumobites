import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const input = searchParams.get('input');
    const type = searchParams.get('type'); // 'cities' | 'address' | null

    if (!input || input.trim().length < 2) {
      return NextResponse.json({ options: [] });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ options: [] });
    }

    // 1. Try Google Place Autocomplete API first
    try {
      const typeParam = type === 'cities' ? '&types=(cities)' : '';
      const placesUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input.trim())}${typeParam}&key=${apiKey}`;
      const placesRes = await fetch(placesUrl);
      const placesData = await placesRes.json();

      if (placesData.status === 'OK' && placesData.predictions && placesData.predictions.length > 0) {
        const placeOptions = placesData.predictions.map((p: any) => ({
          formatted_address: p.description,
          clean_city: p.description
        }));
        return NextResponse.json({ options: placeOptions });
      }
    } catch (e) {
      console.log('[Autocomplete API] Place autocomplete fetch error, falling back to geocode:', e);
    }

    // 2. Fallback to Google Geocoding API if Place Autocomplete returns no predictions
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(input.trim())}&key=${apiKey}`;
    const res = await fetch(geocodeUrl);
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      const options = data.results.map((r: any) => {
        let city = '';
        let state = '';
        let country = '';

        for (const comp of (r.address_components || [])) {
          if (comp.types.includes('locality')) {
            city = comp.long_name;
          } else if (!city && comp.types.includes('administrative_area_level_2')) {
            city = comp.long_name;
          } else if (!city && comp.types.includes('sublocality')) {
            city = comp.long_name;
          }

          if (comp.types.includes('administrative_area_level_1')) {
            state = comp.short_name;
          }

          if (comp.types.includes('country')) {
            if (comp.short_name === 'US') country = 'USA';
            else if (comp.short_name === 'GB') country = 'UK';
            else if (comp.short_name === 'AE') country = 'UAE';
            else country = comp.long_name;
          }
        }

        const formatted = r.formatted_address || [city, state, country].filter(Boolean).join(', ');
        return {
          formatted_address: formatted,
          clean_city: formatted
        };
      });

      const uniqueOptionsMap = new Map();
      options.forEach(o => {
        if (o.formatted_address && !uniqueOptionsMap.has(o.formatted_address)) {
          uniqueOptionsMap.set(o.formatted_address, o);
        }
      });

      return NextResponse.json({ options: Array.from(uniqueOptionsMap.values()) });
    }

    return NextResponse.json({ options: [] });
  } catch (error: any) {
    console.error('Autocomplete Error:', error);
    return NextResponse.json({ options: [] }, { status: 500 });
  }
}
