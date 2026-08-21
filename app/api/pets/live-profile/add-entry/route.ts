import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { unpackPetProfile } from '@/lib/petProfileSchema';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pet_id, partner_id, partner_type, entry_type, data } = body;

    if (!pet_id || !partner_id || !partner_type || !entry_type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: pet_id, partner_id, partner_type, entry_type, data' },
        { status: 400 }
      );
    }

    // 1. Strict Role & Field Scoping
    if (partner_type !== 'vet') {
      return NextResponse.json(
        { error: 'Forbidden: Direct medical entry addition is strictly restricted to licensed Vet Clinics' },
        { status: 403 }
      );
    }

    const ALLOWED_ENTRIES = ['vaccination', 'microchip', 'chronic_condition'];
    if (!ALLOWED_ENTRIES.includes(entry_type)) {
      return NextResponse.json(
        { error: 'Forbidden: Vets may only add vaccination records, microchip numbers, or chronic conditions/diagnoses' },
        { status: 400 }
      );
    }

    // 2. Access Grant Verification
    const { verifyPetAccess } = await import('@/lib/petAccessHelper');
    const accessCheck = await verifyPetAccess(pet_id, partner_id, 'vet');
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { error: `Access denied: ${accessCheck.reason}` },
        { status: 403 }
      );
    }

    // 3. Resolve Vet Clinic Name
    let clinicName = 'Veterinary Clinic';
    const { data: vetData } = await supabaseAdmin
      .from('vet_clinics')
      .select('*')
      .or(`id.eq.${partner_id},email.eq.${partner_id}`)
      .maybeSingle();

    if (vetData?.clinic_name) {
      clinicName = vetData.clinic_name;
    } else if (vetData?.name) {
      clinicName = vetData.name;
    }

    const addedByLabel = `Added by ${clinicName}`;

    // 4. Fetch Current Pet Record
    const { data: pet, error: petErr } = await supabaseAdmin
      .from('owner_pets')
      .select('*')
      .eq('id', pet_id)
      .single();

    if (petErr || !pet) {
      return NextResponse.json({ error: 'Pet record not found' }, { status: 404 });
    }

    // 5. Parse existing structured data stored in behavior_notes (or initialize schema)
    let parsedNotes: any = {
      owner_behavior_notes: '',
      vaccinations: [],
      microchip: null,
      chronic_conditions: []
    };

    if (pet.behavior_notes) {
      try {
        const parsed = JSON.parse(pet.behavior_notes);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          parsedNotes = {
            owner_behavior_notes: parsed.owner_behavior_notes || '',
            vaccinations: Array.isArray(parsed.vaccinations) ? parsed.vaccinations : [],
            microchip: parsed.microchip || null,
            chronic_conditions: Array.isArray(parsed.chronic_conditions) ? parsed.chronic_conditions : []
          };
        } else {
          // Legacy plain text
          parsedNotes.owner_behavior_notes = String(pet.behavior_notes);
        }
      } catch (e) {
        // Plain text string
        parsedNotes.owner_behavior_notes = String(pet.behavior_notes);
      }
    }

    // Also migrate existing top-level fields if present
    if (pet.microchip_number && !parsedNotes.microchip) {
      parsedNotes.microchip = {
        number: pet.microchip_number,
        added_by: pet.microchip_added_by || 'Added by Owner'
      };
    }
    if (Array.isArray(pet.vaccination_records) && pet.vaccination_records.length > 0 && parsedNotes.vaccinations.length === 0) {
      parsedNotes.vaccinations = pet.vaccination_records;
    }

    // 6. Append / Update requested entry
    const timestamp = new Date().toISOString().split('T')[0];

    if (entry_type === 'vaccination') {
      if (!data.name || !data.date_administered) {
        return NextResponse.json({ error: 'Vaccination requires name and date_administered' }, { status: 400 });
      }
      const newVax = {
        id: `vax_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: String(data.name).trim(),
        date_administered: String(data.date_administered).trim(),
        expiration_date: data.expiration_date ? String(data.expiration_date).trim() : 'N/A',
        added_by: addedByLabel,
        date_added: timestamp
      };
      parsedNotes.vaccinations.push(newVax);
    } else if (entry_type === 'microchip') {
      if (!data.number) {
        return NextResponse.json({ error: 'Microchip requires number' }, { status: 400 });
      }
      parsedNotes.microchip = {
        number: String(data.number).trim(),
        added_by: addedByLabel,
        date_added: timestamp
      };
    } else if (entry_type === 'chronic_condition') {
      if (!data.condition) {
        return NextResponse.json({ error: 'Chronic condition requires condition name' }, { status: 400 });
      }
      const newCondition = {
        id: `cond_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        condition: String(data.condition).trim(),
        date_diagnosed: data.date_diagnosed ? String(data.date_diagnosed).trim() : timestamp,
        added_by: addedByLabel,
        date_added: timestamp
      };
      parsedNotes.chronic_conditions.push(newCondition);
    }

    // 7. Save to DB
    const serializedNotes = JSON.stringify(parsedNotes);
    const { data: updatedPet, error: updateErr } = await supabaseAdmin
      .from('owner_pets')
      .update({
        behavior_notes: serializedNotes,
        ...(entry_type === 'microchip' ? { microchip_number: String(data.number).trim(), microchip_added_by: addedByLabel } : {})
      })
      .eq('id', pet_id)
      .select()
      .single();

    if (updateErr) {
      console.error('[Add Medical Entry] Update error:', updateErr);
      return NextResponse.json({ error: 'Failed to update pet medical record' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added entry: ${addedByLabel}`,
      added_by: addedByLabel,
      pet: unpackPetProfile(updatedPet)
    });
  } catch (err: any) {
    console.error('[Add Medical Entry] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
