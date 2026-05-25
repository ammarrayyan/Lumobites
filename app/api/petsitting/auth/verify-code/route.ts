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

    // 1. Look up the code
    const { data: codeData, error: codeError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', cleanEmail)
      .eq('code', code)
      .single();

    if (codeError || !codeData) {
      return NextResponse.json({ error: 'Invalid or expired code.' }, { status: 400 });
    }

    // 2. Check expiration
    if (new Date(codeData.expires_at) < new Date()) {
      await supabase.from('verification_codes').delete().eq('id', codeData.id);
      return NextResponse.json({ error: 'Code expired — please request a new one' }, { status: 400 });
    }

    // 3. Mark successful login by clearing the code
    await supabase.from('verification_codes').delete().eq('id', codeData.id);

    return NextResponse.json({ success: true, message: 'Logged in successfully' });

  } catch (err: any) {
    console.error('[Sitter Auth Verify Code] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
