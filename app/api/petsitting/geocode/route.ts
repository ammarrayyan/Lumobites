import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');
  
  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  // We prioritize the dedicated Maps key if provided, otherwise fallback to vision key
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_VISION_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Google API key is not configured' }, { status: 500 });
  }

  try {
    let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=us&key=${apiKey}`;
    let res = await fetch(url);
    let data = await res.json();

    // Fallback if ZERO_RESULTS and it looks like a US zip code (5 digits)
    if (data.status === 'ZERO_RESULTS' && /^\d{5}$/.test(address.trim())) {
      url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address + ' USA')}&key=${apiKey}`;
      res = await fetch(url);
      data = await res.json();
    }

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const resultTypes = data.results[0].types || [];
      if (resultTypes.includes('administrative_area_level_1') || resultTypes.includes('country') || resultTypes.includes('administrative_area_level_2')) {
        return NextResponse.json({ 
          error: `Please enter a specific city or zip code for better results — for example 'Louisville' instead of '${address}'`
        }, { status: 400 });
      }

      const location = data.results[0].geometry?.location;
      const addressComponents = data.results[0].address_components || [];
      const formatted_address = data.results[0].formatted_address;
      
      let city = '';
      
      for (const component of addressComponents) {
        if (component.types.includes('locality') || component.types.includes('postal_town') || component.types.includes('neighborhood') || component.types.includes('administrative_area_level_3')) {
          city = component.long_name;
          break;
        }
      }

      if (!city) {
        // If we still can't find a city, fallback to the first word of the formatted address
        city = formatted_address.split(',')[0];
      }

      return NextResponse.json({ lat: location?.lat || 0, lng: location?.lng || 0, city, formatted_address });
    } else {
      console.error('[Geocode API] No results or error from Google:', data.status, data.error_message);
      return NextResponse.json({ error: 'Could not geocode address', details: data.status }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Geocode API] Fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
