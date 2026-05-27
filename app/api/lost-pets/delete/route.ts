import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, token } = body;

    if (!id || !token) {
      return NextResponse.json({ error: 'Missing id or token' }, { status: 400 });
    }

    // Verify token and fetch the pet
    const { data: pet, error: fetchError } = await supabaseAdmin
      .from('lost_pets')
      .select('id, edit_token')
      .eq('id', id)
      .single();

    if (fetchError || !pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }

    if (pet.edit_token !== token) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 403 });
    }

    // First delete associated comments
    const { error: commentDeleteErr } = await supabaseAdmin
      .from('lost_pet_comments')
      .delete()
      .eq('lost_pet_id', id);

    if (commentDeleteErr) throw commentDeleteErr;

    // Delete the post
    const { error: deleteError } = await supabaseAdmin
      .from('lost_pets')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Lost Pets Delete POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
