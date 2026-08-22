/**
 * Helper to pack and unpack extended pet medical, care, and emergency fields.
 * Ensures seamless compatibility with existing database columns while supporting
 * rich medical, insurance, and emergency contact structures.
 */

export interface VetVisitRecord {
  id: string;
  visit_date: string;
  reason: string;
  summary: string;
  weight_at_visit?: string;
  treatment_administered?: string;
  next_visit_date?: string;
  follow_up_notes?: string;
  clinic_name: string;
  added_by: string;
  date_added: string;
}

export interface UnpackedPetProfile {
  id?: string;
  owner_email: string;
  pet_name: string;
  pet_type: string;
  breed?: string | null;
  age?: string | null;
  weight?: string | null;
  gender?: string | null;
  spayed_neutered?: boolean;
  feeding_schedule?: string | null;
  medication?: string | null;
  behavior_notes?: string | null;
  allergies?: string | null;
  vet_name?: string | null;
  vet_phone?: string | null;
  photo_url?: string | null;
  photo_urls?: string[];
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  microchip_number?: string | null;
  microchip_added_by?: string | null;
  insurance_provider?: string | null;
  insurance_policy_number?: string | null;
  vaccination_records?: any[];
  vet_visits?: VetVisitRecord[];
  created_at?: string;
}

export function unpackPetProfile(pet: any): UnpackedPetProfile | null {
  if (!pet) return null;

  let parsedNotes: any = {};
  let rawNotes = pet.behavior_notes;

  if (typeof rawNotes === 'string' && rawNotes.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawNotes);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        parsedNotes = parsed;
      }
    } catch {
      // plain text fallback
    }
  }

  let urls: string[] = [];
  if (Array.isArray(pet.photo_urls) && pet.photo_urls.length > 0) {
    urls = pet.photo_urls;
  } else if (pet.photo_url) {
    urls = [pet.photo_url];
  }

  const effectiveNotes = parsedNotes.owner_behavior_notes !== undefined 
    ? parsedNotes.owner_behavior_notes 
    : (typeof rawNotes === 'string' && !rawNotes.startsWith('{') ? rawNotes : '');

  return {
    id: pet.id,
    owner_email: pet.owner_email,
    pet_name: pet.pet_name,
    pet_type: pet.pet_type,
    breed: pet.breed || null,
    age: pet.age || null,
    weight: pet.weight || null,
    gender: pet.gender || null,
    spayed_neutered: typeof pet.spayed_neutered === 'boolean' ? pet.spayed_neutered : true,
    feeding_schedule: pet.feeding_schedule || null,
    medication: pet.medication || null,
    behavior_notes: effectiveNotes,
    allergies: parsedNotes.allergies || pet.allergies || null,
    vet_name: pet.vet_name || null,
    vet_phone: pet.vet_phone || null,
    photo_url: urls[0] || pet.photo_url || '',
    photo_urls: urls,
    emergency_contact_name: parsedNotes.emergency_contact_name || pet.emergency_contact_name || null,
    emergency_contact_phone: parsedNotes.emergency_contact_phone || pet.emergency_contact_phone || null,
    microchip_number: parsedNotes.microchip?.number || pet.microchip_number || null,
    microchip_added_by: parsedNotes.microchip?.added_by || pet.microchip_added_by || null,
    insurance_provider: parsedNotes.insurance_provider || pet.insurance_provider || null,
    insurance_policy_number: parsedNotes.insurance_policy_number || pet.insurance_policy_number || null,
    vaccination_records: Array.isArray(parsedNotes.vaccinations) 
      ? parsedNotes.vaccinations 
      : (Array.isArray(pet.vaccination_records) ? pet.vaccination_records : []),
    vet_visits: Array.isArray(parsedNotes.vet_visits)
      ? parsedNotes.vet_visits
      : (Array.isArray(pet.vet_visits) ? pet.vet_visits : []),
    created_at: pet.created_at,
  };
}

export function packPetProfile(input: any) {
  let structuredNotes: any = {};
  const rawNotes = input.behavior_notes;

  if (typeof rawNotes === 'string' && rawNotes.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawNotes);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        structuredNotes = parsed;
      } else {
        structuredNotes.owner_behavior_notes = rawNotes;
      }
    } catch {
      structuredNotes.owner_behavior_notes = rawNotes;
    }
  } else {
    structuredNotes.owner_behavior_notes = rawNotes || '';
  }

  if (input.allergies !== undefined) structuredNotes.allergies = input.allergies || '';
  if (input.emergency_contact_name !== undefined) structuredNotes.emergency_contact_name = input.emergency_contact_name || '';
  if (input.emergency_contact_phone !== undefined) structuredNotes.emergency_contact_phone = input.emergency_contact_phone || '';
  if (input.insurance_provider !== undefined) structuredNotes.insurance_provider = input.insurance_provider || '';
  if (input.insurance_policy_number !== undefined) structuredNotes.insurance_policy_number = input.insurance_policy_number || '';
  
  if (input.microchip_number !== undefined) {
    structuredNotes.microchip = {
      number: input.microchip_number || '',
      added_by: input.microchip_added_by || 'Added by Owner'
    };
  }

  if (Array.isArray(input.vaccination_records)) {
    structuredNotes.vaccinations = input.vaccination_records;
  }

  if (Array.isArray(input.vet_visits)) {
    structuredNotes.vet_visits = input.vet_visits;
  }

  const rawPhotoUrls = Array.isArray(input.photo_urls) ? input.photo_urls : (input.photo_url ? [input.photo_url] : []);

  return {
    owner_email: input.owner_email?.toLowerCase()?.trim(),
    pet_name: input.pet_name,
    pet_type: input.pet_type,
    breed: input.breed || null,
    age: input.age || null,
    weight: input.weight || null,
    gender: input.gender || null,
    spayed_neutered: typeof input.spayed_neutered === 'boolean' ? input.spayed_neutered : false,
    feeding_schedule: input.feeding_schedule || null,
    medication: input.medication || null,
    behavior_notes: JSON.stringify(structuredNotes),
    vet_name: input.vet_name || null,
    vet_phone: input.vet_phone || null,
    photo_url: rawPhotoUrls[0] || '',
    photo_urls: rawPhotoUrls.slice(0, 3),
  };
}
