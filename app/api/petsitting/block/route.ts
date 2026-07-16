import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST — block a user
export async function POST(request: NextRequest) {
  try {
    const { blockerEmail, blockedEmail } = await request.json();

    if (!blockerEmail || !blockedEmail) {
      return NextResponse.json({ error: 'Missing blockerEmail or blockedEmail' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('blocked_users')
      .insert({ 
        blocker_email: blockerEmail.trim().toLowerCase(), 
        blocked_email: blockedEmail.trim().toLowerCase() 
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

    const { error } = await supabaseAdmin
      .from('blocked_users')
      .delete()
      .eq('blocker_email', blockerEmail.trim().toLowerCase())
      .eq('blocked_email', blockedEmail.trim().toLowerCase());

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

    const { data, error } = await supabaseAdmin
      .from('blocked_users')
      .select('*')
      .eq('blocker_email', email.trim().toLowerCase());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ blocked: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
