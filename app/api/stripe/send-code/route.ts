import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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

    // 1. Verify that this email actually has a PRO subscription in the database
    // EXCEPT FOR THE OWNER/TESTING EMAIL: premierpetnutritionllc@gmail.com
    const isOwner = cleanEmail === 'premierpetnutritionllc@gmail.com';
    let isProUser = isOwner;

    if (!isOwner) {
      const { data: userData, error: userError } = await supabase
        .from('emails')
        .select('is_pro, account_status')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (userError) {
        console.error('[Send Code API] Supabase error fetching user status:', userError);
        return NextResponse.json({ error: 'Failed to retrieve subscription status' }, { status: 500 });
      }

      if (userData?.account_status === 'suspended' || userData?.account_status === 'banned') {
        return NextResponse.json({ error: 'Your account has been suspended. Contact info@lumobitespet.com for assistance.' }, { status: 403 });
      }

      if (userData && userData.is_pro) {
        isProUser = true;
      }
    }

    // 2. Generate a secure 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes from now

    // 3. Clear any existing verification codes for this email to keep table clean
    await supabase
      .from('verification_codes')
      .delete()
      .eq('email', cleanEmail);

    // 4. Store the pending verification code
    const { error: dbError } = await supabase
      .from('verification_codes')
      .insert({
        email: cleanEmail,
        code: code,
        expires_at: expiresAt,
      });

    if (dbError) {
      console.error('[Send Code API] Supabase error inserting code:', dbError);
      return NextResponse.json({ error: 'Failed to generate verification code' }, { status: 500 });
    }

    // 5. Send the verification code email via Resend
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
      const hasRealKey = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_dummy' && !process.env.RESEND_API_KEY.includes('YOUR_RESEND_API_KEY');
      
      console.log(`[Send Code API] Attempting to send verification code to: ${cleanEmail}`);
      console.log(`[Send Code API] Code: ${code}`);

      if (!hasRealKey) {
        console.warn(`[Send Code API] Missing or mock RESEND_API_KEY. Skipping Resend email delivery.`);
        console.warn(`[AUTH CODE] OTP for ${cleanEmail} is: ${code}`);
        return NextResponse.json({ success: true });
      }

      const emailResponse = await resend.emails.send({
        from: fromEmail,
        to: cleanEmail,
        subject: '🔐 Your Lumo Bites Verification Code',
        html: brandedEmail({
          subject: '🔐 Your Lumo Bites Verification Code',
          preheader: `Your one-time verification code is ${code}. It expires in 15 minutes.`,
          body: `
    <h1 style="${emailStyles.h1}">Verify Your Identity 🔐</h1>
    <p style="${emailStyles.p}">We received a request to access your Lumo Bites account. Use the code below to confirm your identity:</p>
    ${emailStyles.codeBox(code)}
    <p style="${emailStyles.pSmall}">This code expires in <strong>15 minutes</strong>. If you did not request this, you can safely ignore this email — your account remains secure.</p>
    ${emailStyles.divider}
    ${emailStyles.signoff}
  `
        })
      });
      
      console.log(`[Send Code API] Resend email API response:`, JSON.stringify(emailResponse));
      
      if (emailResponse.error) {
        console.error('[Send Code API] Resend SDK returned an error:', emailResponse.error);
        
        if (process.env.NODE_ENV === 'development' || cleanEmail.endsWith('@lumobites.net')) {
          console.warn(`[Send Code API] Resend email delivery failed but in development/test email mode. Proceeding with DB code: ${code}`);
          return NextResponse.json({ success: true });
        }

        return NextResponse.json(
          { error: `Email delivery failed: ${emailResponse.error.message}. Please verify your Resend setup.` },
          { status: 500 }
        );
      }

      console.log(`[Send Code API] Verification code successfully sent to: ${cleanEmail}`);
    } catch (emailErr) {
      console.error('[Send Code API] Resend email send failed exception:', emailErr);
      if (process.env.NODE_ENV === 'development' || cleanEmail.endsWith('@lumobites.net')) {
        console.warn(`[Send Code API] Resend email delivery threw exception but in development/test email mode. Proceeding with DB code: ${code}`);
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Failed to deliver verification email. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Send Code API] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
