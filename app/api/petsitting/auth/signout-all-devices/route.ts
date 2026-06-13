import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    const { error } = await supabaseAdmin
      .from('sitters')
      .update({ session_invalidated_at: new Date().toISOString() })
      .eq('email', cleanEmail);

    if (error) {
      console.error('[Sitter SignOut All Devices API] Supabase error:', error);
      return NextResponse.json({ error: 'Failed to invalidate sitter session in database' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'All sitter devices signed out successfully.' });
  } catch (err: any) {
    console.error('[Sitter SignOut All Devices API] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
