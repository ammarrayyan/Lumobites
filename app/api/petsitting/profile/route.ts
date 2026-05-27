import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
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
    return NextResponse.json({ error: 'Something went wrong loading your profile. Please try again or contact support at info@lumobitespet.com' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, name, photo_url, id_photo_url, city, zip, country, 
      bio, pet_types, rate_per_night, availability, phone_number, phone_visible 
    } = body;

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    if (!photo_url) {
      return NextResponse.json({ error: 'Please upload a clear photo of your face' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const resolvedCountry = country || 'United States';

    // Geocode the address
    let lat = null;
    let lng = null;
    try {
      const addressParts = [city];
      if (zip && zip.trim() !== '') addressParts.push(zip);
      addressParts.push(resolvedCountry);
      const address = addressParts.join(', ');
      
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_VISION_API_KEY;
      if (apiKey) {
        const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`);
        const geoData = await geoRes.json();
        if (geoData.status === 'OK' && geoData.results && geoData.results.length > 0) {
          lat = geoData.results[0].geometry.location.lat;
          lng = geoData.results[0].geometry.location.lng;
        } else {
          return NextResponse.json({ error: 'location_not_found' }, { status: 400 });
        }
      }
    } catch (e) {
      return NextResponse.json({ error: 'location_not_found' }, { status: 400 });
    }

    let finalPhotoUrl = photo_url;
    if (photo_url && photo_url.startsWith('data:image/')) {
      try {
        const matches = photo_url.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const fileExt = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const base64Data = matches[2];
          
          // Google Vision API Face Detection
          const visionApiKey = process.env.GOOGLE_VISION_API_KEY;
          if (visionApiKey) {
            const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`;
            const visionRes = await fetch(visionUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                requests: [{
                  image: { content: base64Data },
                  features: [{ type: 'FACE_DETECTION' }]
                }]
              })
            });
            const visionData = await visionRes.json();
            const faces = visionData.responses?.[0]?.faceAnnotations;
            if (!faces || faces.length === 0) {
              return NextResponse.json({ error: 'Please upload a clear photo of your face' }, { status: 400 });
            }
          }

          const buffer = Buffer.from(base64Data, 'base64');
          const fileName = `${cleanEmail.replace(/[^a-z0-9]/g, '_')}_${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('sitter-photos')
            .upload(fileName, buffer, {
              contentType: `image/${matches[1]}`,
              upsert: true
            });
            
          if (uploadError) throw uploadError;
          
          const { data: publicUrlData } = supabaseAdmin.storage
            .from('sitter-photos')
            .getPublicUrl(fileName);
            
          finalPhotoUrl = publicUrlData.publicUrl;
        }
      } catch (uploadEx) {
        console.error('[PetSitting Profile] Failed to upload photo:', uploadEx);
        throw uploadEx;
      }
    }

    let finalIdUrl = id_photo_url;
    if (id_photo_url && id_photo_url.startsWith('data:image/')) {
      try {
        const matches = id_photo_url.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const fileExt = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          
          const fileName = `${cleanEmail.replace(/[^a-z0-9]/g, '_')}_id_${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('sitter-ids')
            .upload(fileName, buffer, {
              contentType: `image/${matches[1]}`,
              upsert: true
            });
            
          if (uploadError) throw uploadError;
          finalIdUrl = fileName; // Store just the path for private bucket
        }
      } catch (uploadEx) {
        console.error('[PetSitting Profile] Failed to upload ID:', uploadEx);
        throw uploadEx;
      }
    }

    const { data, error } = await supabaseAdmin
      .from('sitters')
      .upsert({
        email: cleanEmail,
        name,
        photo_url: finalPhotoUrl,
        id_photo_url: finalIdUrl,
        city,
        zip,
        country: resolvedCountry,
        lat,
        lng,
        phone_number: phone_number || null,
        phone_visible: phone_visible !== undefined ? phone_visible : false,
        bio,
        pet_types,
        rate_per_night: rate_per_night ? parseFloat(rate_per_night) : null,
        availability: availability !== undefined ? availability : true,
        // Reset approval status upon submission/resubmission
        approval_status: 'pending',
        is_approved: false,
        submitted_at: new Date().toISOString(),
        ...(cleanEmail === 'premierpetnutritionllc@gmail.com' ? { is_pro: true } : {})
      }, { onConflict: 'email', ignoreDuplicates: false })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[PetSitting Profile API] Error saving:', error);
    return NextResponse.json({ error: 'Something went wrong saving your profile. Please try again or contact support at info@lumobitespet.com' }, { status: 500 });
  }
}
