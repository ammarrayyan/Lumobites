import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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
      .select('id, sitter_id, owner_email, pet_id, status, created_at, sitters(first_name, last_name, email, profile_photo_url)')
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
      unifiedGrants.push({
        id: inq.id,
        partner_id: inq.clinic_id,
        partner_type: 'vet',
        partner_name: clinic?.clinic_name || 'Vet Clinic',
        partner_email: clinic?.email || '',
        owner_email: inq.owner_email,
        pet_id: inq.pet_id || pet?.id,
        owner_pets: pet,
        status: inq.status || 'active',
        effective_status: inq.status === 'revoked' ? 'revoked' : 'active',
        granted_at: inq.created_at,
        last_activity_at: inq.created_at
      });
    });

    (daycareInquiries || []).forEach(inq => {
      const daycare = (inq as any).pet_daycares;
      const pet = petMap.get(inq.pet_id) || (pets && pets.length > 0 ? pets[0] : null);
      unifiedGrants.push({
        id: inq.id,
        partner_id: inq.daycare_id,
        partner_type: 'daycare',
        partner_name: daycare?.business_name || 'Pet Daycare',
        partner_email: daycare?.email || '',
        owner_email: inq.owner_email,
        pet_id: inq.pet_id || pet?.id,
        owner_pets: pet,
        status: inq.status || 'active',
        effective_status: inq.status === 'revoked' ? 'revoked' : 'active',
        granted_at: inq.created_at,
        last_activity_at: inq.created_at
      });
    });

    (sittingRequests || []).forEach(req => {
      const sitter = (req as any).sitters;
      const pet = petMap.get(req.pet_id) || (pets && pets.length > 0 ? pets[0] : null);
      const sitterName = sitter ? `${sitter.first_name} ${sitter.last_name || ''}`.trim() : 'Pet Sitter';
      unifiedGrants.push({
        id: req.id,
        partner_id: req.sitter_id,
        partner_type: 'sitter',
        partner_name: sitterName || 'Pet Sitter',
        partner_email: sitter?.email || '',
        owner_email: req.owner_email,
        pet_id: req.pet_id || pet?.id,
        owner_pets: pet,
        status: req.status || 'active',
        effective_status: req.status === 'revoked' ? 'revoked' : 'active',
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

// POST /api/pets/access — Owner revokes or modifies access for a specific business
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { access_id, partner_id, partner_type, owner_email, action } = body; // action: 'revoke' | 'restore'

    if ((!access_id && !partner_id) || !owner_email || !action) {
      return NextResponse.json({ error: 'Access ID or Partner ID, owner email, and action are required' }, { status: 400 });
    }

    const cleanEmail = owner_email.toLowerCase().trim();
    const newStatus = action === 'revoke' ? 'revoked' : 'active';

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

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err: any) {
    console.error('[Pet Access POST] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
