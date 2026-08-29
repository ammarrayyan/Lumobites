import { supabaseAdmin } from './supabase.ts';
import { formatSitterName } from './email-template.ts';

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
 * Under Automatic Booking-Lifecycle Access Model:
 * - The moment an inquiry or booking exists, access is automatically active at the partner's tier.
 * - Access ends automatically when the booking is marked 'completed' or 'cancelled'.
 */
export async function grantOrRenewPetAccess(params: GrantPetAccessParams): Promise<{ success: boolean; status?: string }> {
  try {
    const { petId, ownerEmail, partnerType, partnerId, partnerName, partnerEmail, petName } = params;

    if (!ownerEmail || !partnerId) {
      return { success: false };
    }

    const cleanOwnerEmail = ownerEmail.toLowerCase().trim();
    let resolvedPetName = petName;
    if (!resolvedPetName && petId) {
      const { data: p } = await supabaseAdmin.from('owner_pets').select('pet_name').eq('id', petId).maybeSingle();
      if (p?.pet_name) resolvedPetName = p.pet_name;
    }
    if (!resolvedPetName) resolvedPetName = 'your pet';

    let currentStatus = 'active';

    if (partnerType === 'vet') {
      const { data: rows } = await supabaseAdmin
        .from('vet_inquiries')
        .select('*')
        .eq('clinic_id', String(partnerId))
        .eq('owner_email', cleanOwnerEmail)
        .order('created_at', { ascending: false })
        .limit(1);
      const existing = rows && rows.length > 0 ? rows[0] : null;

      if (existing) {
        currentStatus = existing.status || 'active';
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
      const { data: rows } = await supabaseAdmin
        .from('daycare_inquiries')
        .select('*')
        .eq('daycare_id', String(partnerId))
        .eq('owner_email', cleanOwnerEmail)
        .order('created_at', { ascending: false })
        .limit(1);
      const existing = rows && rows.length > 0 ? rows[0] : null;

      if (existing) {
        currentStatus = existing.status || 'active';
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
      const { data: rows } = await supabaseAdmin
        .from('sitting_requests')
        .select('*')
        .eq('sitter_id', String(partnerId))
        .eq('owner_email', cleanOwnerEmail)
        .order('created_at', { ascending: false })
        .limit(1);
      const existing = rows && rows.length > 0 ? rows[0] : null;

      if (existing) {
        if (petId && !existing.pet_id) {
          await supabaseAdmin.from('sitting_requests').update({ pet_id: petId }).eq('id', existing.id);
        }
        currentStatus = existing.status || 'active';
      } else {
        let fallbackPetName = resolvedPetName !== 'your pet' ? resolvedPetName : null;
        let fallbackPetType = null;
        if (petId) {
          const { data: p } = await supabaseAdmin.from('owner_pets').select('pet_name, pet_type').eq('id', petId).maybeSingle();
          if (p) {
            fallbackPetName = p.pet_name || fallbackPetName;
            fallbackPetType = p.pet_type || null;
          }
        }
        await supabaseAdmin.from('sitting_requests').insert({
          sitter_id: String(partnerId),
          owner_email: cleanOwnerEmail,
          pet_id: petId || null,
          pet_name: fallbackPetName,
          pet_type: fallbackPetType,
          status: 'pending',
          dates: 'Ongoing Care'
        });
      }
    }

    return { success: true, status: currentStatus };
  } catch (err: any) {
    console.error('[PetAccess] Exception in grantOrRenewPetAccess:', err);
    return { success: false };
  }
}

/**
 * Checks whether a partner has active profile access for a pet based on booking lifecycle.
 * Rules:
 * 1. Booking in active state ('pending', 'active', 'accepted', 'confirmed'): ALLOWED immediately at their tier.
 * 2. Booking in 'completed' state: NOT ALLOWED (Access ended upon completion).
 * 3. Booking in 'cancelled', 'declined', 'denied', 'revoked', 'no_show': NOT ALLOWED (Access ended upon cancellation).
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
      const { data: rows } = await supabaseAdmin
        .from('vet_inquiries')
        .select('id, status, created_at')
        .eq('clinic_id', cleanPartnerId)
        .eq('owner_email', cleanEmail)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!rows || rows.length === 0) {
        return { allowed: false, reason: 'No inquiry or booking found for this clinic', status: 'none' };
      }
      status = rows[0].status || 'pending';
    } else if (partnerType === 'daycare') {
      const { data: rows } = await supabaseAdmin
        .from('daycare_inquiries')
        .select('id, status, created_at')
        .eq('daycare_id', cleanPartnerId)
        .eq('owner_email', cleanEmail)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!rows || rows.length === 0) {
        return { allowed: false, reason: 'No inquiry or booking found for this daycare', status: 'none' };
      }
      status = rows[0].status || 'pending';
    } else if (partnerType === 'sitter') {
      const { data: rows } = await supabaseAdmin
        .from('sitting_requests')
        .select('id, status, created_at')
        .eq('sitter_id', cleanPartnerId)
        .eq('owner_email', cleanEmail)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!rows || rows.length === 0) {
        return { allowed: false, reason: 'No booking request found for this sitter', status: 'none' };
      }
      status = rows[0].status || 'pending';
    }

    // 1. Active Booking Statuses -> Automatic Access Granted
    if (['pending', 'active', 'accepted', 'confirmed'].includes(status)) {
      return { allowed: true, status: 'active' };
    }

    // 2. Completed Status -> Access Ended
    if (status === 'completed') {
      return { allowed: false, reason: 'Booking is completed. Profile access has ended.', status: 'completed' };
    }

    // 3. Cancelled / Declined / Revoked / No Show -> Access Ended
    if (['cancelled', 'declined', 'denied', 'revoked', 'rejected', 'no_show'].includes(status)) {
      return { allowed: false, reason: 'Booking was cancelled or closed. Profile access has ended.', status: 'cancelled' };
    }

    return { allowed: false, reason: 'Profile access is not active', status };
  } catch (err: any) {
    console.error('[PetAccess] Error verifying access:', err);
    return { allowed: false, reason: err.message, status: 'error' };
  }
}
