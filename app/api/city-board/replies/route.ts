import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('post_id');

    if (!postId) {
      return NextResponse.json({ error: 'Missing post_id' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('city_board_replies')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ replies: data });
  } catch (err: any) {
    console.error('[City Board Replies GET error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { post_id, content, device_cookie } = body;

    if (!post_id || !content || !device_cookie) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('city_board_replies')
      .insert([
        {
          post_id,
          content,
          device_cookie
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, reply: data });
  } catch (err: any) {
    console.error('[City Board Replies POST error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('x-admin-key');
    if (authHeader !== process.env.NEXT_PUBLIC_ADMIN_BYPASS_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body; // reply id

    if (!id) {
      return NextResponse.json({ error: 'Missing reply id' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('city_board_replies')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[City Board Replies DELETE error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
