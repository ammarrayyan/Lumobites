import { supabaseAdmin } from './supabase.ts';

export interface GrantPetAccessParams {
  petId: string;
  ownerEmail: string;
  partnerType: 'vet' | 'daycare' | 'sitter';
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  petName?: string;
}

/**
 * Establishes or checks pet profile access for a partner.
 * Under Explicit Owner Approval flow:
 * - If status is already active, preserve active.
 * - If status is revoked or denied, preserve that decision.
 * - Otherwise, create/update the grant in 'pending' status and notify the owner to approve/deny.
 */
export async function grantOrRenewPetAccess(params: GrantPetAccessParams): Promise<{ success: boolean; status?: string }> {
  try {
    const { petId, ownerEmail, partnerType, partnerId, partnerName, partnerEmail, petName } = params;

    if (!ownerEmail || !partnerId) {
      return { success: false };
    }

    const cleanOwnerEmail = ownerEmail.toLowerCase().trim();
    const cleanPartnerEmail = (partnerEmail || '').toLowerCase().trim();
    let resolvedPetName = petName;
    if (!resolvedPetName && petId) {
      const { data: p } = await supabaseAdmin.from('owner_pets').select('pet_name').eq('id', petId).maybeSingle();
      if (p?.pet_name) resolvedPetName = p.pet_name;
    }
    if (!resolvedPetName) resolvedPetName = 'your pet';

    let currentStatus = 'pending';

    if (partnerType === 'vet') {
      const { data: existing } = await supabaseAdmin
        .from('vet_inquiries')
        .select('*')
        .eq('clinic_id', String(partnerId))
        .eq('owner_email', cleanOwnerEmail)
        .maybeSingle();

      if (existing) {
        if (['active', 'accepted', 'confirmed', 'completed', 'no_show'].includes(existing.status)) {
          return { success: true, status: 'active' };
        }
        if (existing.status === 'revoked' || existing.status === 'denied') {
          return { success: true, status: existing.status };
        }
        currentStatus = existing.status || 'pending';
      } else {
        const { error: insErr } = await supabaseAdmin.from('vet_inquiries').insert({
          clinic_id: String(partnerId),
          owner_email: cleanOwnerEmail,
          status: 'pending',
          archived: false
        });
        if (insErr) {
          console.warn('[PetAccess] Error inserting vet inquiry:', insErr);
        }
      }
    } else if (partnerType === 'daycare') {
      const { data: existing } = await supabaseAdmin
        .from('daycare_inquiries')
        .select('*')
        .eq('daycare_id', String(partnerId))
        .eq('owner_email', cleanOwnerEmail)
        .maybeSingle();

      if (existing) {
        if (['active', 'accepted', 'confirmed', 'completed', 'no_show'].includes(existing.status)) {
          return { success: true, status: 'active' };
        }
        if (existing.status === 'revoked' || existing.status === 'denied') {
          return { success: true, status: existing.status };
        }
        currentStatus = existing.status || 'pending';
      } else {
        const { error: insErr } = await supabaseAdmin.from('daycare_inquiries').insert({
          daycare_id: String(partnerId),
          owner_email: cleanOwnerEmail,
          status: 'pending',
          archived: false
        });
        if (insErr) {
          console.warn('[PetAccess] Error inserting daycare inquiry:', insErr);
        }
      }
    } else if (partnerType === 'sitter') {
      const { data: existing } = await supabaseAdmin
        .from('sitting_requests')
        .select('*')
        .eq('sitter_id', String(partnerId))
        .eq('owner_email', cleanOwnerEmail)
        .maybeSingle();

      if (existing) {
        if (['active', 'accepted', 'confirmed', 'completed', 'no_show'].includes(existing.status)) {
          return { success: true, status: 'active' };
        }
        if (existing.status === 'revoked' || existing.status === 'denied') {
          return { success: true, status: existing.status };
        }
        currentStatus = existing.status || 'pending';
      } else {
        await supabaseAdmin.from('sitting_requests').insert({
          sitter_id: String(partnerId),
          owner_email: cleanOwnerEmail,
          pet_id: petId || null,
          status: 'pending',
          dates: 'Ongoing Care'
        });
      }
    }

    // In-app access request notification to owner (non-blocking)
    if (currentStatus === 'pending') {
      try {
        const partnerTypeLabel = partnerType === 'vet' ? 'Vet Clinic' : partnerType === 'daycare' ? 'Daycare' : 'Pet Sitter';
        await supabaseAdmin.from('notifications').insert({
          recipient_email: cleanOwnerEmail,
          type: 'pet_access_request',
          title: 'Pet Profile Access Request 🐾',
          message: `${partnerName} (${partnerTypeLabel}) requested access to ${resolvedPetName}'s profile. Tap to review and approve.`,
          link: '/account?tab=pets',
          read: false,
        });
      } catch (notifErr) {
        console.warn('[PetAccess] Notification insert warning:', notifErr);
      }
    }

    return { success: true, status: currentStatus };
  } catch (err: any) {
    console.error('[PetAccess] Exception in grantOrRenewPetAccess:', err);
    return { success: false };
  }
}

