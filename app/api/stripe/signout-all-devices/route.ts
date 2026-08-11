import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getVerifiedSessionEmail, clearAccountSessionCookie } from '@/lib/accountAuth';

export async function POST(request: NextRequest) {
  try {
    const verifiedEmail = await getVerifiedSessionEmail(request);

    if (!verifiedEmail) {
      return NextResponse.json({ error: 'Unauthorized — valid session cookie required' }, { status: 401 });
    }

    const cleanEmail = verifiedEmail.toLowerCase().trim();

    const { error } = await supabaseAdmin
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
