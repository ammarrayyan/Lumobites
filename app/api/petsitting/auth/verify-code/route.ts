import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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
    
    // Find the most recent request log for this email in the last 30 minutes
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
      .single();

    if (codeError || !codeData) {
      // Increment failed_attempts if a log exists
      if (recentLog) {
        await supabaseAdmin
          .from('otp_requests_log')
          .update({ failed_attempts: (recentLog.failed_attempts || 0) + 1 })
          .eq('id', recentLog.id);
      }
      return NextResponse.json({ error: 'Invalid or expired code.' }, { status: 400 });
    }

    // 2. Check expiration
    if (new Date(codeData.expires_at) < new Date()) {
      await supabaseAdmin.from('verification_codes').delete().eq('id', codeData.id);
      return NextResponse.json({ error: 'Code expired — please request a new one' }, { status: 400 });
    }

    // 3. Check account status of sitter (or owner)
    const { data: sitterData } = await supabaseAdmin
      .from('sitters')
      .select('account_status')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (sitterData && (sitterData.account_status === 'suspended' || sitterData.account_status === 'banned')) {
      return NextResponse.json({ error: 'Your account has been suspended. Contact info@lumobitespet.com for assistance.' }, { status: 403 });
    }

    const { data: ownerData } = await supabaseAdmin
      .from('emails')
      .select('is_pro, account_status, source, created_at')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (ownerData && (ownerData.account_status === 'suspended' || ownerData.account_status === 'banned')) {
      return NextResponse.json({ error: 'Your account has been suspended. Contact info@lumobitespet.com for assistance.' }, { status: 403 });
    }

    const existed = !!ownerData;
    const currentSource = ownerData?.source;
    const newSource = currentSource === 'stripe' ? 'stripe' : 'sitter_profile';

    if (!ownerData || !ownerData.is_pro || ownerData.source !== newSource) {
      const { error: upsertErr } = await supabaseAdmin
        .from('emails')
        .upsert({
          email: cleanEmail,
          is_pro: true,
          source: newSource,
          created_at: ownerData?.created_at || new Date().toISOString()
        }, { onConflict: 'email' });

      if (upsertErr) {
        console.error('[Sitter Auth Verify Code] Failed to register free account:', upsertErr);
        return NextResponse.json({ error: 'Failed to create your free account.' }, { status: 500 });
      }
    }

    // 4. Mark successful login by clearing the code
    await supabaseAdmin.from('verification_codes').delete().eq('id', codeData.id);
    if (recentLog) {
      await supabaseAdmin.from('otp_requests_log').update({ failed_attempts: 0 }).eq('id', recentLog.id);
    }

    return NextResponse.json({ success: true, message: 'Logged in successfully', existed });

  } catch (err: any) {
    console.error('[Sitter Auth Verify Code] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
