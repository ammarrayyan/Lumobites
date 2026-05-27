import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import { brandedEmail, emailStyles } from '@/lib/email-template';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, type } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (type === 'owner') {
      const { data: ownerData, error: ownerError } = await supabase
        .from('emails')
        .select('is_pro')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (ownerError || !ownerData || !ownerData.is_pro) {
        return NextResponse.json({ error: 'No active PRO membership found for this email.' }, { status: 404 });
      }
    } else {
      // 1. Verify that this email has a profile in the sitters table
      const { data: userData, error: userError } = await supabaseAdmin
        .from('sitters')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (userError || !userData) {
        return NextResponse.json(
          { error: 'No sitter profile found for this email.' },
          { status: 404 }
        );
      }
    }
    // 1.5 Rate Limiting Check
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('otp_requests_log')
      .select('*', { count: 'exact', head: true })
      .eq('email', cleanEmail)
      .gte('created_at', oneHourAgo);

    if (countError) {
      console.error('[Auth Send Code] Supabase error checking rate limit:', countError);
    } else if (count !== null && count >= 10) {
      return NextResponse.json({ error: 'Too many requests — please try again in 1 hour' }, { status: 429 });
    }

    // Log the new request
    await supabase.from('otp_requests_log').insert({ email: cleanEmail });

    // 2. Generate a secure 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // 3. Clear existing codes
    await supabase.from('verification_codes').delete().eq('email', cleanEmail);

    // 4. Store the new code
    const { error: dbError } = await supabase
      .from('verification_codes')
      .insert({
        email: cleanEmail,
        code: code,
        expires_at: expiresAt,
      });

    if (dbError) {
      console.error('[Auth Send Code] Supabase error inserting code:', dbError);
      return NextResponse.json({ error: 'Failed to generate verification code' }, { status: 500 });
    }

    // TEMP FIX: Log the code to console so user can test login while email is debugged
    console.log(`\n\n========================================`);
    console.log(`[AUTH CODE] OTP for ${cleanEmail} is: ${code}`);
    console.log(`========================================\n\n`);

    // 5. Send email via Resend
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
      await resend.emails.send({
        from: fromEmail,
        to: cleanEmail,
        subject: '🔐 Your Lumo Bites Verification Code',
        html: brandedEmail({
          subject: '🔐 Login Verification Code',
          preheader: `Your one-time verification code is ${code}.`,
          body: `
    <h1 style="${emailStyles.h1}">${type === 'owner' ? 'PRO Verification' : 'Sitter Profile Login'} 🔐</h1>
    <p style="${emailStyles.p}">Use the code below to verify your account:</p>
    ${emailStyles.codeBox(code)}
    <p style="${emailStyles.pSmall}">This code expires in <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
    ${emailStyles.divider}
    ${emailStyles.signoff}
  `
        })
      });
      console.log(`[Sitter Auth Send Code] Sent code to: ${cleanEmail}`);
    } catch (emailErr) {
      console.error('[Sitter Auth Send Code] Resend failed:', emailErr);
      return NextResponse.json({ error: 'Failed to deliver verification email.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Sitter Auth Send Code] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
