import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendAdoptionInquiryEmail } from '@/lib/adoption-email';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pet_id = searchParams.get('pet_id');
    const user_email = searchParams.get('user_email');
    const shelter_email = searchParams.get('shelter_email');

    if (!pet_id) {
      return NextResponse.json({ error: 'Missing pet_id' }, { status: 400 });
    }

    let query = supabaseAdmin.from('adoption_messages').select('*').eq('pet_id', pet_id);

    if (user_email) {
      query = query.or(`sender_email.eq.${user_email},receiver_email.eq.${user_email}`);
    }

    query = query.order('created_at', { ascending: true });

    const { data: messages, error } = await query;

    if (error) {
      console.error('[Adoption Messages API] GET error:', error);
      return NextResponse.json({ messages: [] });
    }

    // Mark unread messages as read
    if (user_email || shelter_email) {
      const activeEmail = (user_email || shelter_email)?.toLowerCase().trim();
      await supabaseAdmin
        .from('adoption_messages')
        .update({ read: true })
        .eq('pet_id', pet_id)
        .eq('receiver_email', activeEmail)
        .eq('read', false);
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pet_id, shelter_id, sender_email, receiver_email, message } = body;

    if (!pet_id || !sender_email || !message) {
      return NextResponse.json({ error: 'Missing required fields (pet_id, sender_email, message)' }, { status: 400 });
    }

    // 1. Check pet status — if adopted, reject posting new messages
    const { data: pet } = await supabaseAdmin
      .from('adoption_pets')
      .select('status, name, shelter_id, shelters(email, org_name)')
      .eq('id', pet_id)
      .single();

    if (pet && pet.status === 'adopted') {
      return NextResponse.json({ error: 'This pet has been adopted. Messaging is closed.' }, { status: 400 });
    }

    let targetReceiver = receiver_email;
    if (!targetReceiver && pet && pet.shelters) {
      const shelterEmail = (pet.shelters as any).email;
      if (sender_email.toLowerCase().trim() === shelterEmail.toLowerCase().trim()) {
        // Sender is shelter, receiver is user — find latest message sender
        const { data: lastMsg } = await supabaseAdmin
          .from('adoption_messages')
          .select('sender_email')
          .eq('pet_id', pet_id)
          .neq('sender_email', shelterEmail)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        targetReceiver = lastMsg ? lastMsg.sender_email : '';
      } else {
        // Sender is user, receiver is shelter
        targetReceiver = shelterEmail;
      }
    }

    const { data: newMsg, error } = await supabaseAdmin
      .from('adoption_messages')
      .insert({
        pet_id,
        shelter_id: shelter_id || pet?.shelter_id,
        sender_email: sender_email.toLowerCase().trim(),
        receiver_email: (targetReceiver || '').toLowerCase().trim(),
        message,
        read: false
      })
      .select('*')
      .single();

    if (error) {
      console.error('[Adoption Messages API] POST error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send email notification to recipient if targetReceiver is available
    if (targetReceiver) {
      sendAdoptionInquiryEmail(
        targetReceiver,
        pet?.name || 'Pet',
        pet_id,
        sender_email,
        message
      );
    }

    return NextResponse.json({ message: newMsg });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
