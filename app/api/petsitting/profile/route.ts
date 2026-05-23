import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('sitters')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json(null);
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[PetSitting Profile API] Error fetching:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, photo_url, city, zip, country, bio, pet_types, rate_per_night, availability } = body;

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const resolvedCountry = country || 'United States';

    // Geocode the address
    let lat = null;
    let lng = null;
    try {
      const address = `${city}, ${zip}, ${resolvedCountry}`;
      const apiKey = process.env.GOOGLE_VISION_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (apiKey) {
        const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`);
        const geoData = await geoRes.json();
        if (geoData.status === 'OK' && geoData.results && geoData.results.length > 0) {
          lat = geoData.results[0].geometry.location.lat;
          lng = geoData.results[0].geometry.location.lng;
          console.log(`[PetSitting Profile] Geocoded ${address} to ${lat}, ${lng}`);
        } else {
          console.warn('[PetSitting Profile] Geocode failed or no results:', geoData.status);
        }
      }
    } catch (e) {
      console.error('[PetSitting Profile] Geocoding exception:', e);
    }

    const { data, error } = await supabase
      .from('sitters')
      .upsert({
        email: cleanEmail,
        name,
        photo_url,
        city,
        zip,
        country: resolvedCountry,
        lat,
        lng,
        bio,
        pet_types,
        rate_per_night: rate_per_night ? parseFloat(rate_per_night) : null,
        availability: availability !== undefined ? availability : true,
      }, { onConflict: 'email', ignoreDuplicates: false })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[PetSitting Profile API] Error saving:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
