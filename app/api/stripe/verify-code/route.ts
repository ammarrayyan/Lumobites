import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.trim();

    // 1. Check if the code exists
    const { data: codeData, error: codeError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', cleanEmail)
      .eq('code', cleanCode)
      .maybeSingle();

    if (codeError) {
      console.error('[Verify Code API] Supabase query error:', codeError);
      return NextResponse.json({ error: 'Failed to verify code' }, { status: 500 });
    }

    if (!codeData) {
      return NextResponse.json(
        { error: 'Invalid code — please check and try again' },
        { status: 400 }
      );
    }

    // 2. Check expiration (JS-side UTC check)
    const expiryTime = new Date(codeData.expires_at).getTime();
    if (Date.now() > expiryTime) {
      // Clean up the expired code
      await supabase
        .from('verification_codes')
        .delete()
        .eq('id', codeData.id);
      return NextResponse.json(
        { error: 'Code expired — please request a new one' },
        { status: 400 }
      );
    }

    // 3. Confirm double-verify that the user has a PRO subscription in the emails table
    // EXCEPT FOR THE OWNER/TESTING EMAIL: premierpetnutritionllc@gmail.com
    const isOwner = cleanEmail === 'premierpetnutritionllc@gmail.com';
    let isProUser = isOwner;
    let existed = isOwner;

    if (!isOwner) {
      const { data: userData, error: userError } = await supabase
        .from('emails')
        .select('is_pro, account_status')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (userError) {
        console.error('[Verify Code API] Supabase error confirming user status:', userError);
        return NextResponse.json({ error: 'Failed to verify subscription status' }, { status: 500 });
      }

      if (userData) {
        existed = true;
      }

      if (userData?.account_status === 'suspended' || userData?.account_status === 'banned') {
        return NextResponse.json({ error: 'Your account has been suspended. Contact info@lumobitespet.com for assistance.' }, { status: 403 });
      }

      if (!userData || !userData.is_pro) {
        // Automatically register as free early access account
        const { error: upsertErr } = await supabase
          .from('emails')
          .upsert({
            email: cleanEmail,
            is_pro: true,
            source: 'early_access_free',
            created_at: new Date().toISOString()
          }, { onConflict: 'email' });

        if (upsertErr) {
          console.error('[Verify Code API] Failed to register free account:', upsertErr);
          return NextResponse.json({ error: 'Failed to create your free account.' }, { status: 500 });
        }
      }
    }

    // 4. Consume/delete the code immediately only AFTER successful verification
    await supabase
      .from('verification_codes')
      .delete()
      .eq('id', codeData.id);

    console.log(`[Verify Code API] Successfully verified email and granted Pro access: ${cleanEmail}`);

    return NextResponse.json({ success: true, isPro: true, existed });
  } catch (err: any) {
    console.error('[Verify Code API] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
