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

    // Update status to resolved
    const { error: updateError } = await supabaseAdmin
      .from('lost_pets')
      .update({ status: 'resolved' })
      .eq('id', id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Lost Pets Resolve POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