/**
 * Checks whether a partner has an approved active profile access grant for a pet.
 */
export async function verifyPetAccess(
  petId: string,
  partnerId: string,
  partnerType: 'vet' | 'daycare' | 'sitter',
  ownerEmail?: string
): Promise<{ allowed: boolean; reason?: string; status?: string }> {
  try {
    let resolvedOwnerEmail = ownerEmail;
    if (!resolvedOwnerEmail && petId) {
      const { data: pet } = await supabaseAdmin
        .from('owner_pets')
        .select('owner_email')
        .eq('id', petId)
        .maybeSingle();
      resolvedOwnerEmail = pet?.owner_email;
    }

    if (!resolvedOwnerEmail) {
      return { allowed: false, reason: 'Pet not found', status: 'none' };
    }

    const cleanEmail = resolvedOwnerEmail.toLowerCase().trim();
    const cleanPartnerId = String(partnerId).trim();

    let status = 'none';

    if (partnerType === 'vet') {
      const { data: inq } = await supabaseAdmin
        .from('vet_inquiries')
        .select('id, status, created_at')
        .eq('clinic_id', cleanPartnerId)
        .eq('owner_email', cleanEmail)
        .maybeSingle();

      if (!inq) {
        return { allowed: false, reason: 'No inquiry thread found for this clinic', status: 'none' };
      }
      status = inq.status || 'pending';
    } else if (partnerType === 'daycare') {
      const { data: inq } = await supabaseAdmin
        .from('daycare_inquiries')
        .select('id, status, created_at')
        .eq('daycare_id', cleanPartnerId)
        .eq('owner_email', cleanEmail)
        .maybeSingle();

      if (!inq) {
        return { allowed: false, reason: 'No inquiry thread found for this daycare', status: 'none' };
      }
      status = inq.status || 'pending';
    } else if (partnerType === 'sitter') {
      const { data: req } = await supabaseAdmin
        .from('sitting_requests')
        .select('id, status, created_at')
        .eq('sitter_id', cleanPartnerId)
        .eq('owner_email', cleanEmail)
        .maybeSingle();

      if (!req) {
        return { allowed: false, reason: 'No booking request found for this sitter', status: 'none' };
      }
      status = req.status || 'pending';
    }

    if (['active', 'accepted', 'confirmed', 'completed', 'no_show'].includes(status)) {
      return { allowed: true, status: 'active' };
    }
    if (status === 'pending') {
      return { allowed: false, reason: 'Waiting for pet owner approval', status: 'pending' };
    }
    if (status === 'denied') {
      return { allowed: false, reason: 'Access request was declined by pet owner', status: 'denied' };
    }
    if (status === 'revoked') {
      return { allowed: false, reason: 'The pet owner has revoked access for this business', status: 'revoked' };
    }

    return { allowed: false, reason: 'Profile access is not active', status };
  } catch (err: any) {
    console.error('[PetAccess] Error verifying access:', err);
    return { allowed: false, reason: err.message, status: 'error' };
  }
}
