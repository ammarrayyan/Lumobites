import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    const { data: pets, error } = await supabaseAdmin
      .from('owner_pets')
      .select('*')
      .eq('owner_email', cleanEmail)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Pets GET] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const normalizedPets = (pets || []).map(p => {
      let urls = p.photo_urls;
      if (!Array.isArray(urls) || urls.length === 0) {
        urls = p.photo_url ? [p.photo_url] : [];
      }
      return {
        ...p,
        photo_urls: urls
      };
    });

    return NextResponse.json({ success: true, pets: normalizedPets });
  } catch (error: any) {
    console.error('[Pets GET] Server error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      owner_email,
      pet_name,
      pet_type,
      breed,
      age,
      weight,
      gender,
      spayed_neutered,
      feeding_schedule,
      medication,
      behavior_notes,
      vet_name,
      vet_phone,
      photo_url,
      photo_urls,
      vaccination_records,
      microchip_number,
      allergies,
      emergency_contact_name,
      emergency_contact_phone,
      insurance_provider,
      insurance_policy_number
    } = body;

    if (!owner_email || !pet_name || !pet_type) {
      return NextResponse.json({ error: 'Email, pet name, and pet type are required' }, { status: 400 });
    }

    const cleanEmail = owner_email.toLowerCase().trim();

    // Process photo_urls array (up to 3 photos)
    let processedPhotoUrls: string[] = [];
    const rawPhotoUrls = Array.isArray(photo_urls) ? photo_urls : (photo_url ? [photo_url] : []);
    
    // Limit to maximum of 3 photos
    const targetUrls = rawPhotoUrls.slice(0, 3);

    for (const url of targetUrls) {
      if (typeof url === 'string') {
        if (url.startsWith('data:image/')) {
          try {
            const matches = url.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              const fileExt = matches[1] === 'jpeg' ? 'jpg' : matches[1];
              const base64Data = matches[2];
              const buffer = Buffer.from(base64Data, 'base64');
              const randSuffix = Math.random().toString(36).substring(2, 7);
              const fileName = `pet_${Date.now()}_${randSuffix}.${fileExt}`;

              const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                .from('sitter-photos')
                .upload(fileName, buffer, {
                  contentType: `image/${matches[1]}`,
                  upsert: true
                });

              if (uploadError) {
                console.warn('[Pets POST] Storage upload failed for carousel photo:', uploadError.message);
                processedPhotoUrls.push(url);
              } else {
                const { data: publicUrlData } = supabaseAdmin.storage
                  .from('sitter-photos')
                  .getPublicUrl(fileName);
                processedPhotoUrls.push(publicUrlData.publicUrl);
              }
            } else {
              processedPhotoUrls.push(url);
            }
          } catch (ex) {
            console.error('[Pets POST] Carousel photo upload exception:', ex);
            processedPhotoUrls.push(url);
          }
        } else {
          processedPhotoUrls.push(url);
        }
      }
    }

    const petPayload = {
      owner_email: cleanEmail,
      pet_name,
      pet_type,
      breed: breed || null,
      age: age || null,
      weight: weight || null,
      gender: gender || null,
      spayed_neutered: spayed_neutered !== undefined ? spayed_neutered : false,
      feeding_schedule: feeding_schedule || null,
      medication: medication || null,
      behavior_notes: behavior_notes || null,
      vet_name: vet_name || null,
      vet_phone: vet_phone || null,
      photo_url: processedPhotoUrls[0] || '',
      photo_urls: processedPhotoUrls,
      vaccination_records: Array.isArray(vaccination_records) ? vaccination_records : [],
      microchip_number: microchip_number || null,
      allergies: allergies || null,
      emergency_contact_name: emergency_contact_name || null,
      emergency_contact_phone: emergency_contact_phone || null,
      insurance_provider: insurance_provider || null,
      insurance_policy_number: insurance_policy_number || null
    };

    let resultData = null;
    let dbError = null;

    if (id) {
      // Update existing record
      const { data, error } = await supabaseAdmin
        .from('owner_pets')
        .update(petPayload)
        .eq('id', id)
        .eq('owner_email', cleanEmail)
        .select()
        .single();
      resultData = data;
      dbError = error;
    } else {
      // Insert new record
      const { data, error } = await supabaseAdmin
        .from('owner_pets')
        .insert(petPayload)
        .select()
        .single();
      resultData = data;
      dbError = error;
    }

    if (dbError) {
      console.error('[Pets POST] Database save error:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, pet: resultData });
  } catch (error: any) {
    console.error('[Pets POST] Server error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');

    if (!id || !email) {
      return NextResponse.json({ error: 'Pet ID and owner email are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    const { error } = await supabaseAdmin
      .from('owner_pets')
      .delete()
      .eq('id', id)
      .eq('owner_email', cleanEmail);

    if (error) {
      console.error('[Pets DELETE] Database delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Pets DELETE] Server error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
