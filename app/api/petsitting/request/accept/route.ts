import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';
import { brandedEmail, emailStyles } from '@/lib/email-template';

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

    // 3. Update request status to accepted
    const { error: updateError } = await supabase
      .from('sitting_requests')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      console.error('[Accept Request] Update error:', updateError);
      return new NextResponse('<h1>Database update failed</h1>', { status: 500, headers: { 'Content-Type': 'text/html' } });
    }

    // 4. Fetch sitter info
    const { data: sitter } = await supabase
      .from('sitters')
      .select('name, email, phone_number, phone_visible')
      .eq('id', reqRow.sitter_id)
      .single();

    // 5. Email the owner
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
    const sitterNameStr = sitter?.name || 'A local sitter';
    
    await resend.emails.send({
      from: fromEmail,
      to: reqRow.owner_email,
      subject: `🎉 Pet Sitting Request Accepted by ${sitterNameStr}!`,
      html: brandedEmail({
        subject: `🎉 Pet Sitting Request Accepted by ${sitterNameStr}!`,
        preheader: `${sitterNameStr} has accepted your request for ${reqRow.pet_name || 'your pet'}.`,
        body: `
          <h1 style="${emailStyles.h1}">Your request was accepted! 🎉</h1>
          <p style="${emailStyles.p}">Hi there,</p>
          <p style="${emailStyles.p}">We have great news! <strong>${sitterNameStr}</strong> has accepted your pet sitting request for <strong>${reqRow.pet_name || 'your pet'}</strong> on the dates <strong>${reqRow.dates || 'your requested dates'}</strong>.</p>
          ${emailStyles.divider}
          ${emailStyles.highlightBox(`
            <p style="margin:0 0 8px 0;font-size:16px;font-weight:700;color:#3B2410;">Contact Information</p>
            <p style="margin:0;font-size:14px;color:#4A3728;line-height:1.6;">
              <strong>Sitter:</strong> ${sitterNameStr}<br/>
              <strong>Email:</strong> <a href="mailto:${sitter?.email || ''}" style="color:#8B6A50;text-decoration:none;">${sitter?.email || ''}</a>
              ${sitter?.phone_visible && sitter?.phone_number ? `<br/><strong>Phone:</strong> ${sitter.phone_number}` : ''}
            </p>
          `)}
          ${emailStyles.divider}
          <p style="${emailStyles.p}">Please reach out to them directly to finalize details and coordinate handoff or meet-ups.</p>
          ${emailStyles.signoff}
        `
      })
    });

    // 6. Return gorgeous html page
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Request Accepted - Lumo Bites</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, sans-serif; background-color: #FDFAF7; color: #4A3E3D; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: white; border: 1px solid #E8DDD4; border-radius: 24px; padding: 40px; text-align: center; max-width: 480px; width: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
          h1 { color: #10B981; font-size: 28px; font-weight: 800; margin-top: 0; }
          p { font-size: 16px; line-height: 1.6; color: #666; margin-bottom: 24px; }
          .logo { margin-bottom: 20px; font-size: 24px; font-weight: 900; color: #8B5E3C; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">🐾 Lumo Bites</div>
          <h1>Request Accepted!</h1>
          <p>You have successfully accepted the pet sitting request for <strong>${reqRow.pet_name || 'their pet'}</strong>.</p>
          <p>We have sent an email notification to the owner (<strong>${reqRow.owner_email}</strong>) with your contact information so they can reach out to finalize the details.</p>
          <p style="font-size:14px;color:#999;margin-bottom:0;">Thank you for being part of our community! ❤️</p>
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
