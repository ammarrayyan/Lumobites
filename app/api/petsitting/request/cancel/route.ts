import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendPushNotification } from '@/lib/push';
import { Resend } from 'resend';
import { brandedEmail, emailStyles, formatSitterName } from '@/lib/email-template';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, by, email, sitter_id } = body;

    if (!id || !by) {
      return NextResponse.json({ error: 'Missing request ID or role initiator' }, { status: 400 });
    }

    if (by !== 'owner' && by !== 'sitter') {
      return NextResponse.json({ error: 'Invalid cancellation initiator role' }, { status: 400 });
    }

    // 1. Fetch current request to validate permission and state
    const { data: reqRow, error: reqError } = await supabaseAdmin
      .from('sitting_requests')
      .select('*, sitters(name, email)')
      .eq('id', id)
      .single();

    if (reqError || !reqRow) {
      return NextResponse.json({ error: 'Sitting request not found' }, { status: 404 });
    }

    // 2. Validate permissions and states
    if (by === 'owner') {
      if (!email) {
        return NextResponse.json({ error: 'Owner email is required' }, { status: 400 });
      }
      if (reqRow.owner_email.toLowerCase().trim() !== email.toLowerCase().trim()) {
        return NextResponse.json({ error: 'Unauthorized cancellation request' }, { status: 403 });
      }
      if (reqRow.status !== 'pending' && reqRow.status !== 'accepted') {
        return NextResponse.json({ error: 'Only pending or accepted requests can be cancelled' }, { status: 400 });
      }
    } else if (by === 'sitter') {
      if (!sitter_id) {
        return NextResponse.json({ error: 'Sitter ID is required' }, { status: 400 });
      }
      if (reqRow.sitter_id !== sitter_id) {
        return NextResponse.json({ error: 'Unauthorized cancellation request' }, { status: 403 });
      }
      if (reqRow.status !== 'accepted') {
        return NextResponse.json({ error: 'Only accepted requests can be cancelled by sitters' }, { status: 400 });
      }
    }

    // 3. Update status to cancelled
    const { error: updateError } = await supabaseAdmin
      .from('sitting_requests')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: by
      })
      .eq('id', id);

    if (updateError) {
      console.error('[Cancel Booking] Update Request Error:', updateError);
      return NextResponse.json({ error: 'Failed to cancel request in database' }, { status: 500 });
    }

    // 4. Send Email Notification
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
    const petName = reqRow.pet_name || 'your pet';
    const dates = reqRow.dates ? `${reqRow.dates}${reqRow.time_slot ? ` — ${reqRow.time_slot}` : ''}` : 'the requested dates';
    const bookingNumber = reqRow.booking_number || `Booking #${reqRow.id.substring(0, 4)}`;

    // Notifications
    const recipient = by === 'owner' ? reqRow.sitters?.email : reqRow.owner_email;
    if (recipient) {
      const link = by === 'owner' ? '/petsitting#sitter-dashboard' : '/petsitting#owner-history';
      const title = 'Booking Cancelled';
      const message = `Booking for ${reqRow.pet_name || 'your pet'} cancelled`;

      try {
        await supabaseAdmin.from('notifications').insert({
          recipient_email: recipient,
          type: 'booking_cancelled',
          title: title,
          message: message,
          link: link
        });
      } catch (err) {
        console.error('[Cancel Booking] Notification error:', err);
      }

      try {
        await sendPushNotification(recipient, title, message, link);
      } catch (err) {
        console.error('[Cancel Booking] Push error:', err);
      }
    }

    if (by === 'owner') {
      // Owner cancelled -> Send email to Sitter
      const sitterEmail = reqRow.sitters?.email;
      const sitterName = formatSitterName(reqRow.sitters?.name);
      
      if (sitterEmail) {
        try {
          await resend.emails.send({
            from: fromEmail,
            to: sitterEmail,
            subject: `🐾 Booking Request Cancelled: ${bookingNumber}`,
            html: brandedEmail({
              subject: `Booking Request Cancelled: ${bookingNumber}`,
              preheader: `The owner has cancelled their booking request for ${petName}.`,
              body: `
                <h1 style="${emailStyles.h1}">Request Cancelled 🐾</h1>
                <p style="${emailStyles.p}">Hi <strong>${sitterName}</strong>,</p>
                <p style="${emailStyles.p}">The owner has cancelled their booking request (<strong>${bookingNumber}</strong>) for <strong>${petName}</strong> on <strong>${dates}</strong>.</p>
                <p style="${emailStyles.p}">No further action is required on your part.</p>
                ${emailStyles.divider}
                ${emailStyles.signoff}
              `
            })
          });
        } catch (emailErr) {
          console.error('[Cancel Booking] Failed to send email to sitter:', emailErr);
        }
      }
    } else if (by === 'sitter') {
      // Sitter cancelled -> Send email to Owner
      const sitterName = formatSitterName(reqRow.sitters?.name);
      const ownerEmail = reqRow.owner_email;

      if (ownerEmail) {
        try {
          await resend.emails.send({
            from: fromEmail,
            to: ownerEmail,
            subject: `🐾 Sitter Cancellation Notice: ${bookingNumber}`,
            html: brandedEmail({
              subject: `Sitter Cancellation Notice: ${bookingNumber}`,
              preheader: `${sitterName} has cancelled your booking request.`,
              body: `
                <h1 style="${emailStyles.h1}">Booking Cancelled 🐾</h1>
                <p style="${emailStyles.p}">Hi there,</p>
                <p style="${emailStyles.p}">Your sitter, <strong>${sitterName}</strong>, has cancelled your booking (<strong>${bookingNumber}</strong>) for <strong>${petName}</strong> on <strong>${dates}</strong>.</p>
                <p style="${emailStyles.p}">Please find another sitter at <a href="https://lumobites.net/petsitting" style="color:#8B5E3C;font-weight:bold;text-decoration:underline;">lumobites.net/petsitting</a></p>
                ${emailStyles.divider}
                <p style="${emailStyles.p}">We have many other wonderful local sitters ready to care for ${petName}. Search again to request another booking:</p>
                ${emailStyles.button('https://lumobites.net/petsitting', 'Find Another Sitter')}
                ${emailStyles.divider}
                ${emailStyles.signoff}
              `
            })
          });
        } catch (emailErr) {
          console.error('[Cancel Booking] Failed to send email to owner:', emailErr);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Cancel Booking] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
