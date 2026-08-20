import { supabaseAdmin } from '@/lib/supabase';

export interface GrantPetAccessParams {
  petId: string;
  ownerEmail: string;
  partnerType: 'vet' | 'daycare' | 'sitter';
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
}

/**
 * Grants or renews live pet profile access for a partner upon a booking or inquiry.
 * - If no access row exists: Creates a new active access grant and notifies the owner.
 * - If access row exists and is active/dormant: Renews status to 'active' and updates last_activity_at.
 * - If manually revoked by owner: Respects revocation and does NOT auto-grant.
 */
export async function grantOrRenewPetAccess(params: GrantPetAccessParams): Promise<{ success: boolean; status?: string }> {
  try {
    const { petId, ownerEmail, partnerType, partnerId, partnerName, partnerEmail } = params;

    if (!petId || !ownerEmail || !partnerId) {
      return { success: false };
    }

    const cleanOwnerEmail = ownerEmail.toLowerCase().trim();
    const cleanPartnerEmail = (partnerEmail || '').toLowerCase().trim();

    // Fetch existing grant
    const { data: existingGrant } = await supabaseAdmin
      .from('pet_profile_access')
      .select('*')
      .eq('pet_id', petId)
      .eq('partner_id', partnerId)
      .eq('partner_type', partnerType)
      .maybeSingle();

    if (existingGrant) {
      // If owner manually revoked access, do not override unless re-granted by owner
      if (existingGrant.status === 'revoked') {
        console.log(`[PetAccess] Grant for partner ${partnerId} is manually revoked by owner. Skipping auto-grant.`);
        return { success: true, status: 'revoked' };
      }

      // Renew activity and activate
      await supabaseAdmin
        .from('pet_profile_access')
        .update({
          status: 'active',
          last_activity_at: new Date().toISOString(),
          partner_name: partnerName || existingGrant.partner_name,
          partner_email: cleanPartnerEmail || existingGrant.partner_email,
        })
        .eq('id', existingGrant.id);

      return { success: true, status: 'active' };
    }

    // Insert new access grant
    const { data: newGrant, error: insertErr } = await supabaseAdmin
      .from('pet_profile_access')
      .insert({
        pet_id: petId,
        owner_email: cleanOwnerEmail,
        partner_type: partnerType,
        partner_id: partnerId,
        partner_name: partnerName || 'Service Partner',
        partner_email: cleanPartnerEmail,
        status: 'active',
        granted_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertErr) {
      console.error('[PetAccess] Error inserting access grant:', insertErr.message);
      return { success: false };
    }

    // Fetch pet name for transparent notification
    const { data: pet } = await supabaseAdmin
      .from('owner_pets')
      .select('pet_name')
      .eq('id', petId)
      .maybeSingle();

    const petName = pet?.pet_name || 'your pet';
    const typeLabel = partnerType === 'vet' ? 'Vet Clinic' : partnerType === 'daycare' ? 'Daycare Facility' : 'Pet Sitter';

    // Send in-app notification to pet owner
    await supabaseAdmin.from('notifications').insert({
      recipient_email: cleanOwnerEmail,
      type: 'system',
      title: 'Pet Profile Access Granted 🐾',
      message: `${partnerName} (${typeLabel}) now has active access to ${petName}'s profile. Manage access anytime in your Account settings.`,
      link: '/account?tab=pets',
      read: false,
    });

    return { success: true, status: 'active' };
  } catch (err: any) {
    console.error('[PetAccess] Exception in grantOrRenewPetAccess:', err);
    return { success: false };
  }
}
