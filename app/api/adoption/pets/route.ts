import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const species = searchParams.get('species');
    const age = searchParams.get('age');
    const size = searchParams.get('size');
    const city = searchParams.get('city');
    const shelter_id = searchParams.get('shelter_id');
    const status = searchParams.get('status');

    let query = supabaseAdmin.from('adoption_pets').select('*, shelters(org_name, phone, email, website, org_photo_url)');

    if (shelter_id) {
      query = query.eq('shelter_id', shelter_id);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (species && species !== 'all') {
      query = query.ilike('species', `%${species}%`);
    }
    if (age && age !== 'all') {
      query = query.ilike('age', `%${age}%`);
    }
    if (size && size !== 'all') {
      query = query.ilike('size', `%${size}%`);
    }
    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data: pets, error } = await query;

    if (error) {
      console.error('[Adoption Pets API] GET error:', error);
      return NextResponse.json({ pets: [] });
    }

    return NextResponse.json({ pets: pets || [] });
  } catch (err: any) {
    console.error('[Adoption Pets API] Server error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      shelter_id,
      name,
      species,
      breed,
      age,
      size,
      sex,
      spayed_neutered,
      temperament,
      description,
      adoption_fee,
      adoption_process,
      photo_urls,
      city,
      state,
      zip
    } = body;

    if (!shelter_id || !name || !species) {
      return NextResponse.json({ error: 'Missing required fields (shelter_id, name, species)' }, { status: 400 });
    }

    const { data: pet, error } = await supabaseAdmin
      .from('adoption_pets')
      .insert({
        shelter_id,
        name,
        species,
        breed: breed || 'Mixed',
        age: age || 'adult',
        size: size || 'medium',
        sex: sex || 'male',
        spayed_neutered: spayed_neutered ?? true,
        temperament: temperament || '',
        description: description || '',
        adoption_fee: adoption_fee || '',
        adoption_process: adoption_process || '',
        photo_urls: photo_urls || [],
        status: 'available',
        city: city || 'Local',
        state: state || '',
        zip: zip || ''
      })
      .select('*')
      .single();

    if (error) {
      console.error('[Adoption Pets API] POST error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ pet });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ids, status, action, ...updates } = body;

    // Bulk actions
    if (ids && Array.isArray(ids)) {
      if (action === 'delete') {
        const { error } = await supabaseAdmin.from('adoption_pets').delete().in('id', ids);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, count: ids.length });
      }
      if (status) {
        const { error } = await supabaseAdmin.from('adoption_pets').update({ status }).in('id', ids);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, count: ids.length });
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing pet id' }, { status: 400 });
    }

    const updatePayload: any = { ...updates };
    if (status) updatePayload.status = status;

    const { data: pet, error } = await supabaseAdmin
      .from('adoption_pets')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ pet });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing pet id' }, { status: 400 });

    const { error } = await supabaseAdmin.from('adoption_pets').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
