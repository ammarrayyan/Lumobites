import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, token, device } = await request.json();

    if (!email || !token) {
      return NextResponse.json({ error: 'Missing email or token' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    // Attempt to upsert with normalized lowercase email
    const { error } = await supabaseAdmin
      .from('push_tokens')
      .upsert(
        { email: normalizedEmail, token, device, created_at: new Date().toISOString() },
        { onConflict: 'email,token' }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
