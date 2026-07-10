import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('post_id');

    if (!postId) {
      return NextResponse.json({ error: 'post_id is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('post_reactions')
      .select('reaction')
      .eq('post_id', postId);

    if (error) throw error;

    // Count reactions
    const counts: Record<string, number> = {
      '❤️': 0,
      '😢': 0,
      '🙏': 0,
      '👀': 0,
      '🎉': 0
    };

    data.forEach((row: any) => {
      if (counts[row.reaction] !== undefined) {
        counts[row.reaction]++;
      }
    });

    return NextResponse.json({ counts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { post_id, reaction, device_id } = await req.json();

    if (!post_id || !reaction || !device_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('post_reactions')
      .insert({
        post_id,
        reaction,
        device_id
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { post_id, device_id } = await req.json();

    if (!post_id || !device_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('post_reactions')
      .delete()
      .eq('post_id', post_id)
      .eq('device_id', device_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
