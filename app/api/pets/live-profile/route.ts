import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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

    // 1. Verify active access grant
    const { data: accessGrant, error: accessErr } = await supabaseAdmin
      .from('pet_profile_access')
      .select('*')
      .eq('pet_id', petId)
      .eq('partner_id', partnerId)
      .eq('partner_type', partnerType)
      .maybeSingle();

    if (accessErr || !accessGrant) {
      return NextResponse.json({ error: 'Access denied: No active profile access grant found for this partner' }, { status: 403 });
    }

    if (accessGrant.status === 'revoked') {
      return NextResponse.json({ error: 'Access revoked: The pet owner has revoked access for this business' }, { status: 403 });
    }

    // Check 6-month dormancy threshold
    const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;
    const lastAct = accessGrant.last_activity_at ? new Date(accessGrant.last_activity_at).getTime() : new Date(accessGrant.granted_at).getTime();
    if (Date.now() - lastAct > SIX_MONTHS_MS) {
      // Mark dormant
      await supabaseAdmin
        .from('pet_profile_access')
        .update({ status: 'dormant' })
        .eq('id', accessGrant.id);

      return NextResponse.json({ error: 'Access dormant: No booking activity in 6 months. Access will reactivate automatically upon your next booking.' }, { status: 403 });
    }

    // 2. Fetch live pet profile
    const { data: pet, error: petErr } = await supabaseAdmin
      .from('owner_pets')
      .select('*')
      .eq('id', petId)
      .maybeSingle();

    if (petErr || !pet) {
      return NextResponse.json({ error: 'Pet profile not found' }, { status: 404 });
    }

    // 3. Apply Tiered Field Visibility
    if (partnerType === 'vet') {
      // Full Access: Return complete pet record including vaccinations, microchip, insurance
      return NextResponse.json({
        success: true,
        access_tier: 'full_vet',
        pet,
      });
    } else {
      // Care-Level Access Only: Strip medical credentials (vaccination_records, microchip, insurance)
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
        // Explicitly excluded for Care Tier:
        vaccination_records: undefined,
        microchip_number: undefined,
        insurance_provider: undefined,
        insurance_policy_number: undefined,
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
