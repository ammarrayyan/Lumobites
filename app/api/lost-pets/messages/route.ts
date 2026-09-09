import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendPushNotification } from '@/lib/push';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lost_pet_id = searchParams.get('lost_pet_id') || searchParams.get('pet_id') || searchParams.get('booking_id');
    const user_email = searchParams.get('user_email');
    const owner_email = searchParams.get('owner_email');
    const email = searchParams.get('email');

    if (!lost_pet_id) {
      return NextResponse.json({ error: 'Missing lost_pet_id' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('messages')
      .select('*')
      .eq('booking_id', lost_pet_id)
      .order('created_at', { ascending: true });

    const cleanUser = user_email ? user_email.toLowerCase().trim() : '';
    const cleanOwner = owner_email ? owner_email.toLowerCase().trim() : '';
    const cleanCurrent = email ? email.toLowerCase().trim() : '';

    if (cleanUser && cleanOwner) {
      query = query.or(
        `and(sender_email.eq.${cleanUser},receiver_email.eq.${cleanOwner}),and(sender_email.eq.${cleanOwner},receiver_email.eq.${cleanUser})`
      );
    } else if (cleanCurrent) {
      query = query.or(`sender_email.eq.${cleanCurrent},receiver_email.eq.${cleanCurrent}`);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('[Lost Pets Messages GET Error]:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mark as read for the requesting user
    const readerEmail = cleanCurrent || cleanUser;
    if (readerEmail) {
      await supabaseAdmin
        .from('messages')
        .update({ read: true })
        .eq('booking_id', lost_pet_id)
        .eq('receiver_email', readerEmail)
        .eq('read', false);
    }

    return NextResponse.json(
      { messages: messages || [] },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } }
    );
  } catch (error: any) {
    console.error('[Lost Pets Messages GET Exception]:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const lost_pet_id = body.lost_pet_id || body.pet_id || body.booking_id;
    const sender_email = (body.sender_email || '').toLowerCase().trim();
    let receiver_email = (body.receiver_email || '').toLowerCase().trim();
    const message = (body.message || '').trim();

    if (!lost_pet_id || !sender_email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch lost pet details to resolve receiver email if not supplied
    const { data: pet, error: petErr } = await supabaseAdmin
      .from('lost_pets')
      .select('id, pet_name, species, type, contact_email, city')
      .eq('id', lost_pet_id)
      .maybeSingle();

    if (petErr) {
      console.error('[Lost Pets Messages POST Pet Fetch Error]:', petErr);
    }

    if (!receiver_email && pet?.contact_email) {
      const petOwnerEmail = pet.contact_email.toLowerCase().trim();
      if (sender_email === petOwnerEmail) {
        // If sender is pet poster, we need receiver from payload or recent thread
        const { data: lastThreadMsg } = await supabaseAdmin
          .from('messages')
          .select('sender_email')
          .eq('booking_id', lost_pet_id)
          .neq('sender_email', petOwnerEmail)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastThreadMsg?.sender_email) {
          receiver_email = lastThreadMsg.sender_email.toLowerCase().trim();
        }
      } else {
        receiver_email = petOwnerEmail;
      }
    }

    if (!receiver_email) {
      return NextResponse.json({ error: 'Could not determine receiver email' }, { status: 400 });
    }

    if (sender_email === receiver_email) {
      return NextResponse.json({ error: 'Sender and receiver cannot be the same' }, { status: 400 });
    }

    // 1. Insert message into messages table
    const { data: newMessage, error: insertError } = await supabaseAdmin
      .from('messages')
      .insert({
        booking_id: String(lost_pet_id),
        sender_email,
        receiver_email,
        message,
        read: false,
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('[Lost Pets Messages POST Insert Error]:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 2. Dispatch Notifications (In-App & Push)
    const petLabel = pet?.pet_name ? `${pet.pet_name} (${pet.species || 'pet'})` : (pet?.species || 'Lost Pet');
    const notifTitle = `New message about ${petLabel} 🐾`;
    const snippet = message.length > 90 ? `${message.slice(0, 90)}...` : message;
    const deepLink = `/lost-pets/${lost_pet_id}?chat=1`;

    try {
      await supabaseAdmin.from('notifications').insert({
        recipient_email: receiver_email,
        type: 'new_message',
        title: notifTitle,
        message: snippet,
        link: deepLink,
        booking_id: String(lost_pet_id),
        read: false,
      });
    } catch (notifErr) {
      console.error('[Lost Pets Messages In-App Notif Error]:', notifErr);
    }

    try {
      await sendPushNotification(
        receiver_email,
        notifTitle,
        snippet,
        deepLink,
        { type: 'lost_pet_message', petId: String(lost_pet_id) }
      );
    } catch (pushErr) {
      console.error('[Lost Pets Messages Push Notif Error]:', pushErr);
    }

    return NextResponse.json({ message: newMessage });
  } catch (error: any) {
    console.error('[Lost Pets Messages POST Exception]:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
