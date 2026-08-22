import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// ─── GET /api/vet-boarding/inquiries?clinic_id= ───────────────────────────────
// Returns all inquiry threads for a clinic (used by clinic dashboard)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinic_id = searchParams.get('clinic_id');
    const owner_email = searchParams.get('owner_email');
    const id = searchParams.get('id');

    if (!clinic_id && !owner_email && !id) {
      return NextResponse.json({ error: 'Missing clinic_id, owner_email, or id' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('vet_inquiries')
      .select('*, vet_clinics(clinic_name, email, org_photo_url)')
      .order('created_at', { ascending: false });

    if (id) {
      query = query.eq('id', id);
    } else if (clinic_id) {
      query = query.eq('clinic_id', clinic_id);
    } else if (owner_email) {
      query = query.eq('owner_email', owner_email.toLowerCase().trim());
    }

    const { data: inquiries, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch pets for all owner emails in these inquiries
    const ownerEmails = [...new Set((inquiries || []).map((i: any) => (i.owner_email || '').toLowerCase().trim()).filter(Boolean))];
    const { data: ownerPets } = ownerEmails.length > 0
      ? await supabaseAdmin.from('owner_pets').select('id, owner_email, pet_name, pet_type, photo_url').in('owner_email', ownerEmails)
      : { data: [] };

    const petByEmail = new Map<string, any>();
    (ownerPets || []).forEach((p: any) => {
      const em = (p.owner_email || '').toLowerCase().trim();
      if (!petByEmail.has(em)) {
        petByEmail.set(em, p);
      }
    });

    const enrichedInquiries = await Promise.all(
      (inquiries || []).map(async (inq: any) => {
        const cleanOwner = (inq.owner_email || '').toLowerCase().trim();
        const pet = petByEmail.get(cleanOwner);
        const clinicEmail = inq.vet_clinics?.email?.toLowerCase().trim();
        const { data: msgs } = await supabaseAdmin
          .from('messages')
          .select('id, sender_email, receiver_email, read, message, created_at')
          .eq('booking_id', inq.id)
          .order('created_at', { ascending: false });

        let unreadCount = 0;
        let clinicReplied = inq.status !== 'pending';
        let latestMessage = '';

        if (msgs && msgs.length > 0) {
          latestMessage = msgs[0].message;
          for (const m of msgs) {
            const sender = (m.sender_email || '').toLowerCase().trim();
            if (clinicEmail && sender === clinicEmail) {
              clinicReplied = true;
            }
            if (!m.read && sender !== clinicEmail) {
              unreadCount += 1;
            }
          }
        }

        return {
          ...inq,
          pet_id: pet?.id || null,
          pet_name: pet?.pet_name || null,
          pet_type: pet?.pet_type || null,
          pet_photo: pet?.photo_url || null,
          unread_count: unreadCount,
          clinic_replied: clinicReplied,
          latest_message: latestMessage,
        };
      })
    );

    return NextResponse.json(
      { inquiry: enrichedInquiries[0] || null, inquiries: enrichedInquiries },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST /api/vet-boarding/inquiries — Create inquiry thread ─────────────────
// Called when a pet owner clicks "Inquire" on a vet clinic card.
// Creates a vet_inquiries row, then the ChatModal uses the inquiry id as booking_id
// against the existing /api/petsitting/messages endpoint (which is booking_id-agnostic).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clinic_id, owner_email, pet_id } = body;

    if (!clinic_id || !owner_email) {
      return NextResponse.json({ error: 'Missing clinic_id or owner_email' }, { status: 400 });
    }

    const cleanEmail = owner_email.toLowerCase().trim();

    // Fetch clinic details
    const { data: clinic } = await supabaseAdmin
      .from('vet_clinics')
      .select('email, clinic_name')
      .eq('id', clinic_id)
      .maybeSingle();

    // Check if an inquiry thread already exists for this owner+clinic pair
    const { data: existing } = await supabaseAdmin
      .from('vet_inquiries')
      .select('id')
      .eq('clinic_id', clinic_id)
      .eq('owner_email', cleanEmail)
      .maybeSingle();

    let targetInquiry = existing;

    if (!existing) {
      // Create new inquiry thread
      const { data: inquiry, error } = await supabaseAdmin
        .from('vet_inquiries')
        .insert({ clinic_id, owner_email: cleanEmail, status: 'pending' })
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      targetInquiry = inquiry;
    }

    // Grant or renew profile access if pet_id is provided
    if (pet_id && clinic) {
      const { grantOrRenewPetAccess } = await import('@/lib/petAccessHelper');
      await grantOrRenewPetAccess({
        petId: pet_id,
        ownerEmail: cleanEmail,
        partnerType: 'vet',
        partnerId: clinic_id,
        partnerName: clinic.clinic_name || 'Vet Clinic',
        partnerEmail: clinic.email || '',
      });
    }

    // Notify clinic via in-app notification
    if (clinic?.email && !existing) {
      await supabaseAdmin.from('notifications').insert({
        recipient_email: clinic.email,
        type: 'new_message',
        title: 'New Boarding Inquiry 🏥',
        message: `${cleanEmail} sent a boarding inquiry for their pet — tap to view`,
        link: `/vet-boarding/dashboard?inquiry=${targetInquiry.id}`,
        read: false,
      });
    }

    if (targetInquiry?.id) {
      await supabaseAdmin.from('vet_inquiries').update({ archived: false }).eq('id', targetInquiry.id);
    }

    return NextResponse.json({ inquiry: targetInquiry, existed: !!existing });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── PATCH /api/vet-boarding/inquiries — Archive or restore inquiry ───────────
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, archived } = body;

    if (!id || typeof archived !== 'boolean') {
      return NextResponse.json({ error: 'Missing id or archived status' }, { status: 400 });
    }

    const { data: inquiry, error } = await supabaseAdmin
      .from('vet_inquiries')
      .update({ archived })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ inquiry });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
