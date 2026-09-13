import { supabaseAdmin } from '@/lib/supabase';
import { sendPushNotification } from '@/lib/push';
import { extractAdoptionMeta, packAdoptionDescription, AdoptionMeta } from './adoptionMetaHelper';

export { extractAdoptionMeta, packAdoptionDescription };
export type { AdoptionMeta };

/**
 * Marks a pet as adopted, records adopter details, and triggers review request notification.
 */
export async function markPetAdopted(params: {
  petId: string;
  shelterId?: string;
  adoptedByEmail?: string | null;
}): Promise<{ success: boolean; error?: string; pet?: any }> {
  const { petId, shelterId, adoptedByEmail } = params;

  try {
    const { data: pet, error: fetchErr } = await supabaseAdmin
      .from('adoption_pets')
      .select('*, shelters(id, org_name, email)')
      .eq('id', petId)
      .single();

    if (fetchErr || !pet) {
      return { success: false, error: 'Pet not found' };
    }

    const cleanAdopter = adoptedByEmail ? adoptedByEmail.toLowerCase().trim() : null;
    const nowIso = new Date().toISOString();

    const currentMeta = extractAdoptionMeta(pet);
    const updatedMeta: AdoptionMeta = {
      adopted_by_email: cleanAdopter,
      adopted_at: nowIso,
      review_sent: false,
    };

    const newDescription = packAdoptionDescription(currentMeta.cleanDescription, updatedMeta);

    // Try direct column update first, fallback to description packing
    const updatePayload: any = {
      status: 'adopted',
      description: newDescription,
    };

    // Attempt update with column fields
    const { data: updatedPet, error: updateErr } = await supabaseAdmin
      .from('adoption_pets')
      .update({
        ...updatePayload,
        adopted_by_email: cleanAdopter,
        adopted_at: nowIso,
        review_sent: false,
      })
      .eq('id', petId)
      .select('*, shelters(id, org_name, email)')
      .single();

    let finalPet = updatedPet;

    if (updateErr) {
      // Column may not exist in DB yet, update without the new columns
      const { data: fallbackPet, error: fallbackErr } = await supabaseAdmin
        .from('adoption_pets')
        .update(updatePayload)
        .eq('id', petId)
        .select('*, shelters(id, org_name, email)')
        .single();

      if (fallbackErr) {
        return { success: false, error: fallbackErr.message };
      }
      finalPet = fallbackPet;
    }

    // If an adopter was specified, send immediate review request notification
    if (cleanAdopter && (pet.shelters || shelterId)) {
      const shelterObj = Array.isArray(pet.shelters) ? pet.shelters[0] : pet.shelters;
      const shelterName = shelterObj?.org_name || 'Rescue Partner';
      const shelterTargetId = shelterId || shelterObj?.id || pet.shelter_id;
      const petName = pet.name || 'your pet';

      const notifTitle = `Congratulations on Adopting ${petName}! 🐾`;
      const notifMsg = `How was your adoption experience with ${shelterName}? Leave a review`;
      const notifLink = `/adoption?review_shelter=${shelterTargetId}&pet_id=${pet.id}`;

      try {
        await supabaseAdmin.from('notifications').insert({
          recipient_email: cleanAdopter,
          type: 'review_request',
          title: notifTitle,
          message: notifMsg,
          link: notifLink,
          booking_id: pet.id,
          read: false,
        });
      } catch (notifErr) {
        console.warn('[Adoption Review] Notification insert warning:', notifErr);
      }

      try {
        await sendPushNotification(cleanAdopter, notifTitle, notifMsg, notifLink);
      } catch (pushErr) {
        console.warn('[Adoption Review] Push notification warning:', pushErr);
      }
    }

    return { success: true, pet: finalPet };
  } catch (err: any) {
    console.error('[markPetAdopted] Exception:', err);
    return { success: false, error: err.message || 'Failed to mark pet as adopted' };
  }
}
