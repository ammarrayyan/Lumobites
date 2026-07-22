import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { randomUUID } from 'crypto';

async function processPhotoUrls(incomingUrls: string[]): Promise<string[]> {
  if (!incomingUrls || !Array.isArray(incomingUrls)) return [];
  const processed: string[] = [];

  for (const url of incomingUrls) {
    if (url && typeof url === 'string' && url.startsWith('data:image/')) {
      try {
        const matches = url.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const fileExt = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          const fileName = `adoption_${Date.now()}_${randomUUID()}.${fileExt}`;

          const { error: uploadError } = await supabaseAdmin.storage
            .from('adoption-pets')
            .upload(fileName, buffer, {
              contentType: `image/${matches[1]}`,
              upsert: true
            });

          if (!uploadError) {
            const { data: publicUrlData } = supabaseAdmin.storage
              .from('adoption-pets')
              .getPublicUrl(fileName);
            processed.push(publicUrlData.publicUrl);
            continue;
          }

          // Fallback to lost-pets bucket
          const { error: fallbackErr } = await supabaseAdmin.storage
            .from('lost-pets')
            .upload(fileName, buffer, {
              contentType: `image/${matches[1]}`,
              upsert: true
            });

          if (!fallbackErr) {
            const { data: publicUrlData } = supabaseAdmin.storage
              .from('lost-pets')
              .getPublicUrl(fileName);
            processed.push(publicUrlData.publicUrl);
            continue;
          }
        }
      } catch (err) {
        console.warn('[Adoption Pets API] Storage upload warning:', err);
      }
      processed.push(url);
    } else if (url && typeof url === 'string' && url.trim() !== '') {
      processed.push(url.trim());
    }
  }
  return processed;
}

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

    // Verify shelter status server-side — only approved shelters can post pets
    const { data: shelterOrg } = await supabaseAdmin
      .from('shelters')
      .select('status, org_name')
      .eq('id', shelter_id)
      .single();

    if (!shelterOrg) {
      return NextResponse.json({ error: 'Shelter organization not found.' }, { status: 404 });
    }

    if (shelterOrg.status !== 'approved') {
      return NextResponse.json({
        error: `Posting denied: Shelter '${shelterOrg.org_name}' status is currently '${shelterOrg.status}'. Only approved rescue partners can post adoptable pets.`
      }, { status: 403 });
    }

    const finalPhotoUrls = await processPhotoUrls(photo_urls || []);

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
        photo_urls: finalPhotoUrls,
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
    if (updates.photo_urls && Array.isArray(updates.photo_urls)) {
      updatePayload.photo_urls = await processPhotoUrls(updates.photo_urls);
    }

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
