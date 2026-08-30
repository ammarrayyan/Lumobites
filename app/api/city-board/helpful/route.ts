import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { post_id, device_cookie } = body;

    if (!post_id || !device_cookie) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if already voted
    const { data: existing } = await supabaseAdmin
      .from('city_board_helpful')
      .select('id')
      .eq('post_id', post_id)
      .eq('device_cookie', device_cookie)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Already marked helpful' }, { status: 400 });
    }

    // Insert vote
    const { error: insertError } = await supabaseAdmin
      .from('city_board_helpful')
      .insert({ post_id, device_cookie });

    if (insertError) throw insertError;

    // Get current post's helpful_count
    const { data: post, error: fetchError } = await supabaseAdmin
      .from('city_board_posts')
      .select('helpful_count')
      .eq('post_id', post_id)
      .single();

    if (fetchError) throw fetchError;

    const newCount = (post?.helpful_count || 0) + 1;

    // Update count
    const { error: updateError } = await supabaseAdmin
      .from('city_board_posts')
      .update({ helpful_count: newCount })
      .eq('post_id', post_id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, helpful_count: newCount });
  } catch (err: any) {
    console.error('[City Board Helpful POST Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { post_id, device_cookie } = body;

    if (!post_id || !device_cookie) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Delete vote
    await supabaseAdmin
      .from('city_board_helpful')
      .delete()
      .eq('post_id', post_id)
      .eq('device_cookie', device_cookie);

    // Get current post's helpful_count
    const { data: post } = await supabaseAdmin
      .from('city_board_posts')
      .select('helpful_count')
      .eq('post_id', post_id)
      .single();

    const newCount = Math.max(0, (post?.helpful_count || 1) - 1);

    // Update count
    await supabaseAdmin
      .from('city_board_posts')
      .update({ helpful_count: newCount })
      .eq('post_id', post_id);

    return NextResponse.json({ success: true, helpful_count: newCount });
  } catch (err: any) {
    console.error('[City Board Helpful DELETE Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
