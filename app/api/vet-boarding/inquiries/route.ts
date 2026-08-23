import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getVerifiedSessionEmail } from '@/lib/accountAuth';

export const dynamic = 'force-dynamic';

// ─── GET /api/vet-boarding/inquiries?clinic_id= ───────────────────────────────
// Returns all inquiry threads for a clinic (used by clinic dashboard)
export async function GET(request: NextRequest) {
  try {
    const verifiedEmail = await getVerifiedSessionEmail(request);
    if (!verifiedEmail) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in with your verified account.', requires_auth: true },
        { status: 401 }
      );
    }

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
      // Verify that clinic_id belongs to verifiedEmail
      const { data: clinicCheck } = await supabaseAdmin
        .from('vet_clinics')
        .select('id, email')
        .eq('id', clinic_id)
        .maybeSingle();

      if (!clinicCheck || clinicCheck.email.toLowerCase().trim() !== verifiedEmail) {
        return NextResponse.json({ error: 'Forbidden: You do not have access to these clinic inquiries.' }, { status: 403 });
      }
      query = query.eq('clinic_id', clinic_id);
    } else if (owner_email) {
      if (owner_email.toLowerCase().trim() !== verifiedEmail) {
        return NextResponse.json({ error: 'Forbidden: You do not have access to these owner inquiries.' }, { status: 403 });
      }
      query = query.eq('owner_email', verifiedEmail);
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

    // Check if an OPEN / ACTIVE inquiry thread already exists for this owner+clinic pair
    // Active states: 'pending', 'accepted', 'confirmed', 'active' (and unarchived)
    // Terminal states ('completed', 'declined', 'no_show', etc.) start a fresh inquiry
    const { data: openInquiries } = await supabaseAdmin
      .from('vet_inquiries')
      .select('*')
      .eq('clinic_id', clinic_id)
      .eq('owner_email', cleanEmail)
      .in('status', ['pending', 'accepted', 'confirmed', 'active'])
      .eq('archived', false)
      .order('created_at', { ascending: false })
      .limit(1);

    const existing = openInquiries && openInquiries.length > 0 ? openInquiries[0] : null;

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

// ─── PATCH /api/vet-boarding/inquiries — Lifecycle actions or Archive/Restore ─
export async function PATCH(request: NextRequest) {
  try {
    const verifiedEmail = await getVerifiedSessionEmail(request);
    if (!verifiedEmail) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in with your verified account.', requires_auth: true },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, action, archived } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing inquiry id' }, { status: 400 });
    }

    // Verify user owns this inquiry as clinic or owner
    const { data: existingInq } = await supabaseAdmin
      .from('vet_inquiries')
      .select('*, vet_clinics(email)')
      .eq('id', id)
      .maybeSingle();

    if (!existingInq) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    const isClinic = existingInq.vet_clinics?.email?.toLowerCase().trim() === verifiedEmail;
    const isOwner = existingInq.owner_email?.toLowerCase().trim() === verifiedEmail;

    if (!isClinic && !isOwner) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to modify this inquiry.' }, { status: 403 });
    }

    const updatePayload: any = {};

    if (action === 'accept') {
      updatePayload.status = 'accepted';
    } else if (action === 'decline') {
      updatePayload.status = 'declined';
    } else if (action === 'complete') {
      updatePayload.status = 'completed';
    } else if (action === 'no_show') {
      updatePayload.status = 'no_show';
    } else if (action === 'archive') {
      updatePayload.archived = true;
    } else if (action === 'restore') {
      updatePayload.archived = false;
    } else if (typeof archived === 'boolean') {
      updatePayload.archived = archived;
    } else {
      return NextResponse.json({ error: 'Valid action or archived status is required' }, { status: 400 });
    }

    const { data: inquiry, error } = await supabaseAdmin
      .from('vet_inquiries')
      .update(updatePayload)
      .eq('id', id)
      .select('*, vet_clinics(clinic_name, email)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger owner notification for status changes
    if (['accept', 'decline', 'complete', 'no_show'].includes(action) && inquiry?.owner_email) {
      try {
        const clinicName = (inquiry.vet_clinics as any)?.clinic_name || 'Vet Clinic';
        let notifTitle = 'Boarding Inquiry Updated 🐾';
        let notifMessage = `Your boarding inquiry with ${clinicName} has been updated.`;

        if (action === 'accept') {
          notifTitle = 'Boarding Inquiry Accepted! 🎉';
          notifMessage = `Great news! ${clinicName} has accepted your veterinary boarding request.`;
        } else if (action === 'decline') {
          notifTitle = 'Boarding Inquiry Declined';
          notifMessage = `${clinicName} was unable to accept your veterinary boarding request.`;
        } else if (action === 'complete') {
          notifTitle = 'Boarding Stay Completed! 🎉';
          notifMessage = `Your boarding stay with ${clinicName} has been marked as completed.`;
        } else if (action === 'no_show') {
          notifTitle = 'Appointment Marked as No Show';
          notifMessage = `Your appointment with ${clinicName} was marked as no-show.`;
        }

        await supabaseAdmin.from('notifications').insert({
          recipient_email: inquiry.owner_email.toLowerCase().trim(),
          type: 'pet_access_decision',
          title: notifTitle,
          message: notifMessage,
          link: `/petsitting?booking=${inquiry.id}&tab=owner`,
          booking_id: inquiry.id,
          read: false,
        });
      } catch (notifErr) {
        console.warn('[Vet Inquiry PATCH] Notification warning:', notifErr);
      }
    }

    return NextResponse.json({ success: true, inquiry });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
