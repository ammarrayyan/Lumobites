import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// POST /api/pets/qr-checkin
// Validates partner scanning, registers an active pet_profile_access grant, and returns tiered pet profile data.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pet_id, partner_email, partner_type, partner_name } = body;

    if (!pet_id || !partner_email || !partner_type) {
      return NextResponse.json(
        { error: 'Pet ID, partner email, and partner type are required.' },
        { status: 400 }
      );
    }

    const cleanPetId = pet_id.trim();
    const cleanPartnerEmail = partner_email.toLowerCase().trim();
    const cleanPartnerType = (partner_type as string).toLowerCase().trim() as 'vet' | 'daycare' | 'sitter';

    if (!['vet', 'daycare', 'sitter'].includes(cleanPartnerType)) {
      return NextResponse.json(
        { error: 'Invalid partner type. Must be vet, daycare, or sitter.' },
        { status: 400 }
      );
    }

    // 1. Fetch pet details to verify existence & get owner email
    const { data: pet, error: petErr } = await supabaseAdmin
      .from('owner_pets')
      .select('*')
      .eq('id', cleanPetId)
      .maybeSingle();

    if (petErr || !pet) {
      return NextResponse.json({ error: 'Pet profile not found or removed.' }, { status: 404 });
    }

    // 2. Insert or update pet_profile_access grant
    const { data: accessGrant, error: grantErr } = await supabaseAdmin
      .from('pet_profile_access')
      .upsert(
        {
          pet_id: pet.id,
          owner_email: pet.owner_email,
          partner_type: cleanPartnerType,
          partner_id: cleanPartnerEmail,
          partner_name: partner_name || `${cleanPartnerType.toUpperCase()} Partner (${cleanPartnerEmail})`,
          partner_email: cleanPartnerEmail,
          status: 'active',
          granted_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        },
        { onConflict: 'pet_id,partner_email,partner_type' }
      )
      .select('*')
      .single();

    if (grantErr) {
      console.warn('[QR Checkin POST] Upsert grant warning (proceeding):', grantErr.message);
    }

    // 3. Return Tiered Field Visibility
    if (cleanPartnerType === 'vet') {
      return NextResponse.json({
        success: true,
        access_tier: 'full_vet',
        granted_at: accessGrant?.granted_at || new Date().toISOString(),
        pet,
      });
    } else {
      // Care-Level Access: Exclude sensitive medical/insurance credentials
      const careLevelPet = {
        id: pet.id,
        owner_email: pet.owner_email,
        pet_name: pet.pet_name,
        pet_type: pet.pet_type,
        breed: pet.breed,
        age: pet.age,
        weight: pet.weight,
        gender: pet.gender,
        spayed_neutered: pet.spayed_neutered,
        feeding_schedule: pet.feeding_schedule,
        medication: pet.medication,
        behavior_notes: pet.behavior_notes,
        allergies: pet.allergies,
        emergency_contact_name: pet.emergency_contact_name,
        emergency_contact_phone: pet.emergency_contact_phone,
        vet_name: pet.vet_name,
        vet_phone: pet.vet_phone,
        photo_url: pet.photo_url,
        photo_urls: pet.photo_urls,
      };

      return NextResponse.json({
        success: true,
        access_tier: 'care_level',
        granted_at: accessGrant?.granted_at || new Date().toISOString(),
        pet: careLevelPet,
      });
    }
  } catch (err: any) {
    console.error('[QR Checkin POST] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
