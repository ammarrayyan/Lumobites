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
}): Promise<{ success: boolean; error?: string; pet?: any; notifiedCount?: number }> {
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
      adopted_by_email: cleanAdopter || currentMeta.adoptedByEmail,
      adopted_at: nowIso,
      review_sent: true,
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
        adopted_by_email: cleanAdopter || currentMeta.adoptedByEmail,
        adopted_at: nowIso,
        review_sent: true,
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

    // Resolve shelter details
    const shelterObj = Array.isArray(pet.shelters) ? pet.shelters[0] : pet.shelters;
    const shelterName = shelterObj?.org_name || 'Rescue Partner';
    const shelterTargetId = shelterId || shelterObj?.id || pet.shelter_id;
    const petName = pet.name || 'your pet';

    const shelterEmails = [
      (shelterObj?.email || '').toLowerCase().trim(),
      (pet.shelter_email || '').toLowerCase().trim(),
    ].filter(Boolean);

    // Collect all inquirers who messaged about this pet
    const recipientEmails = new Set<string>();
    if (cleanAdopter && !shelterEmails.includes(cleanAdopter)) {
      recipientEmails.add(cleanAdopter);
    }

    try {
      const { data: messages } = await supabaseAdmin
        .from('adoption_messages')
        .select('sender_email, receiver_email')
        .eq('pet_id', petId);

      if (messages && messages.length > 0) {
        for (const m of messages) {
          const s = (m.sender_email || '').toLowerCase().trim();
          const r = (m.receiver_email || '').toLowerCase().trim();
          if (s && !shelterEmails.includes(s)) recipientEmails.add(s);
          if (r && !shelterEmails.includes(r)) recipientEmails.add(r);
        }
      }
    } catch (msgErr) {
      console.warn('[Adoption Review] Message query warning:', msgErr);
    }

    const notifTitle = `${petName} has found a home! 🐾`;
    const notifMsg = `${petName} has found a home! How was your experience with ${shelterName}?`;
    const notifLink = `/adoption?review_shelter=${shelterTargetId}&pet_id=${pet.id}&pet_name=${encodeURIComponent(petName)}&confirm_adopter=true`;

    let notifiedCount = 0;

    for (const recipient of Array.from(recipientEmails)) {
      try {
        await supabaseAdmin.from('notifications').insert({
          recipient_email: recipient,
          type: 'review_request',
          title: notifTitle,
          message: notifMsg,
          link: notifLink,
          booking_id: pet.id,
          read: false,
        });

        await sendPushNotification(recipient, notifTitle, notifMsg, notifLink);
        notifiedCount++;
      } catch (notifErr) {
        console.warn(`[Adoption Review] Failed to notify ${recipient}:`, notifErr);
      }
    }

    return { success: true, pet: finalPet, notifiedCount };
  } catch (err: any) {
    console.error('[markPetAdopted] Exception:', err);
    return { success: false, error: err.message || 'Failed to mark pet as adopted' };
  }
}
