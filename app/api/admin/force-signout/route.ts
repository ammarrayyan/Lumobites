import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function checkAuth(req: NextRequest) {
  const key = req.headers.get('x-admin-key');
  return key === process.env.NEXT_PUBLIC_ADMIN_BYPASS_KEY;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email, target } = body;

    if (!email || !target) {
      return NextResponse.json({ error: 'Missing email or target' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (target === 'sitter') {
      const { error } = await supabaseAdmin
        .from('sitters')
        .update({ session_invalidated_at: new Date().toISOString() })
        .eq('email', cleanEmail);

      if (error) throw error;

      return NextResponse.json({ success: true, message: 'Sitter session invalidated successfully.' });
    } else if (target === 'owner') {
      const { error } = await supabaseAdmin
        .from('emails')
        .update({ session_invalidated_at: new Date().toISOString() })
        .eq('email', cleanEmail);

      if (error) throw error;

      return NextResponse.json({ success: true, message: 'Owner session invalidated successfully.' });
    } else {
      return NextResponse.json({ error: 'Invalid target' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[Admin Force Signout POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
