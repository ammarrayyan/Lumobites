import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('lost_pets')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return NextResponse.json({ error: 'Not found' }, { status: 404 });
      throw error;
    }

    const { edit_token, pet_type, ...safePet } = data;
    return NextResponse.json({ pet: { ...safePet, type: pet_type } });
  } catch (err: any) {
    console.error('[Lost Pets GET ID]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
