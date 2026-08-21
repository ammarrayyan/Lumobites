import { supabaseAdmin } from './supabase.ts';

export interface GrantPetAccessParams {
  petId: string;
  ownerEmail: string;
  partnerType: 'vet' | 'daycare' | 'sitter';
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
}

/**
 * Grants or renews live pet profile access for a partner upon a booking, inquiry, or verified QR check-in.
 */
export async function grantOrRenewPetAccess(params: GrantPetAccessParams): Promise<{ success: boolean; status?: string }> {
  try {
    const { petId, ownerEmail, partnerType, partnerId, partnerName, partnerEmail } = params;

    if (!petId || !ownerEmail || !partnerId) {
      return { success: false };
    }

    const cleanOwnerEmail = ownerEmail.toLowerCase().trim();
    const cleanPartnerEmail = (partnerEmail || '').toLowerCase().trim();

    if (partnerType === 'vet') {
      const { data: existing } = await supabaseAdmin
        .from('vet_inquiries')
        .select('*')
        .eq('clinic_id', String(partnerId))
        .eq('owner_email', cleanOwnerEmail)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'revoked') {
          return { success: true, status: 'revoked' };
        }
        await supabaseAdmin
          .from('vet_inquiries')
          .update({ status: 'active', archived: false })
          .eq('id', existing.id);
        return { success: true, status: 'active' };
      }

      await supabaseAdmin.from('vet_inquiries').insert({
        clinic_id: String(partnerId),
        owner_email: cleanOwnerEmail,
        status: 'active',
        archived: false
      });
    } else if (partnerType === 'daycare') {
      const { data: existing } = await supabaseAdmin
        .from('daycare_inquiries')
        .select('*')
        .eq('daycare_id', String(partnerId))
        .eq('owner_email', cleanOwnerEmail)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'revoked') {
          return { success: true, status: 'revoked' };
        }
        await supabaseAdmin
          .from('daycare_inquiries')
          .update({ status: 'active', archived: false })
          .eq('id', existing.id);
        return { success: true, status: 'active' };
      }

      await supabaseAdmin.from('daycare_inquiries').insert({
        daycare_id: String(partnerId),
        owner_email: cleanOwnerEmail,
        status: 'active',
        archived: false
      });
    } else if (partnerType === 'sitter') {
      const { data: existing } = await supabaseAdmin
        .from('sitting_requests')
        .select('*')
        .eq('sitter_id', String(partnerId))
        .eq('owner_email', cleanOwnerEmail)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'revoked') {
          return { success: true, status: 'revoked' };
        }
        await supabaseAdmin
          .from('sitting_requests')
          .update({ status: 'accepted' })
          .eq('id', existing.id);
        return { success: true, status: 'active' };
      }

      await supabaseAdmin.from('sitting_requests').insert({
        sitter_id: String(partnerId),
        owner_email: cleanOwnerEmail,
        status: 'accepted',
        dates: 'Ongoing Care'
      });
    }

    // In-app transparent notification to owner (non-blocking)
    try {
      await supabaseAdmin.from('notifications').insert({
        recipient_email: cleanOwnerEmail,
        type: 'new_message',
        title: 'Pet Profile Access Granted 🐾',
        message: `${partnerName} (${partnerType === 'vet' ? 'Vet Clinic' : partnerType === 'daycare' ? 'Daycare' : 'Pet Sitter'}) now has active access to your pet's profile. Manage access anytime in Account settings.`,
        link: '/account?tab=pets',
        read: false,
      });
    } catch (notifErr) {
      console.warn('[PetAccess] Notification insert warning:', notifErr);
    }

    return { success: true, status: 'active' };
  } catch (err: any) {
    console.error('[PetAccess] Exception in grantOrRenewPetAccess:', err);
    return { success: false };
  }
}

/**
 * Checks whether a partner has an active profile access grant for a pet.
 */
export async function verifyPetAccess(petId: string, partnerId: string, partnerType: 'vet' | 'daycare' | 'sitter', ownerEmail?: string): Promise<{ allowed: boolean; reason?: string; status?: string }> {
  try {
    let resolvedOwnerEmail = ownerEmail;
    if (!resolvedOwnerEmail) {
      const { data: pet } = await supabaseAdmin
        .from('owner_pets')
        .select('owner_email')
        .eq('id', petId)
        .maybeSingle();
      resolvedOwnerEmail = pet?.owner_email;
    }

    if (!resolvedOwnerEmail) {
      return { allowed: false, reason: 'Pet not found' };
    }

    const cleanEmail = resolvedOwnerEmail.toLowerCase().trim();
    const cleanPartnerId = String(partnerId).trim();

    if (partnerType === 'vet') {
      const { data: inq } = await supabaseAdmin
        .from('vet_inquiries')
        .select('id, status, created_at')
        .eq('clinic_id', cleanPartnerId)
        .eq('owner_email', cleanEmail)
        .maybeSingle();

      if (!inq) {
        return { allowed: false, reason: 'No active booking or inquiry found for this partner' };
      }
      if (inq.status === 'revoked') {
        return { allowed: false, reason: 'The pet owner has revoked access for this business' };
      }
      return { allowed: true, status: inq.status };
    }

    if (partnerType === 'daycare') {
      const { data: inq } = await supabaseAdmin
        .from('daycare_inquiries')
        .select('id, status, created_at')
        .eq('daycare_id', cleanPartnerId)
        .eq('owner_email', cleanEmail)
        .maybeSingle();

      if (!inq) {
        return { allowed: false, reason: 'No active booking or inquiry found for this partner' };
      }
      if (inq.status === 'revoked') {
        return { allowed: false, reason: 'The pet owner has revoked access for this business' };
      }
      return { allowed: true, status: inq.status };
    }

    if (partnerType === 'sitter') {
      const { data: req } = await supabaseAdmin
        .from('sitting_requests')
        .select('id, status, created_at')
        .eq('sitter_id', cleanPartnerId)
        .eq('owner_email', cleanEmail)
        .maybeSingle();

      if (!req) {
        return { allowed: false, reason: 'No active booking or inquiry found for this partner' };
      }
      if (req.status === 'revoked') {
        return { allowed: false, reason: 'The pet owner has revoked access for this business' };
      }
      return { allowed: true, status: req.status };
    }

    return { allowed: false, reason: 'Unknown partner type' };
  } catch (err: any) {
    console.error('[PetAccess] Error verifying access:', err);
    return { allowed: false, reason: err.message };
  }
}
