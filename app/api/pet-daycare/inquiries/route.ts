import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// ─── GET /api/pet-daycare/inquiries?daycare_id= ────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daycare_id = searchParams.get('daycare_id');
    const owner_email = searchParams.get('owner_email');
    const id = searchParams.get('id');

    if (!daycare_id && !owner_email && !id) {
      return NextResponse.json({ error: 'Missing daycare_id, owner_email, or id' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('daycare_inquiries')
      .select('*, pet_daycares(business_name, email, logo_url)')
      .order('created_at', { ascending: false });

    if (id) {
      query = query.eq('id', id);
    } else if (daycare_id) {
      query = query.eq('daycare_id', daycare_id);
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
        const daycareEmail = inq.pet_daycares?.email?.toLowerCase().trim();
        const { data: msgs } = await supabaseAdmin
          .from('messages')
          .select('id, sender_email, receiver_email, read, message, created_at')
          .eq('booking_id', inq.id)
          .order('created_at', { ascending: false });

        let unreadCount = 0;
        let daycareReplied = inq.status !== 'pending';
        let latestMessage = '';

        if (msgs && msgs.length > 0) {
          latestMessage = msgs[0].message;
          for (const m of msgs) {
            const sender = (m.sender_email || '').toLowerCase().trim();
            if (daycareEmail && sender === daycareEmail) {
              daycareReplied = true;
            }
            if (!m.read && sender !== daycareEmail) {
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
          daycare_replied: daycareReplied,
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

// ─── POST /api/pet-daycare/inquiries — Create inquiry thread ──────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { daycare_id, owner_email, pet_id } = body;

    if (!daycare_id || !owner_email) {
      return NextResponse.json({ error: 'Missing daycare_id or owner_email' }, { status: 400 });
    }

    const cleanEmail = owner_email.toLowerCase().trim();

    // Fetch daycare details
    const { data: daycare } = await supabaseAdmin
      .from('pet_daycares')
      .select('email, business_name')
      .eq('id', daycare_id)
      .maybeSingle();

    // Check if an OPEN / ACTIVE inquiry thread already exists for this owner+daycare pair
    // Active states: 'pending', 'accepted', 'confirmed', 'active' (and unarchived)
    // Terminal states ('completed', 'declined', 'no_show', etc.) start a fresh inquiry
    const { data: openInquiries } = await supabaseAdmin
      .from('daycare_inquiries')
      .select('*')
      .eq('daycare_id', daycare_id)
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
        .from('daycare_inquiries')
        .insert({ daycare_id, owner_email: cleanEmail, status: 'pending' })
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      targetInquiry = inquiry;
    }

    // Grant or renew profile access if pet_id is provided
    if (pet_id && daycare) {
      const { grantOrRenewPetAccess } = await import('@/lib/petAccessHelper');
      await grantOrRenewPetAccess({
        petId: pet_id,
        ownerEmail: cleanEmail,
        partnerType: 'daycare',
        partnerId: daycare_id,
        partnerName: daycare.business_name || 'Pet Daycare',
        partnerEmail: daycare.email || '',
      });
    }

    // Notify daycare via in-app notification
    if (daycare?.email && !existing) {
      await supabaseAdmin.from('notifications').insert({
        recipient_email: daycare.email,
        type: 'new_message',
        title: 'New Daycare Inquiry 🐕',
        message: `${cleanEmail} sent a daycare inquiry for their pet — tap to view`,
        link: `/pet-daycare/dashboard?inquiry=${targetInquiry.id}`,
        read: false,
      });
    }

    if (targetInquiry?.id) {
      await supabaseAdmin.from('daycare_inquiries').update({ archived: false }).eq('id', targetInquiry.id);
    }

    return NextResponse.json({ inquiry: targetInquiry, existed: !!existing });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── PATCH /api/pet-daycare/inquiries — Lifecycle actions or Archive/Restore ─
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, archived } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing inquiry id' }, { status: 400 });
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
      .from('daycare_inquiries')
      .update(updatePayload)
      .eq('id', id)
      .select('*, pet_daycares(business_name, email)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger owner notification for status changes
    if (['accept', 'decline', 'complete', 'no_show'].includes(action) && inquiry?.owner_email) {
      try {
        const daycareName = (inquiry.pet_daycares as any)?.business_name || 'Pet Daycare';
        let notifTitle = 'Daycare Inquiry Updated 🐾';
        let notifMessage = `Your daycare inquiry with ${daycareName} has been updated.`;

        if (action === 'accept') {
          notifTitle = 'Daycare Inquiry Accepted! 🎉';
          notifMessage = `Great news! ${daycareName} has accepted your pet daycare request.`;
        } else if (action === 'decline') {
          notifTitle = 'Daycare Inquiry Declined';
          notifMessage = `${daycareName} was unable to accept your pet daycare request.`;
        } else if (action === 'complete') {
          notifTitle = 'Daycare Stay Completed! 🎉';
          notifMessage = `Your pet's daycare visit with ${daycareName} has been marked as completed.`;
        } else if (action === 'no_show') {
          notifTitle = 'Appointment Marked as No Show';
          notifMessage = `Your appointment with ${daycareName} was marked as no-show.`;
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
        console.warn('[Daycare Inquiry PATCH] Notification warning:', notifErr);
      }
    }

    return NextResponse.json({ success: true, inquiry });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
