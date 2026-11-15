import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getVerifiedSessionEmail } from '@/lib/accountAuth';
import { isAuthorizedAdmin } from '@/lib/adminAuth';

// POST — block a user
export async function POST(request: NextRequest) {
  try {
    const { blockerEmail, blockedEmail } = await request.json();

    if (!blockerEmail || !blockedEmail) {
      return NextResponse.json({ error: 'Missing blockerEmail or blockedEmail' }, { status: 400 });
    }

    const cleanBlocker = blockerEmail.trim().toLowerCase();
    const cleanBlocked = blockedEmail.trim().toLowerCase();

    if (!isAuthorizedAdmin(request)) {
      const verifiedEmail = await getVerifiedSessionEmail(request);
      if (!verifiedEmail) {
        return NextResponse.json({ error: 'Unauthorized — please sign in.' }, { status: 401 });
      }
      if (verifiedEmail !== cleanBlocker) {
        return NextResponse.json({ error: 'Forbidden — blockerEmail must match your signed-in account.' }, { status: 403 });
      }
    }

    const { error } = await supabaseAdmin
      .from('blocked_users')
      .insert({ 
        blocker_email: cleanBlocker, 
        blocked_email: cleanBlocked 
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — unblock a user
export async function DELETE(request: NextRequest) {
  try {
    const { blockerEmail, blockedEmail } = await request.json();

    if (!blockerEmail || !blockedEmail) {
      return NextResponse.json({ error: 'Missing blockerEmail or blockedEmail' }, { status: 400 });
    }

    const cleanBlocker = blockerEmail.trim().toLowerCase();
    const cleanBlocked = blockedEmail.trim().toLowerCase();

    if (!isAuthorizedAdmin(request)) {
      const verifiedEmail = await getVerifiedSessionEmail(request);
      if (!verifiedEmail) {
        return NextResponse.json({ error: 'Unauthorized — please sign in.' }, { status: 401 });
      }
      if (verifiedEmail !== cleanBlocker) {
        return NextResponse.json({ error: 'Forbidden — blockerEmail must match your signed-in account.' }, { status: 403 });
      }
    }

    const { error } = await supabaseAdmin
      .from('blocked_users')
      .delete()
      .eq('blocker_email', cleanBlocker)
      .eq('blocked_email', cleanBlocked);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET — get blocked users list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isAuthorizedAdmin(request)) {
      const verifiedEmail = await getVerifiedSessionEmail(request);
      if (!verifiedEmail) {
        return NextResponse.json({ error: 'Unauthorized — please sign in.' }, { status: 401 });
      }
      if (verifiedEmail !== cleanEmail) {
        return NextResponse.json({ error: 'Forbidden — you can only view your own blocked users list.' }, { status: 403 });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('blocked_users')
      .select('*')
      .eq('blocker_email', cleanEmail);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ blocked: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
