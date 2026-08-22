import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { unpackPetProfile, packPetProfile } from '@/lib/petProfileSchema';

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

    const normalizedPets = (pets || []).map(p => unpackPetProfile(p));

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

    let petPayload = packPetProfile({
      owner_email: cleanEmail,
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
      photo_url: processedPhotoUrls[0] || '',
      photo_urls: processedPhotoUrls,
      vaccination_records,
      chronic_conditions: body.chronic_conditions,
      microchip_number,
      allergies,
      emergency_contact_name,
      emergency_contact_phone,
      insurance_provider,
      insurance_policy_number
    });

    let resultData = null;
    let dbError = null;

    if (id) {
      // 🔒 SERVER-SIDE TAMPER-PROOFING: Fetch existing pet and preserve all Vet-verified records
      const { data: existingPet } = await supabaseAdmin
        .from('owner_pets')
        .select('*')
        .eq('id', id)
        .eq('owner_email', cleanEmail)
        .maybeSingle();

      if (existingPet) {
        const unpackedExisting = unpackPetProfile(existingPet);

        // 1. Preserve all Vet-added vaccinations
        const existingVetVaccines = (unpackedExisting?.vaccination_records || []).filter(
          (v: any) => v.added_by && v.added_by !== 'Owner Log' && v.added_by !== 'Added by Owner'
        );
        const submittedOwnerVaccines = (Array.isArray(vaccination_records) ? vaccination_records : []).filter(
          (v: any) => !v.added_by || v.added_by === 'Owner Log' || v.added_by === 'Added by Owner'
        );
        const mergedVaccines = [...existingVetVaccines, ...submittedOwnerVaccines];

        // 2. Preserve all Vet-added chronic conditions
        const existingVetConditions = (unpackedExisting?.chronic_conditions || []).filter(
          (c: any) => c.added_by && c.added_by !== 'Owner Log' && c.added_by !== 'Added by Owner'
        );
        const submittedOwnerConditions = (Array.isArray(body.chronic_conditions) ? body.chronic_conditions : []).filter(
          (c: any) => !c.added_by || c.added_by === 'Owner Log' || c.added_by === 'Added by Owner'
        );
        const mergedConditions = [...existingVetConditions, ...submittedOwnerConditions];

        // 3. Preserve Vet-verified microchip if set by a clinic
        let resolvedMicrochip = microchip_number;
        let resolvedMicrochipAddedBy = 'Added by Owner';
        if (
          unpackedExisting?.microchip_added_by &&
          unpackedExisting.microchip_added_by !== 'Added by Owner' &&
          unpackedExisting.microchip_added_by !== 'Owner Log' &&
          unpackedExisting.microchip_number
        ) {
          resolvedMicrochip = unpackedExisting.microchip_number;
          resolvedMicrochipAddedBy = unpackedExisting.microchip_added_by;
        }

        // 4. Preserve all Vet Visit logs
        const existingVetVisits = unpackedExisting?.vet_visits || [];

        petPayload = packPetProfile({
          owner_email: cleanEmail,
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
          photo_url: processedPhotoUrls[0] || existingPet.photo_url || '',
          photo_urls: processedPhotoUrls.length > 0 ? processedPhotoUrls : (unpackedExisting?.photo_urls || []),
          vaccination_records: mergedVaccines,
          chronic_conditions: mergedConditions,
          vet_visits: existingVetVisits,
          microchip_number: resolvedMicrochip,
          microchip_added_by: resolvedMicrochipAddedBy,
          allergies,
          emergency_contact_name,
          emergency_contact_phone,
          insurance_provider,
          insurance_policy_number
        });
      }

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

    return NextResponse.json({ success: true, pet: unpackPetProfile(resultData) });
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
