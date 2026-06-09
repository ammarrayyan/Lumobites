import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

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

    // 3. Consume/delete the code immediately only AFTER successful verification
    await supabaseAdmin
      .from('verification_codes')
      .delete()
      .eq('id', codeData.id);

    // Check PRO status
    const { data: proUser } = await supabaseAdmin
      .from('emails')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    // Check sitter status
    const { data: sitter } = await supabaseAdmin
      .from('sitters')
      .select('id, email, is_approved, approval_status, name')
      .eq('email', cleanEmail)
      .maybeSingle();

    // Combined status
    const isOwner = cleanEmail === 'premierpetnutritionllc@gmail.com';
    const isPro = isOwner || proUser?.is_pro === true || sitter?.is_approved === true;
    const isSitter = sitter?.is_approved === true;

    console.log(`[Verify Code API] Successfully verified email ${cleanEmail}. isPro: ${isPro}, isSitter: ${isSitter}`);

    return NextResponse.json({
      success: true,
      isPro,
      isSitter,
      sitterId: sitter?.id || null,
      sitterName: sitter?.name || null,
      approvalStatus: sitter?.approval_status || null
    });
  } catch (err: any) {
    console.error('[Verify Code API] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
