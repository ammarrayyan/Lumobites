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
    const { cookie } = body;

    if (!cookie) {
      return NextResponse.json({ error: 'Missing cookie' }, { status: 400 });
    }

    const cleanCookie = cookie.trim();

    const { error } = await supabaseAdmin
      .from('banned_cookies')
      .upsert({ cookie: cleanCookie });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Admin BanCookie POST]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
