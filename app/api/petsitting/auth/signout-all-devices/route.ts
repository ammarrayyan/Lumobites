import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getVerifiedSessionEmail, clearAccountSessionCookie } from '@/lib/accountAuth';
import { isAuthorizedAdmin } from '@/lib/adminAuth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const isAdmin = isAuthorizedAdmin(request);

    if (!isAdmin) {
      const verifiedEmail = await getVerifiedSessionEmail(request);
      if (!verifiedEmail) {
        return NextResponse.json({ error: 'Unauthorized — please sign in.' }, { status: 401 });
      }
      if (verifiedEmail !== cleanEmail) {
        return NextResponse.json({ error: 'Forbidden — you can only sign out your own account.' }, { status: 403 });
      }
    }

    const nowIso = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from('sitters')
      .update({ session_invalidated_at: nowIso })
      .eq('email', cleanEmail);

    if (error) {
      console.error('[Sitter SignOut All Devices API] Supabase error:', error);
      return NextResponse.json({ error: 'Failed to invalidate sitter session in database' }, { status: 500 });
    }

    await supabaseAdmin
      .from('emails')
      .update({ session_invalidated_at: nowIso })
      .eq('email', cleanEmail);

    const response = NextResponse.json({ success: true, message: 'All sitter devices signed out successfully.' });
    if (!isAdmin) {
      clearAccountSessionCookie(response);
    }
    return response;
  } catch (err: any) {
    console.error('[Sitter SignOut All Devices API] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
