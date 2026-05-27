import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function checkAuth(req: NextRequest) {
  const key = req.headers.get('x-admin-key');
  return key === process.env.NEXT_PUBLIC_ADMIN_BYPASS_KEY;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('emails')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ users: data });
  } catch (err: any) {
    console.error('[Admin Users GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');

    if (!id || !email) {
      return NextResponse.json({ error: 'Missing id or email' }, { status: 400 });
    }

    // Delete from emails table
    const { error: emailsErr } = await supabaseAdmin
      .from('emails')
      .delete()
      .eq('id', id);

    if (emailsErr) throw emailsErr;

    // Optional cleanup: also delete their sitter profile if they had one
    await supabaseAdmin
      .from('sitters')
      .delete()
      .eq('email', email);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Admin Users DELETE]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
