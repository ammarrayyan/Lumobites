import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendPushNotification } from '@/lib/push';
import { Resend } from 'resend';
import { brandedEmail, emailStyles, formatSitterName } from '@/lib/email-template';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email } = body;

    if (!id || !email) {
      return NextResponse.json({ error: 'Missing booking ID or email' }, { status: 400 });
    }

    // 1. Fetch current request status and details
    const { data: reqRow, error: reqError } = await supabaseAdmin
      .from('sitting_requests')
      .select('*, sitters(name, email)')
      .eq('id', id)
      .single();

    if (reqError || !reqRow) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Authorization check
    if (reqRow.owner_email.toLowerCase().trim() !== email.toLowerCase().trim()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (reqRow.status !== 'accepted') {
      return NextResponse.json({ error: 'Only accepted bookings can be confirmed completed' }, { status: 400 });
    }

    // 2. Update booking status
    const { error: updateError } = await supabaseAdmin
      .from('sitting_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        review_sent: true
      })
      .eq('id', id);

    if (updateError) {
      console.error('[Confirm Completed] Update Request Error:', updateError);
      return NextResponse.json({ error: 'Failed to update booking status' }, { status: 500 });
    }

    const sitterId = reqRow.sitter_id;
    const sitterName = formatSitterName(reqRow.sitters?.name);
    const sitterEmail = reqRow.sitters?.email;
    const petName = reqRow.pet_name || 'your pet';
    const ownerEmail = reqRow.owner_email ? reqRow.owner_email.toLowerCase().trim() : '';

    // 3. Fetch sitter current completed bookings count and increment
    const { data: sitterRow, error: sitterError } = await supabaseAdmin
      .from('sitters')
      .select('completed_bookings')
      .eq('id', sitterId)
      .single();

    if (!sitterError && sitterRow) {
      const nextCount = (sitterRow.completed_bookings || 0) + 1;
      const { error: sitterUpdateError } = await supabaseAdmin
        .from('sitters')
        .update({ completed_bookings: nextCount })
        .eq('id', sitterId);

      if (sitterUpdateError) {
        console.error('[Confirm Completed] Increment Sitter Count Error:', sitterUpdateError);
      }
    }

    // 4. Send immediate review-request notification & push to the pet owner
    if (ownerEmail && sitterId) {
      const reviewLink = `/petsitting/review/${sitterId}?token=${encodeURIComponent(ownerEmail)}`;
      const reviewTitle = 'Leave a Review 🐾';
      const reviewMsg = `How was your pet sitting experience with ${sitterName}? Leave a review`;

      try {
        await supabaseAdmin.from('notifications').insert({
          recipient_email: ownerEmail,
          type: 'review_request',
          title: reviewTitle,
          message: reviewMsg,
          link: reviewLink,
          booking_id: String(reqRow.id),
          read: false,
        });
      } catch (notifErr) {
        console.error('[Confirm Completed] Failed to insert owner review notification:', notifErr);
      }

      try {
        await sendPushNotification(ownerEmail, reviewTitle, reviewMsg, reviewLink);
      } catch (pushErr) {
        console.error('[Confirm Completed] Push notification error:', pushErr);
      }
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';

    // 5. Send sitter notification email
    if (sitterEmail) {
      try {
        await resend.emails.send({
          from: fromEmail,
          to: sitterEmail,
          subject: `Booking with ${petName} Completed 🐾`,
          html: brandedEmail({
            subject: `Booking with ${petName} Completed 🐾`,
            preheader: `Your booking with ${petName} has been marked as completed by the owner.`,
            body: `
              <h1 style="${emailStyles.h1}">Booking Completed 🐾</h1>
              <p style="${emailStyles.p}">Hi <strong>${sitterName}</strong>,</p>
              <p style="${emailStyles.p}">Your booking with <strong>${petName}</strong> has been marked as completed by the owner. Thank you for your service!</p>
              ${emailStyles.divider}
              ${emailStyles.signoff}
            `
          })
        });
      } catch (sitterEmailErr) {
        console.error('[Confirm Completed] Failed to send sitter completed notification email:', sitterEmailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Confirm Completed] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
