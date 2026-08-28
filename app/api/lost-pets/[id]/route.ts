import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { formatPublicCity } from '@/lib/formatCity';

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
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

    let photos = data.photos;
    let cleanDesc = data.description;
    if (!Array.isArray(photos) || photos.length === 0) {
      if (data.description && data.description.startsWith('{"photos":')) {
        try {
          const dividerIndex = data.description.indexOf(' || ');
          if (dividerIndex !== -1) {
            const jsonStr = data.description.substring(0, dividerIndex);
            const payload = JSON.parse(jsonStr);
            if (Array.isArray(payload.photos)) {
              photos = payload.photos;
            }
            cleanDesc = data.description.substring(dividerIndex + 4);
          }
        } catch (e) {}
      }
    }
    if (!Array.isArray(photos) || photos.length === 0) {
      photos = data.photo_url ? [data.photo_url] : [];
    }

    return NextResponse.json({ 
      pet: { 
        ...safePet, 
        city: formatPublicCity(data.city) || data.city,
        type: pet_type,
        photos,
        description: cleanDesc
      } 
    });
  } catch (err: any) {
    console.error('[Lost Pets GET ID]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
