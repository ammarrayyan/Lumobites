import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import { brandedEmail, emailStyles } from '@/lib/email-template';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Verify that this email exists in the affiliates table
    const { data: affiliate, error: affiliateError } = await supabaseAdmin
      .from('affiliates')
      .select('id, full_name, status')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (affiliateError) {
      console.error('[Affiliate Send Code] Supabase error:', affiliateError);
      return NextResponse.json({ error: 'Failed to query affiliate database.' }, { status: 500 });
    }

    if (!affiliate) {
      return NextResponse.json(
        { error: 'No affiliate profile found for this email.' },
        { status: 404 }
      );
    }

    // Check application status
    if (affiliate.status === 'pending') {
      return NextResponse.json(
        { error: 'Your application is under review. You will receive an email once approved.' },
        { status: 400 }
      );
    }

    if (affiliate.status === 'rejected') {
      return NextResponse.json(
        { error: 'Your application was not approved.' },
        { status: 400 }
      );
    }

    if (affiliate.status !== 'approved') {
      return NextResponse.json(
        { error: 'Your application is not approved yet.' },
        { status: 400 }
      );
    }

    // 1.5 Rate Limiting Check (reuse otp_requests_log pattern)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabaseAdmin
      .from('otp_requests_log')
      .select('*', { count: 'exact', head: true })
      .eq('email', cleanEmail)
      .gte('created_at', oneHourAgo);

    if (countError) {
      console.error('[Affiliate Send Code] Rate limit check error:', countError);
    } else if (count !== null && count >= 10) {
      return NextResponse.json({ error: 'Too many requests — please try again in 1 hour' }, { status: 429 });
    }

    // Log the new request
    await supabaseAdmin.from('otp_requests_log').insert({ email: cleanEmail });

    // 2. Generate a secure 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    // 3. Clear existing codes
    await supabaseAdmin.from('verification_codes').delete().eq('email', cleanEmail);

    // 4. Store the new code
    const { error: dbError } = await supabaseAdmin
      .from('verification_codes')
      .insert({
        email: cleanEmail,
        code: code,
        expires_at: expiresAt,
      });

    if (dbError) {
      console.error('[Affiliate Send Code] DB error inserting code:', dbError);
      return NextResponse.json({ error: 'Failed to generate verification code' }, { status: 500 });
    }

    // Print to console for easy testing/debugging
    console.log(`\n\n========================================`);
    console.log(`[AFFILIATE OTP] Code for ${cleanEmail} is: ${code}`);
    console.log(`========================================\n\n`);

    // 5. Send email via Resend
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
      await resend.emails.send({
        from: fromEmail,
        to: cleanEmail,
        subject: '🔐 Your Affiliate Dashboard Verification Code',
        html: brandedEmail({
          subject: '🔐 Affiliate Verification Code',
          preheader: `Your one-time verification code is ${code}.`,
          body: `
            <h1 style="${emailStyles.h1}">Affiliate Dashboard Login 🔐</h1>
            <p style="${emailStyles.p}">Hi ${affiliate.full_name},</p>
            <p style="${emailStyles.p}">Use the code below to verify your identity and login to your affiliate dashboard:</p>
            ${emailStyles.codeBox(code)}
            <p style="${emailStyles.pSmall}">This code expires in <strong>15 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
            ${emailStyles.divider}
            ${emailStyles.signoff}
          `
        })
      });
      console.log(`[Affiliate Send Code] Sent code to: ${cleanEmail}`);
    } catch (emailErr) {
      console.error('[Affiliate Send Code] Resend failed:', emailErr);
      return NextResponse.json({ error: 'Failed to deliver verification email.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Affiliate Send Code] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
