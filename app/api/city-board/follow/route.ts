import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { post_id, email } = body;

    if (!post_id || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    const { data, error } = await supabaseAdmin
      .from('city_board_followers')
      .insert({ post_id, email: cleanEmail })
      .select()
      .single();

    if (error && error.code !== '23505') { // Code '23505' is unique constraint violation in Postgres
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[City Board Follow POST Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
