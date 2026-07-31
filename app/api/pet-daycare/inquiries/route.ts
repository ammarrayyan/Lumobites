import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// ─── GET /api/pet-daycare/inquiries?daycare_id= ────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daycare_id = searchParams.get('daycare_id');
    const owner_email = searchParams.get('owner_email');

    if (!daycare_id && !owner_email) {
      return NextResponse.json({ error: 'Missing daycare_id or owner_email' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('daycare_inquiries')
      .select('*, pet_daycares(business_name, email, logo_url)')
      .order('created_at', { ascending: false });

    if (daycare_id) {
      query = query.eq('daycare_id', daycare_id);
    } else if (owner_email) {
      query = query.eq('owner_email', owner_email.toLowerCase().trim());
    }

    const { data: inquiries, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const enrichedInquiries = await Promise.all(
      (inquiries || []).map(async (inq: any) => {
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
          unread_count: unreadCount,
          daycare_replied: daycareReplied,
          latest_message: latestMessage,
        };
      })
    );

    return NextResponse.json({ inquiries: enrichedInquiries }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST /api/pet-daycare/inquiries — Create inquiry thread ──────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { daycare_id, owner_email } = body;

    if (!daycare_id || !owner_email) {
      return NextResponse.json({ error: 'Missing daycare_id or owner_email' }, { status: 400 });
    }

    const cleanEmail = owner_email.toLowerCase().trim();

    // Check if an inquiry thread already exists for this owner+daycare pair
    const { data: existing } = await supabaseAdmin
      .from('daycare_inquiries')
      .select('id')
      .eq('daycare_id', daycare_id)
      .eq('owner_email', cleanEmail)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ inquiry: existing, existed: true });
    }

    // Create new inquiry thread
    const { data: inquiry, error } = await supabaseAdmin
      .from('daycare_inquiries')
      .insert({ daycare_id, owner_email: cleanEmail, status: 'pending' })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Notify daycare via in-app notification
    const { data: daycare } = await supabaseAdmin
      .from('pet_daycares')
      .select('email, business_name')
      .eq('id', daycare_id)
      .maybeSingle();

    if (daycare?.email) {
      await supabaseAdmin.from('notifications').insert({
        recipient_email: daycare.email,
        type: 'new_message',
        title: 'New Daycare Inquiry 🐕',
        message: `${cleanEmail} sent a daycare inquiry for their pet — tap to view`,
        link: `/pet-daycare/dashboard?inquiry=${inquiry.id}`,
        read: false,
      });
    }

    return NextResponse.json({ inquiry, existed: false });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
