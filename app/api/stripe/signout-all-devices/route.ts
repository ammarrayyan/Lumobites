import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getVerifiedSessionEmail, clearAccountSessionCookie } from '@/lib/accountAuth';

export async function POST(request: NextRequest) {
  try {
    const verifiedEmail = await getVerifiedSessionEmail(request);
    let bodyEmail = '';
    try {
      const body = await request.json();
      bodyEmail = body.email;
    } catch {}

    const cleanEmail = (verifiedEmail || bodyEmail || '').toLowerCase().trim();

    if (!cleanEmail) {
      return NextResponse.json({ error: 'Session expired or email required' }, { status: 401 });
    }

    const { error } = await supabase
      .from('emails')
      .update({ session_invalidated_at: new Date().toISOString() })
      .eq('email', cleanEmail);

    if (error) {
      console.error('[SignOut All Devices API] Supabase error:', error);
      return NextResponse.json({ error: 'Failed to invalidate owner session in database' }, { status: 500 });
    }

    const response = NextResponse.json({ success: true, message: 'All owner devices signed out successfully.' });
    clearAccountSessionCookie(response);
    return response;
  } catch (err: any) {
    console.error('[SignOut All Devices API] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
