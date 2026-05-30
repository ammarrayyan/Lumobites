import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { post_id, reason, device_cookie } = body;

    if (!post_id || !reason || !device_cookie) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('city_board_reports')
      .insert({ post_id, reason, device_cookie })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, report: data });
  } catch (err: any) {
    console.error('[City Board Report POST Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
