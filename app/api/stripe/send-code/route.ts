import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

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
        .select('is_pro')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (userError) {
        console.error('[Send Code API] Supabase error fetching user status:', userError);
        return NextResponse.json({ error: 'Failed to retrieve subscription status' }, { status: 500 });
      }

      if (userData && userData.is_pro) {
        isProUser = true;
      }
    }

    if (!isProUser) {
      console.log(`[Send Code API] Restoration blocked. Email: ${cleanEmail} is not registered as PRO.`);
      return NextResponse.json(
        { error: 'No active Pro subscription found for this email.' },
        { status: 404 }
      );
    }

    // 2. Generate a secure 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now

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
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <onboarding@resend.dev>';
      const hasKey = !!process.env.RESEND_API_KEY;
      const keyPrefix = hasKey ? process.env.RESEND_API_KEY?.substring(0, 7) : 'none';
      
      console.log(`[Send Code API] Attempting to send verification code to: ${cleanEmail}`);
      console.log(`[Send Code API] Resend Config: Key present: ${hasKey} (prefix: ${keyPrefix}), From: ${fromEmail}`);
      console.log(`[Send Code API] Code: ${code}`);

      const emailResponse = await resend.emails.send({
        from: fromEmail,
        to: cleanEmail,
        subject: "🐾 Lumo Bites Pro Verification Code",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 32px 24px; border: 1px solid #F0E6DF; border-radius: 16px; background-color: #FFFFFF; color: #191919; box-shadow: 0 4px 12px rgba(139, 94, 60, 0.05);">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 40px;">🐾</span>
              <h1 style="color: #8B5E3C; margin: 12px 0 4px 0; font-size: 24px; font-weight: 800;">Lumo Bites</h1>
              <p style="color: #A08068; margin: 0; font-size: 14px; font-weight: 600; text-transform: uppercase; tracking-widest: 1px;">Restore Pro Status</p>
            </div>
            
            <div style="height: 1px; background-color: #F5EBE4; margin: 24px 0;"></div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #4A4A4A; margin-top: 0;">Hi there,</p>
            <p style="font-size: 16px; line-height: 1.6; color: #4A4A4A;">We received a request to restore your Lumo Bites Pro subscription on this device. Please use the 6-digit verification code below to confirm your email ownership:</p>
            
            <div style="background-color: #FAF6F4; border: 1px dashed #8B5E3C; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0;">
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; color: #8B5E3C; letter-spacing: 6px; display: inline-block;">${code}</span>
            </div>
            
            <p style="font-size: 13px; line-height: 1.5; color: #8C8C8C;">This code is temporary and will expire in <strong>10 minutes</strong>. If you did not make this request, you can safely ignore this email.</p>
            
            <div style="height: 1px; background-color: #F5EBE4; margin: 24px 0;"></div>
            
            <p style="font-size: 14px; line-height: 1.6; color: #6D6D6D; margin-bottom: 0;">Stay safe,<br/><strong>The Lumo Bites Team</strong></p>
          </div>
        `,
      });
      
      console.log(`[Send Code API] Resend email API response:`, JSON.stringify(emailResponse));
      console.log(`[Send Code API] Verification code successfully sent to: ${cleanEmail}`);
    } catch (emailErr) {
      console.error('[Send Code API] Resend email send failed:', emailErr);
      return NextResponse.json({ error: 'Failed to deliver verification email. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Send Code API] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
