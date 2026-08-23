import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
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
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
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
    if (reqRow.owner_email.toLowerCase().trim() !== verifiedEmail) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to report no-show on this booking.' }, { status: 403 });
    }

    if (reqRow.status !== 'accepted') {
      return NextResponse.json({ error: 'Only accepted bookings can be reported as no-show' }, { status: 400 });
    }

    // 2. Update booking status to no_show and set no_show_at
    const { error: updateError } = await supabaseAdmin
      .from('sitting_requests')
      .update({
        status: 'no_show',
        no_show_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('[Report No Show] Update Request Error:', updateError);
      return NextResponse.json({ error: 'Failed to update booking status' }, { status: 500 });
    }

    const sitterId = reqRow.sitter_id;
    const sitterName = formatSitterName(reqRow.sitters?.name);
    const sitterEmail = reqRow.sitters?.email;
    const petName = reqRow.pet_name || 'your pet';
    const dates = reqRow.dates || 'the booking dates';
    const bookingNumber = reqRow.booking_number || `Booking #${reqRow.id.substring(0, 4)}`;

    // 3. Fetch sitter current no_show_count and increment
    const { data: sitterRow, error: sitterError } = await supabaseAdmin
      .from('sitters')
      .select('no_show_count')
      .eq('id', sitterId)
      .single();

    if (!sitterError && sitterRow) {
      const nextCount = (sitterRow.no_show_count || 0) + 1;
      const { error: sitterUpdateError } = await supabaseAdmin
        .from('sitters')
        .update({ no_show_count: nextCount })
        .eq('id', sitterId);

      if (sitterUpdateError) {
        console.error('[Report No Show] Increment Sitter Count Error:', sitterUpdateError);
      }
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';

    // 4. Send Admin Email
    try {
      await resend.emails.send({
        from: fromEmail,
        to: 'info@lumobitespet.com',
        subject: `🚨 No Show Reported — Sitter: ${sitterName}`,
        html: `
          <h2>No Show Reported</h2>
          <p><strong>Sitter:</strong> ${sitterName} (ID: ${sitterId})</p>
          <p><strong>Booking:</strong> ${bookingNumber} (ID: ${id})</p>
          <p><strong>Owner:</strong> ${reqRow.owner_email}</p>
          <p><strong>Dates:</strong> ${dates}</p>
          <p>Please check the admin panel for details.</p>
        `
      });
    } catch (adminEmailErr) {
      console.error('[Report No Show] Failed to send admin email:', adminEmailErr);
    }

    // 5. Send Sitter Email
    if (sitterEmail) {
      try {
        const subject = "No Show Reported ⚠️";
        await resend.emails.send({
          from: fromEmail,
          to: sitterEmail,
          subject: subject,
          html: brandedEmail({
            subject: subject,
            preheader: `A no-show has been reported for your booking with ${petName}.`,
            body: `
              <h1 style="${emailStyles.h1}">No Show Reported ⚠️</h1>
              <p style="${emailStyles.p}">Hi <strong>${sitterName}</strong>,</p>
              <p style="${emailStyles.p}">A no show has been reported for your booking with <strong>${petName}</strong> on <strong>${dates}</strong>.</p>
              <p style="${emailStyles.p}">If this is incorrect, please contact <a href="mailto:info@lumobitespet.com" style="color:#8B5E3C;font-weight:bold;">info@lumobitespet.com</a> to dispute within 48 hours.</p>
              ${emailStyles.divider}
              ${emailStyles.signoff}
            `
          })
        });
      } catch (sitterEmailErr) {
        console.error('[Report No Show] Failed to send sitter warning email:', sitterEmailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Report No Show] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
