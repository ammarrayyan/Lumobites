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
      console.error('[Decline Request] Request not found:', reqError);
      return new NextResponse('<h1>Pet sitting request not found</h1>', { status: 404, headers: { 'Content-Type': 'text/html' } });
    }

    // 2. Validate token
    if (reqRow.secure_token !== token) {
      return new NextResponse('<h1>Unauthorized secure token</h1>', { status: 403, headers: { 'Content-Type': 'text/html' } });
    }

    // 3. Update request status to declined
    const { error: updateError } = await supabase
      .from('sitting_requests')
      .update({ status: 'declined' })
      .eq('id', id);

    if (updateError) {
      console.error('[Decline Request] Update error:', updateError);
      return new NextResponse('<h1>Database update failed</h1>', { status: 500, headers: { 'Content-Type': 'text/html' } });
    }

    // 4. Fetch sitter info
    const { data: sitter } = await supabase
      .from('sitters')
      .select('name')
      .eq('id', reqRow.sitter_id)
      .single();

    // 5. Email the owner
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
    const sitterNameStr = sitter?.name || 'The sitter';
    
    await resend.emails.send({
      from: fromEmail,
      to: reqRow.owner_email,
      subject: `🐾 Update on your Pet Sitting Request`,
      html: brandedEmail({
        subject: `🐾 Update on your Pet Sitting Request`,
        preheader: `An update regarding your sitting request for ${reqRow.pet_name || 'your pet'}.`,
        body: `
          <h1 style="${emailStyles.h1}">Sitting Request Update 🐾</h1>
          <p style="${emailStyles.p}">Hi there,</p>
          <p style="${emailStyles.p}">Thank you for using Lumo Bites. We wanted to let you know that <strong>${sitterNameStr}</strong> is unfortunately unavailable for your requested dates (<strong>${reqRow.dates || 'your requested dates'}</strong>) for <strong>${reqRow.pet_name || 'your pet'}</strong>.</p>
          ${emailStyles.divider}
          <p style="${emailStyles.p}">Don't worry! We have many other amazing sitters in your community. You can find another sitter easily:</p>
          ${emailStyles.button('https://lumobites.net/petsitting', 'Find Another Sitter')}
          ${emailStyles.divider}
          ${emailStyles.signoff}
        `
      })
    });

    // 6. Return confirmation html page
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Request Declined - Lumo Bites</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, sans-serif; background-color: #FDFAF7; color: #4A3E3D; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: white; border: 1px solid #E8DDD4; border-radius: 24px; padding: 40px; text-align: center; max-width: 480px; width: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
          h1 { color: #EF4444; font-size: 28px; font-weight: 800; margin-top: 0; }
          p { font-size: 16px; line-height: 1.6; color: #666; margin-bottom: 24px; }
          .logo { margin-bottom: 20px; font-size: 24px; font-weight: 900; color: #8B5E3C; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">🐾 Lumo Bites</div>
          <h1>Request Declined</h1>
          <p>You have successfully declined the pet sitting request for <strong>${reqRow.pet_name || 'their pet'}</strong>.</p>
          <p>We have notified the owner that you are unavailable for these dates.</p>
          <p style="font-size:14px;color:#999;margin-bottom:0;">Thank you! 🐾</p>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (err: any) {
    console.error('[Decline Request GET]', err);
    return new NextResponse('<h1>Internal Server Error</h1>', { status: 500, headers: { 'Content-Type': 'text/html' } });
  }
}
