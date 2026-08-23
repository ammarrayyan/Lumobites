import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendPushNotification } from '@/lib/push';
import { Resend } from 'resend';
import { brandedEmail, emailStyles, formatSitterName } from '@/lib/email-template';
import { getVerifiedSessionEmail } from '@/lib/accountAuth';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function POST(request: NextRequest) {
  try {
    const verifiedEmail = await getVerifiedSessionEmail(request);
    if (!verifiedEmail) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in with your verified account.', requires_auth: true },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, sitter_id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing request ID' }, { status: 400 });
    }

    // 1. Fetch current request status to prevent double completion
    const { data: reqRow, error: reqError } = await supabaseAdmin
      .from('sitting_requests')
      .select('status, owner_email, sitter_id, sitters(email)')
      .eq('id', id)
      .single();

    if (reqError || !reqRow) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const isSitter = (reqRow as any).sitters?.email?.toLowerCase().trim() === verifiedEmail;
    const isOwner = reqRow.owner_email?.toLowerCase().trim() === verifiedEmail;

    if (!isSitter && !isOwner) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to complete this booking.' }, { status: 403 });
    }

    if (reqRow.status === 'completed') {
      return NextResponse.json({ success: true, message: 'Booking already completed.' });
    }

    // 2. Update booking request status
    const { error: updateError } = await supabaseAdmin
      .from('sitting_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('[Complete Booking] Update Request Error:', updateError);
      return NextResponse.json({ error: 'Failed to update booking status' }, { status: 500 });
    }

    // 3. Fetch sitter current completed bookings count
    const { data: sitterRow, error: sitterError } = await supabaseAdmin
      .from('sitters')
      .select('completed_bookings')
      .eq('id', sitter_id)
      .single();

    if (!sitterError && sitterRow) {
      const nextCount = (sitterRow.completed_bookings || 0) + 1;
      
      // 4. Increment count in sitters table
      const { error: sitterUpdateError } = await supabaseAdmin
        .from('sitters')
        .update({ completed_bookings: nextCount })
        .eq('id', sitter_id);

      if (sitterUpdateError) {
        console.error('[Complete Booking] Increment Sitter Count Error:', sitterUpdateError);
      }
    }

    // 5. Send review request email immediately to the owner
    if (reqRow.owner_email && reqRow.sitter_id) {
      try {
        const { data: sitter } = await supabaseAdmin
        .from('sitters')
        .select('name')
        .eq('id', reqRow.sitter_id)
        .single();
      const sitterName = formatSitterName(sitter?.name);
      
      try {
        const { error: notifErr } = await supabaseAdmin.from('notifications').insert({
          recipient_email: reqRow.owner_email,
          type: 'booking_completed',
          title: 'Booking Completed 🎉',
          message: `Your booking with ${sitterName} is complete`,
          link: `/petsitting?booking=${reqRow.id}&tab=owner`,
          booking_id: reqRow.id
        });
        if (notifErr) {
          console.error('[Complete Booking] Notification insert error:', notifErr);
        }
      } catch (err) {
        console.error('[Complete Booking] Notification exception:', err);
      }

      try {
        await sendPushNotification(reqRow.owner_email, 'Booking Completed 🎉', `Your booking with ${sitterName} is complete`, '/petsitting#owner-history');
      } catch (err) {
        console.error('[Complete Booking] Push error:', err);
      }
      
      const reviewLink = `https://lumobites.net/petsitting/review/${reqRow.sitter_id}?token=${encodeURIComponent(reqRow.owner_email)}`;
      const subject = "How was your sitter? Leave a review 🎉";
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
      
      try {
        await resend.emails.send({
          from: fromEmail,
          to: reqRow.owner_email,
          subject: subject,
          html: brandedEmail({
            subject: subject,
            preheader: `Leave a review for ${sitterName} 🎉`,
            body: `
              <h1 style="${emailStyles.h1}">How was your sitter? 🎉</h1>
              <p style="${emailStyles.p}">Hi there,</p>
              <p style="${emailStyles.p}">Your booking with <strong>${sitterName}</strong> has been marked as completed. We'd love to hear how it went! Leave a review to help other pet owners find great sitters:</p>
              <p style="${emailStyles.p}"><a href="${reviewLink}" style="color:#8B5E3C;font-weight:bold;text-decoration:underline;">lumobites.net/petsitting/review/${reqRow.sitter_id}</a></p>
              ${emailStyles.divider}
              ${emailStyles.button(reviewLink, 'Leave a Review 🎉')}
              ${emailStyles.divider}
              ${emailStyles.signoff}
            `
          })
        });
        } catch (err) {
          console.error('[Complete Booking] Email error:', err);
        }

        // 6. Update review_sent flag
        const { error: emailSentUpdateError } = await supabaseAdmin
          .from('sitting_requests')
          .update({ review_sent: true })
          .eq('id', id);

        if (emailSentUpdateError) {
          console.error('[Complete Booking] Failed to update review_sent status:', emailSentUpdateError);
        }
      } catch (err: any) {
        console.error('[Complete Booking] Failed to send email to owner:', err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Complete Booking] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
