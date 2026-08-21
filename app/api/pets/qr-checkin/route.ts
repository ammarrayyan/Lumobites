import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { unpackPetProfile } from '@/lib/petProfileSchema';

export const dynamic = 'force-dynamic';

// POST /api/pets/qr-checkin
// Validates partner scanning, verifies partner DB status, registers access grant, and returns tiered pet profile data.
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

    // 1. Fetch pet details first
    const { data: pet, error: petErr } = await supabaseAdmin
      .from('owner_pets')
      .select('*')
      .eq('id', cleanPetId)
      .maybeSingle();

    if (petErr || !pet) {
      return NextResponse.json({ error: 'Pet profile not found or removed.' }, { status: 404 });
    }

    // 2. STRICT PARTNER VERIFICATION AGAINST DATABASE
    // Verify that cleanPartnerEmail exists in vet_clinics, pet_daycares, sitters, shelters, or matches pet.owner_email
    let isVerifiedPartner = false;
    let actualAccessTier: 'full_vet' | 'care_level' = 'care_level';

    // Is Pet Owner?
    if (pet.owner_email && pet.owner_email.toLowerCase().trim() === cleanPartnerEmail) {
      isVerifiedPartner = true;
      actualAccessTier = 'full_vet';
    }

    // Is Registered Vet Clinic?
    if (!isVerifiedPartner) {
      const { data: vet } = await supabaseAdmin
        .from('vet_clinics')
        .select('id, email, status')
        .eq('email', cleanPartnerEmail)
        .maybeSingle();

      if (vet) {
        isVerifiedPartner = true;
        actualAccessTier = 'full_vet';
      }
    }

    // Is Registered Daycare Facility?
    if (!isVerifiedPartner) {
      const { data: daycare } = await supabaseAdmin
        .from('pet_daycares')
        .select('id, email, status')
        .eq('email', cleanPartnerEmail)
        .maybeSingle();

      if (daycare) {
        isVerifiedPartner = true;
        actualAccessTier = 'care_level';
      }
    }

    // Is Registered Pet Sitter?
    if (!isVerifiedPartner) {
      const { data: sitter } = await supabaseAdmin
        .from('sitters')
        .select('id, email, status')
        .eq('email', cleanPartnerEmail)
        .maybeSingle();

      if (sitter) {
        isVerifiedPartner = true;
        actualAccessTier = 'care_level';
      }
    }

    // Is Registered Shelter?
    if (!isVerifiedPartner) {
      const { data: shelter } = await supabaseAdmin
        .from('shelters')
        .select('id, email, status')
        .eq('email', cleanPartnerEmail)
        .maybeSingle();

      if (shelter) {
        isVerifiedPartner = true;
        actualAccessTier = 'care_level';
      }
    }

    if (!isVerifiedPartner) {
      return NextResponse.json(
        {
          error: 'Partner verification failed. This email is not registered as an authorized Vet Clinic, Daycare, Pet Sitter, or Shelter account. Zero pet data is returned to unverified scanners.',
          verified: false,
        },
        { status: 403 }
      );
    }

    // 3. Register or renew access grant
    const { grantOrRenewPetAccess } = await import('@/lib/petAccessHelper');
    await grantOrRenewPetAccess({
      petId: pet.id,
      ownerEmail: pet.owner_email,
      partnerType: cleanPartnerType,
      partnerId: cleanPartnerEmail,
      partnerName: partner_name || `${cleanPartnerType.toUpperCase()} Partner (${cleanPartnerEmail})`,
      partnerEmail: cleanPartnerEmail,
    });

    const unpackedPet = unpackPetProfile(pet);
    if (!unpackedPet) {
      return NextResponse.json({ error: 'Pet profile not found' }, { status: 404 });
    }

    // 4. Return Tiered Field Visibility for verified partner
    if (actualAccessTier === 'full_vet') {
      return NextResponse.json({
        success: true,
        access_tier: 'full_vet',
        granted_at: accessGrant?.granted_at || new Date().toISOString(),
        pet: unpackedPet,
      });
    } else {
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

