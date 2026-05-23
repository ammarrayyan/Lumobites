import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');
  
  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  // We use the vision key since it is the active Google API key in this project
  const apiKey = process.env.GOOGLE_VISION_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Google API key is not configured' }, { status: 500 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const addressComponents = data.results[0].address_components;
      let city = '';
      
      for (const component of addressComponents) {
        if (component.types.includes('locality') || component.types.includes('postal_town')) {
          city = component.long_name;
          break;
        }
      }

      return NextResponse.json({ lat: location.lat, lng: location.lng, city });
    } else {
      console.error('[Geocode API] No results or error from Google:', data.status, data.error_message);
      return NextResponse.json({ error: 'Could not geocode address', details: data.status }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Geocode API] Fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
