import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getVerifiedSessionEmail } from '@/lib/accountAuth';

export const dynamic = 'force-dynamic';

// GET /api/pets/access?owner_email= — List all access grants for an owner's pets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerEmail = searchParams.get('owner_email');

    if (!ownerEmail) {
      return NextResponse.json({ error: 'Owner email is required' }, { status: 400 });
    }

    const cleanEmail = ownerEmail.toLowerCase().trim();

    const verifiedEmail = await getVerifiedSessionEmail(request);
    if (!verifiedEmail || verifiedEmail !== cleanEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch vet inquiries
    const { data: vetInquiries } = await supabaseAdmin
      .from('vet_inquiries')
      .select('id, clinic_id, owner_email, pet_id, status, created_at, vet_clinics(clinic_name, email, org_photo_url)')
      .eq('owner_email', cleanEmail)
      .order('created_at', { ascending: false });

    // 2. Fetch daycare inquiries
    const { data: daycareInquiries } = await supabaseAdmin
      .from('daycare_inquiries')
      .select('id, daycare_id, owner_email, pet_id, status, created_at, pet_daycares(business_name, email, logo_url)')
      .eq('owner_email', cleanEmail)
      .order('created_at', { ascending: false });

    // 3. Fetch sitting requests
    const { data: sittingRequests } = await supabaseAdmin
      .from('sitting_requests')
      .select('id, sitter_id, owner_email, pet_id, status, created_at, sitters(name, email, photo_url)')
      .eq('owner_email', cleanEmail)
      .order('created_at', { ascending: false });

    // 4. Fetch pets for metadata
    const { data: pets } = await supabaseAdmin
      .from('owner_pets')
      .select('id, pet_name, pet_type, photo_url')
      .eq('owner_email', cleanEmail);

    const petMap = new Map((pets || []).map(p => [p.id, p]));

    const unifiedGrants: any[] = [];

    (vetInquiries || []).forEach(inq => {
      const clinic = (inq as any).vet_clinics;
      const pet = petMap.get(inq.pet_id) || (pets && pets.length > 0 ? pets[0] : null);
      const st = inq.status || 'pending';
      const isGrantActive = ['active', 'accepted', 'confirmed', 'completed', 'no_show'].includes(st);
      unifiedGrants.push({
        id: inq.id,
        partner_id: inq.clinic_id,
        partner_type: 'vet',
        partner_name: clinic?.clinic_name || 'Vet Clinic',
        partner_email: clinic?.email || '',
        owner_email: inq.owner_email,
        pet_id: inq.pet_id || pet?.id,
        owner_pets: pet,
        status: st,
        effective_status: st === 'revoked' ? 'revoked' : st === 'denied' ? 'denied' : isGrantActive ? 'active' : 'pending',
        granted_at: inq.created_at,
        last_activity_at: inq.created_at
      });
    });

    (daycareInquiries || []).forEach(inq => {
      const daycare = (inq as any).pet_daycares;
      const pet = petMap.get(inq.pet_id) || (pets && pets.length > 0 ? pets[0] : null);
      const st = inq.status || 'pending';
      const isGrantActive = ['active', 'accepted', 'confirmed', 'completed', 'no_show'].includes(st);
      unifiedGrants.push({
        id: inq.id,
        partner_id: inq.daycare_id,
        partner_type: 'daycare',
        partner_name: daycare?.business_name || 'Pet Daycare',
        partner_email: daycare?.email || '',
        owner_email: inq.owner_email,
        pet_id: inq.pet_id || pet?.id,
        owner_pets: pet,
        status: st,
        effective_status: st === 'revoked' ? 'revoked' : st === 'denied' ? 'denied' : isGrantActive ? 'active' : 'pending',
        granted_at: inq.created_at,
        last_activity_at: inq.created_at
      });
    });

    (sittingRequests || []).forEach(req => {
      const sitter = (req as any).sitters;
      const pet = petMap.get(req.pet_id) || (pets && pets.length > 0 ? pets[0] : null);
      const sitterName = sitter?.name || 'Pet Sitter';
      const st = req.status || 'pending';
      const isGrantActive = ['active', 'accepted', 'confirmed', 'completed', 'no_show'].includes(st);
      unifiedGrants.push({
        id: req.id,
        partner_id: req.sitter_id,
        partner_type: 'sitter',
        partner_name: sitterName || 'Pet Sitter',
        partner_email: sitter?.email || '',
        owner_email: req.owner_email,
        pet_id: req.pet_id || pet?.id,
        owner_pets: pet,
        status: st,
        effective_status: st === 'revoked' ? 'revoked' : st === 'denied' ? 'denied' : isGrantActive ? 'active' : 'pending',
        granted_at: req.created_at,
        last_activity_at: req.created_at
      });
    });

    return NextResponse.json({ success: true, grants: unifiedGrants });
  } catch (err: any) {
    console.error('[Pet Access GET] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// POST /api/pets/access — Owner approves, denies, revokes, or restores access for a specific business
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { access_id, partner_id, partner_type, owner_email, action } = body; // action: 'approve' | 'deny' | 'revoke' | 'restore'

    if ((!access_id && !partner_id) || !owner_email || !action) {
      return NextResponse.json({ error: 'Access ID or Partner ID, owner email, and action are required' }, { status: 400 });
    }

    const cleanEmail = owner_email.toLowerCase().trim();

    const verifiedEmail = await getVerifiedSessionEmail(request);
    if (!verifiedEmail || verifiedEmail !== cleanEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const newStatus = action === 'approve' || action === 'restore' ? 'active' : action === 'deny' ? 'denied' : 'revoked';

    if (partner_type === 'vet') {
      if (access_id) {
        await supabaseAdmin.from('vet_inquiries').update({ status: newStatus }).eq('id', access_id).eq('owner_email', cleanEmail);
      } else if (partner_id) {
        await supabaseAdmin.from('vet_inquiries').update({ status: newStatus }).eq('clinic_id', String(partner_id)).eq('owner_email', cleanEmail);
      }
    } else if (partner_type === 'daycare') {
      if (access_id) {
        await supabaseAdmin.from('daycare_inquiries').update({ status: newStatus }).eq('id', access_id).eq('owner_email', cleanEmail);
      } else if (partner_id) {
        await supabaseAdmin.from('daycare_inquiries').update({ status: newStatus }).eq('daycare_id', String(partner_id)).eq('owner_email', cleanEmail);
      }
    } else if (partner_type === 'sitter') {
      if (access_id) {
        await supabaseAdmin.from('sitting_requests').update({ status: newStatus }).eq('id', access_id).eq('owner_email', cleanEmail);
      } else if (partner_id) {
        await supabaseAdmin.from('sitting_requests').update({ status: newStatus }).eq('sitter_id', String(partner_id)).eq('owner_email', cleanEmail);
      }
    } else {
      // Try updating by ID across tables
      if (access_id) {
        await Promise.all([
          supabaseAdmin.from('vet_inquiries').update({ status: newStatus }).eq('id', access_id).eq('owner_email', cleanEmail),
          supabaseAdmin.from('daycare_inquiries').update({ status: newStatus }).eq('id', access_id).eq('owner_email', cleanEmail),
          supabaseAdmin.from('sitting_requests').update({ status: newStatus }).eq('id', access_id).eq('owner_email', cleanEmail),
        ]);
      }
    }

    // Notify the business partner about the owner's decision
    try {
      let partnerEmail = '';
      let partnerDashboardLink = '/petsitting';

      if (partner_type === 'vet') {
        let clinic = null;
        if (partner_id) {
          const { data } = await supabaseAdmin.from('vet_clinics').select('clinic_name, email').eq('id', partner_id).maybeSingle();
          clinic = data;
        } else if (access_id) {
          const { data: inq } = await supabaseAdmin.from('vet_inquiries').select('clinic_id, vet_clinics(clinic_name, email)').eq('id', access_id).maybeSingle();
          clinic = inq?.vet_clinics as any;
        }
        if (clinic?.email) {
          partnerEmail = clinic.email.toLowerCase().trim();
          partnerDashboardLink = access_id ? `/vet-boarding/dashboard?inquiry=${access_id}` : '/vet-boarding/dashboard';
        }
      } else if (partner_type === 'daycare') {
        let daycare = null;
        if (partner_id) {
          const { data } = await supabaseAdmin.from('pet_daycares').select('business_name, email').eq('id', partner_id).maybeSingle();
          daycare = data;
        } else if (access_id) {
          const { data: inq } = await supabaseAdmin.from('daycare_inquiries').select('daycare_id, pet_daycares(business_name, email)').eq('id', access_id).maybeSingle();
          daycare = inq?.pet_daycares as any;
        }
        if (daycare?.email) {
          partnerEmail = daycare.email.toLowerCase().trim();
          partnerDashboardLink = access_id ? `/pet-daycare/dashboard?inquiry=${access_id}` : '/pet-daycare/dashboard';
        }
      } else if (partner_type === 'sitter') {
        let sitter = null;
        if (partner_id) {
          const { data } = await supabaseAdmin.from('sitters').select('name, email').eq('id', partner_id).maybeSingle();
          sitter = data;
        } else if (access_id) {
          const { data: req } = await supabaseAdmin.from('sitting_requests').select('sitter_id, sitters(name, email)').eq('id', access_id).maybeSingle();
          sitter = req?.sitters as any;
        }
        if (sitter?.email) {
          partnerEmail = sitter.email.toLowerCase().trim();
          partnerDashboardLink = access_id ? `/petsitting/messages/${access_id}` : '/petsitting';
        }
      }

      if (partnerEmail) {
        const { data: pet } = await supabaseAdmin.from('owner_pets').select('pet_name').eq('owner_email', cleanEmail).limit(1).maybeSingle();
        const petLabel = pet?.pet_name ? `${pet.pet_name}'s` : "their pet's";

        let notifTitle = 'Pet Profile Access Updated 🐾';
        let notifMessage = `${cleanEmail} updated access to ${petLabel} profile.`;

        if (action === 'approve' || action === 'restore') {
          notifTitle = 'Pet Profile Access Approved 🐾';
          notifMessage = `${cleanEmail} approved access to ${petLabel} live profile. Full care and medical records are now unlocked.`;
        } else if (action === 'deny') {
          notifTitle = 'Pet Profile Access Declined ❌';
          notifMessage = `${cleanEmail} declined access to ${petLabel} profile.`;
        } else if (action === 'revoke') {
          notifTitle = 'Pet Profile Access Revoked ⚠️';
          notifMessage = `${cleanEmail} revoked access to ${petLabel} profile.`;
        }

        await supabaseAdmin.from('notifications').insert({
          recipient_email: partnerEmail,
          type: 'pet_access_decision',
          title: notifTitle,
          message: notifMessage,
          link: partnerDashboardLink,
          read: false,
        });
      }
    } catch (notifErr) {
      console.warn('[Pet Access POST] Error creating partner notification:', notifErr);
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err: any) {
    console.error('[Pet Access POST] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
