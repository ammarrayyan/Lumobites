import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { unpackPetProfile } from '@/lib/petProfileSchema';
import { verifyPetAccess } from '@/lib/petAccessHelper';

export const dynamic = 'force-dynamic';

// GET /api/pets/live-profile?pet_id=&partner_id=&partner_type=
// Serves live current pet profile data with strict tiered access level field scoping
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const petId = searchParams.get('pet_id');
    const partnerId = searchParams.get('partner_id');
    const partnerType = searchParams.get('partner_type') as 'vet' | 'daycare' | 'sitter' | null;

    if (!petId || !partnerId || !partnerType) {
      return NextResponse.json({ error: 'Missing required query parameters: pet_id, partner_id, partner_type' }, { status: 400 });
    }

    // 1. Fetch live pet profile
    const { data: petRow, error: petErr } = await supabaseAdmin
      .from('owner_pets')
      .select('*')
      .eq('id', petId)
      .maybeSingle();

    if (petErr || !petRow) {
      return NextResponse.json({ error: 'Pet profile not found' }, { status: 404 });
    }

    // 2. Verify active access grant
    const accessCheck = await verifyPetAccess(petId, partnerId, partnerType, petRow.owner_email);
    if (!accessCheck.allowed) {
      return NextResponse.json({
        success: false,
        status: accessCheck.status || 'denied',
        error: `Access ${accessCheck.status === 'pending' ? 'pending owner approval' : 'restricted'}: ${accessCheck.reason}`,
        reason: accessCheck.reason
      }, { status: 200 });
    }

    const unpackedPet = unpackPetProfile(petRow);
    if (!unpackedPet) {
      return NextResponse.json({ error: 'Pet profile not found' }, { status: 404 });
    }

    // 3. Apply Tiered Field Visibility
    if (partnerType === 'vet') {
      // Full Access: Return complete pet record including vaccinations, microchip, insurance
      return NextResponse.json({
        success: true,
        access_tier: 'full_vet',
        pet: unpackedPet,
      });
    } else {
      // Care-Level Access Only: Strip medical credentials (vaccination_records, microchip, insurance, chronic_conditions)
      const careLevelPet = {
        id: unpackedPet.id,
        owner_email: unpackedPet.owner_email,
        pet_name: unpackedPet.pet_name,
        pet_type: unpackedPet.pet_type,
        breed: unpackedPet.breed,
        age: unpackedPet.age,
        weight: unpackedPet.weight,
        gender: unpackedPet.gender,
        spayed_neutered: unpackedPet.spayed_neutered,
        feeding_schedule: unpackedPet.feeding_schedule,
        medication: unpackedPet.medication,
        behavior_notes: unpackedPet.behavior_notes,
        allergies: unpackedPet.allergies,
        emergency_contact_name: unpackedPet.emergency_contact_name,
        emergency_contact_phone: unpackedPet.emergency_contact_phone,
        vet_name: unpackedPet.vet_name,
        vet_phone: unpackedPet.vet_phone,
        photo_url: unpackedPet.photo_url,
        photo_urls: unpackedPet.photo_urls,
        // Explicitly excluded for Care Tier:
        vaccination_records: undefined,
        microchip_number: undefined,
        microchip_added_by: undefined,
        insurance_provider: undefined,
        insurance_policy_number: undefined,
        chronic_conditions: undefined,
        vet_visits: undefined,
      };

      return NextResponse.json({
        success: true,
        access_tier: 'care_level',
        pet: careLevelPet,
      });
    }
  } catch (err: any) {
    console.error('[Live Profile GET] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
