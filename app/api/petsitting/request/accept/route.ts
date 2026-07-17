import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { sendPushNotification } from '@/lib/push';
import { Resend } from 'resend';
import { brandedEmail, emailStyles, formatSitterName } from '@/lib/email-template';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    const token = request.nextUrl.searchParams.get('token');

    if (!id || !token) {
      return new NextResponse('<h1>Invalid request parameters</h1>', { status: 400, headers: { 'Content-Type': 'text/html' } });
    }

    // 1. Fetch sitting request
    const { data: reqRow, error: reqError } = await supabase
      .from('sitting_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (reqError || !reqRow) {
      console.error('[Accept Request] Request not found:', reqError);
      return new NextResponse('<h1>Pet sitting request not found</h1>', { status: 404, headers: { 'Content-Type': 'text/html' } });
    }

    // 2. Validate token
    if (reqRow.secure_token !== token) {
      return new NextResponse('<h1>Unauthorized secure token</h1>', { status: 403, headers: { 'Content-Type': 'text/html' } });
    }

    // Check if cancelled
    if (reqRow.status === 'cancelled') {
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Request Cancelled - Lumo Bites</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #FDFAF7; color: #4A3E3D; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: white; border: 1px solid #E8DDD4; border-radius: 24px; padding: 40px; text-align: center; max-width: 520px; width: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
            h1 { color: #EF4444; font-size: 28px; font-weight: 800; margin-top: 0; margin-bottom: 16px; }
            p { font-size: 15px; line-height: 1.6; color: #666; margin-bottom: 24px; }
            .logo { margin-bottom: 24px; font-size: 24px; font-weight: 900; color: #8B5E3C; text-decoration: none; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="card">
            <a href="https://lumobites.net" class="logo">🐾 Lumo Bites</a>
            <h1>Request Cancelled</h1>
            <p>This request has been cancelled by the owner and cannot be accepted.</p>
            <p style="font-size: 13px; color: #999;">This request has been cancelled and cannot be accepted.</p>
          </div>
        </body>
        </html>
      `;
      return new NextResponse(errorHtml, { headers: { 'Content-Type': 'text/html' } });
    }

    // Only proceed with acceptance if status is still pending or already accepted
    if (reqRow.status !== 'pending' && reqRow.status !== 'accepted') {
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Cannot Accept Request - Lumo Bites</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #FDFAF7; color: #4A3E3D; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: white; border: 1px solid #E8DDD4; border-radius: 24px; padding: 40px; text-align: center; max-width: 520px; width: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
            h1 { color: #EF4444; font-size: 28px; font-weight: 800; margin-top: 0; margin-bottom: 16px; }
            p { font-size: 15px; line-height: 1.6; color: #666; margin-bottom: 24px; }
            .logo { margin-bottom: 24px; font-size: 24px; font-weight: 900; color: #8B5E3C; text-decoration: none; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="card">
            <a href="https://lumobites.net" class="logo">🐾 Lumo Bites</a>
            <h1>Cannot Accept Request</h1>
            <p>This request is in status <strong>${reqRow.status}</strong> and cannot be accepted.</p>
          </div>
        </body>
        </html>
      `;
      return new NextResponse(errorHtml, { headers: { 'Content-Type': 'text/html' } });
    }

    const isAlreadyAccepted = reqRow.status === 'accepted';

    // 3. Update request status to accepted
    if (!isAlreadyAccepted) {
      const { error: updateError } = await supabase
        .from('sitting_requests')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) {
        console.error('[Accept Request] Update error:', updateError);
        return new NextResponse('<h1>Database update failed</h1>', { status: 500, headers: { 'Content-Type': 'text/html' } });
      }
    }

    // 4. Fetch sitter info
    const { data: sitter } = await supabase
      .from('sitters')
      .select('name, email, phone_number, phone_visible')
      .eq('id', reqRow.sitter_id)
      .single();

    const fullSitterNameStr = sitter?.name || 'A local sitter';
    const sitterNameStr = formatSitterName(sitter?.name);

    if (!isAlreadyAccepted) {
      // Notification
      try {
        const { error: notifErr } = await supabaseAdmin.from('notifications').insert({
          recipient_email: reqRow.owner_email,
          type: 'booking_accepted',
          title: 'Booking Accepted! 🎉',
          message: `${fullSitterNameStr} has accepted your request for ${reqRow.pet_name || 'your pet'}`,
          link: `/petsitting?booking=${reqRow.id}&tab=owner`,
          booking_id: reqRow.id
        });
        if (notifErr) {
          console.error('[Accept Request] Notification insert error:', notifErr);
        }
      } catch (err) {
        console.error('[Accept Request] Notification exception:', err);
      }

      try {
        await sendPushNotification(
          reqRow.owner_email,
          'Booking Accepted! 🎉',
          `${fullSitterNameStr} has accepted your request for ${reqRow.pet_name || 'your pet'}`,
          '/petsitting?section=owner-dashboard&tab=bookings',
          { type: 'booking_accepted', requestId: reqRow.id }
        );
      } catch (err) {
        console.error('[Accept Request] Push notification error:', err);
      }

      // 5. Email the owner
      try {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
        
        await resend.emails.send({
          from: fromEmail,
          to: reqRow.owner_email,
          subject: `🎉 Great news! Your sitter accepted your request`,
          html: brandedEmail({
            subject: `🎉 Great news! Your sitter accepted your request`,
            preheader: `${sitterNameStr} has accepted your request for ${reqRow.pet_name || 'your pet'}.`,
            body: `
              <h1 style="${emailStyles.h1}">Your request was accepted! 🎉</h1>
              <p style="${emailStyles.p}">Hi there,</p>
              <p style="${emailStyles.p}">Great news! Your sitter accepted your request. View your booking details at <a href="https://lumobites.net/petsitting" style="color:#8B5E3C;font-weight:bold;text-decoration:underline;">lumobites.net/petsitting</a></p>
              ${emailStyles.divider}
              ${emailStyles.highlightBox(`
                <p style="margin:0 0 8px 0;font-size:16px;font-weight:700;color:#3B2410;">Message Your Sitter</p>
                <p style="margin:0;font-size:14px;color:#4A3728;line-height:1.6;">
                  Message them directly on Lumo Bites → <a href="https://lumobites.net/petsitting" style="color:#8B6A50;font-weight:bold;text-decoration:underline;">lumobites.net/petsitting</a>
                </p>
              `)}
              ${emailStyles.divider}
              <p style="${emailStyles.p}">Please reach out to them directly on Lumo Bites to finalize details and coordinate handoff or meet-ups.</p>
              ${emailStyles.signoff}
            `
          })
        });
      } catch (err) {
        console.error('[Accept Request] Email error:', err);
      }
    }

    // 6. Return gorgeous html page
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Request Accepted - Lumo Bites</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #FDFAF7; color: #4A3E3D; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: white; border: 1px solid #E8DDD4; border-radius: 24px; padding: 40px; text-align: center; max-width: 520px; width: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
          h1 { color: #10B981; font-size: 28px; font-weight: 800; margin-top: 0; margin-bottom: 16px; }
          p { font-size: 15px; line-height: 1.6; color: #666; margin-bottom: 24px; }
          .logo { margin-bottom: 24px; font-size: 24px; font-weight: 900; color: #8B5E3C; text-decoration: none; display: inline-block; }
          .info-section { background-color: #FAF6F4; border: 1px solid #E8DDD4; border-radius: 16px; padding: 20px; text-align: left; margin-bottom: 24px; }
          .info-title { font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #8B5E3C; margin-bottom: 10px; border-bottom: 1px dashed #E8DDD4; padding-bottom: 6px; }
          .info-item { font-size: 14px; margin-bottom: 8px; color: #4A3E3D; line-height: 1.4; }
          .info-item:last-child { margin-bottom: 0; }
          .btn-secondary { display: inline-flex; align-items: center; justify-content: center; background-color: #FAF6F4; border: 1px solid #E8DDD4; color: #4A3E3D; font-weight: bold; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 12px; width: 100%; box-sizing: border-box; transition: background-color 0.2s; cursor: pointer; }
          .btn-secondary:hover { background-color: #F3EAE3; }
        </style>
      </head>
      <body>
        <div class="card">
          <a href="https://lumobites.net" class="logo">🐾 Lumo Bites</a>
          <h1>Request Accepted! 🎉</h1>
          <p>You have successfully accepted <strong>${reqRow.owner_name ? formatSitterName(reqRow.owner_name) : 'the owner'}'s</strong> request for <strong>${reqRow.pet_name || 'their pet'}</strong>.</p>
          
          <div class="info-section">
            <div class="info-title">📅 Booking Details</div>
            <div class="info-item"><strong>Pet Name:</strong> ${reqRow.pet_name || 'Their pet'} ${reqRow.pet_type === 'dog' ? '🐶' : '🐱'}</div>
            <div class="info-item"><strong>Dates:</strong> ${reqRow.dates} ${reqRow.time_slot ? `— ${reqRow.time_slot}` : ''}</div>
            
            <div class="info-title" style="margin-top: 20px;">💬 Message the Owner</div>
            <div class="info-item">Message <strong>${reqRow.owner_name ? formatSitterName(reqRow.owner_name) : 'the owner'}</strong> directly on your Lumo Bites dashboard to coordinate details.</div>
          </div>

          <a href="https://lumobites.net/petsitting" class="btn-secondary">Go to Sitter Dashboard</a>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (err: any) {
    console.error('[Accept Request GET]', err);
    return new NextResponse('<h1>Internal Server Error</h1>', { status: 500, headers: { 'Content-Type': 'text/html' } });
  }
}
