import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('sitters')
      .select('id, name, photo_url, city, zip, bio, pet_types, rate_per_night')
      .eq('is_pro', true)
      .eq('availability', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[PetSitting Sitters API] Error fetching:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
