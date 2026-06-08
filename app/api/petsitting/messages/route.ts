import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendPushNotification } from '@/lib/push';
import { Resend } from 'resend';
import { brandedEmail, emailStyles } from '@/lib/email-template';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const booking_id = searchParams.get('booking_id');
    const email = searchParams.get('email');

    if (!booking_id) {
      return NextResponse.json({ error: 'Missing booking_id' }, { status: 400 });
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('booking_id', booking_id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mark as read if user is provided
    if (email) {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('booking_id', booking_id)
        .eq('receiver_email', email)
        .eq('read', false);
    }

    return NextResponse.json({ messages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { booking_id, sender_email, message } = body;
    let { receiver_email } = body;

    if (!booking_id || !sender_email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Lookup receiver if not provided
    if (!receiver_email) {
      const { data: booking } = await supabase.from('sitting_requests').select('owner_email, sitter_id').eq('id', booking_id).single();
      if (booking) {
        if (sender_email === booking.owner_email) {
          // Sender is owner, receiver is sitter
          const { data: sitter } = await supabase.from('sitters').select('email').eq('id', booking.sitter_id).single();
          if (sitter) receiver_email = sitter.email;
        } else {
          // Sender is sitter, receiver is owner
          receiver_email = booking.owner_email;
        }
      }
    }

    if (!receiver_email) {
      return NextResponse.json({ error: 'Could not determine receiver email' }, { status: 400 });
    }

    // 1. Save to messages table
    const { data: newMessage, error: insertError } = await supabase
      .from('messages')
      .insert({
        booking_id,
        sender_email,
        receiver_email,
        message,
        read: false
      })
      .select('*')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 2. Create notification for receiver
    let senderName = sender_email.split('@')[0];
    
    // Attempt to get sender's actual name
    const { data: sitterData } = await supabase.from('sitters').select('name').eq('email', sender_email).single();
    if (sitterData && sitterData.name) {
      senderName = sitterData.name;
    } else {
      const { data: reqData } = await supabase.from('sitting_requests').select('owner_name').eq('owner_email', sender_email).single();
      if (reqData && reqData.owner_name) {
        senderName = reqData.owner_name;
      }
    }

    const msgPreview = message.length > 40 ? message.substring(0, 40) + '...' : message;
    
    await supabase.from('notifications').insert({
      recipient_email: receiver_email,
      type: 'new_message',
      title: 'New Message 💬',
      message: `${senderName}: ${msgPreview}`,
      link: `/petsitting?booking=${booking_id}`,
      read: false
    });

    // 3. Send fallback email
    // Check if we already have the sender name nicely formatted
    // Send email using Resend
    const origin = request.nextUrl.origin;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
    
    await resend.emails.send({
      from: fromEmail,
      to: receiver_email,
      replyTo: sender_email,
      subject: 'New message on Lumo Bites — lumobites.net/petsitting',
      html: brandedEmail({
        subject: 'You have a new message!',
        preheader: `${senderName} sent you a message regarding a booking.`,
        body: `
          <h1 style="${emailStyles.h1}">New Message Received 💬</h1>
          <p style="${emailStyles.p}"><strong>${senderName}</strong> says:</p>
          ${emailStyles.infoBox(`
            <p style="margin:0;font-size:15px;color:#4A3728;font-style:italic;">"${message}"</p>
          `)}
          <br/>
          <div style="text-align:center;margin:32px 0;">
            <a href="${origin}/petsitting" style="background-color:#8B5E3C;color:#FFFFFF;font-weight:700;font-size:14px;text-decoration:none;padding:12px 24px;border-radius:10px;display:inline-block;">Reply on Lumo Bites</a>
          </div>
          ${emailStyles.signoff}
        `
      })
    });

    return NextResponse.json({ message: newMessage });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
