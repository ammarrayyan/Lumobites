import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lost_pet_id = searchParams.get('lost_pet_id');

    if (!lost_pet_id) {
      return NextResponse.json({ error: 'lost_pet_id is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('lost_pet_comments')
      .select('*')
      .eq('lost_pet_id', lost_pet_id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ comments: data });
  } catch (err: any) {
    console.error('[Lost Pets Comments GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lost_pet_id, author_name, comment_text } = body;

    if (!lost_pet_id || !author_name || !comment_text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('lost_pet_comments')
      .insert({
        lost_pet_id,
        author_name,
        comment_text
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ comment: data });
  } catch (err: any) {
    console.error('[Lost Pets Comments POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
