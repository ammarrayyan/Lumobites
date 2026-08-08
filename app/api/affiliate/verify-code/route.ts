import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { setAccountSessionCookie, createAccountSessionToken } from '@/lib/accountAuth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 0. Brute Force Check
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: recentLog, error: logError } = await supabaseAdmin
      .from('otp_requests_log')
      .select('*')
      .eq('email', cleanEmail)
      .gte('created_at', thirtyMinsAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentLog && recentLog.failed_attempts >= 5) {
      return NextResponse.json({ error: 'Too many incorrect attempts. Please wait 30 minutes before trying again.' }, { status: 429 });
    }

    // 1. Look up the code
    const { data: codeData, error: codeError } = await supabaseAdmin
      .from('verification_codes')
      .select('*')
      .eq('email', cleanEmail)
      .eq('code', code)
      .maybeSingle();

    if (codeError || !codeData) {
      if (recentLog) {
        await supabaseAdmin
          .from('otp_requests_log')
          .update({ failed_attempts: (recentLog.failed_attempts || 0) + 1 })
          .eq('id', recentLog.id);
      }
      return NextResponse.json({ error: 'Invalid or expired verification code.' }, { status: 400 });
    }

    // 2. Check expiration
    if (new Date(codeData.expires_at) < new Date()) {
      await supabaseAdmin.from('verification_codes').delete().eq('id', codeData.id);
      return NextResponse.json({ error: 'Code expired — please request a new one' }, { status: 400 });
    }

    // 3. Retrieve affiliate details to return
    const { data: affiliate, error: affiliateError } = await supabaseAdmin
      .from('affiliates')
      .select('id, full_name, email, referral_code, status')
      .eq('email', cleanEmail)
      .single();

    if (affiliateError || !affiliate) {
      return NextResponse.json({ error: 'Failed to retrieve affiliate details.' }, { status: 404 });
    }

    // 4. Mark successful login by clearing the code
    await supabaseAdmin.from('verification_codes').delete().eq('id', codeData.id);
    if (recentLog) {
      await supabaseAdmin.from('otp_requests_log').update({ failed_attempts: 0 }).eq('id', recentLog.id);
    }

    const sessionToken = createAccountSessionToken(cleanEmail);
    const response = NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      affiliate,
      sessionToken,
      email: cleanEmail
    });
    setAccountSessionCookie(response, cleanEmail);
    return response;

  } catch (err: any) {
    console.error('[Affiliate Verify Code] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
