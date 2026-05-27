import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import { randomUUID } from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const species = searchParams.get('species');
    const q = searchParams.get('q'); // city or zip

    let query = supabase.from('lost_pets').select('*').order('created_at', { ascending: false });

    if (type && type !== 'all') query = query.eq('pet_type', type);
    if (species && species !== 'all') query = query.eq('species', species);
    if (q) {
      query = query.or(`city.ilike.%${q}%,zip_code.ilike.%${q}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Filter out the edit_token from public responses!
    const sanitizedData = data.map(pet => {
      const { edit_token, pet_type, ...safePet } = pet;
      return { ...safePet, type: pet_type };
    });

    return NextResponse.json({ pets: sanitizedData });
  } catch (err: any) {
    console.error('[Lost Pets GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type, pet_name, species, photo_url, description,
      city, zip_code, contact_email, contact_phone, date_lost_found,
      latitude, longitude
    } = body;

    if (!type || !species || !photo_url || !description || !city || (!contact_email && !contact_phone)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Upload photo if base64
    let finalPhotoUrl = photo_url;
    if (photo_url && photo_url.startsWith('data:image/')) {
      try {
        const matches = photo_url.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const fileExt = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          
          const fileName = `lost_${Date.now()}_${randomUUID()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('lost-pets')
            .upload(fileName, buffer, {
              contentType: `image/${matches[1]}`,
              upsert: true
            });
            
          if (uploadError) throw uploadError;
          
          const { data: publicUrlData } = supabaseAdmin.storage
            .from('lost-pets')
            .getPublicUrl(fileName);
            
          finalPhotoUrl = publicUrlData.publicUrl;
        }
      } catch (uploadEx) {
        console.error('[Lost Pets] Failed to upload photo:', uploadEx);
        throw uploadEx;
      }
    }

    // 2. Generate edit token
    const editToken = randomUUID();

    // 3. Insert into DB
    const { data, error } = await supabaseAdmin.from('lost_pets').insert({
      pet_type: type,
      pet_name,
      species,
      photo_url: finalPhotoUrl,
      description,
      city,
      zip_code,
      latitude,
      longitude,
      contact_email: contact_email || null,
      contact_phone: contact_phone || null,
      date_lost_found,
      status: 'active',
      edit_token: editToken
    }).select().single();

    if (error) throw error;

    // 4. Send email if provided
    if (contact_email && process.env.RESEND_API_KEY) {
      const manageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://lumobitespet.com'}/lost-pets/manage?id=${data.id}&token=${editToken}`;
      
      await resend.emails.send({
        from: 'Lumo Bites Pet <noreply@lumobitespet.com>',
        to: contact_email,
        subject: `Your ${type === 'lost' ? 'Lost' : 'Found'} Pet Post is Live!`,
        html: `
          <h1>We hope you find ${pet_name || 'them'} soon!</h1>
          <p>Your post has been successfully shared on the Lumo Bites community board.</p>
          <p>You can view your post here: <a href="${process.env.NEXT_PUBLIC_SITE_URL}/lost-pets/${data.id}">${process.env.NEXT_PUBLIC_SITE_URL}/lost-pets/${data.id}</a></p>
          <hr />
          <h3>Manage Your Post</h3>
          <p>When you want to mark your post as "Found / Resolved", click the secure link below:</p>
          <p><a href="${manageUrl}">Mark as Found 🎉</a></p>
          <p><em>Please do not share this link, as it allows anyone to modify your post's status.</em></p>
        `
      });
    }

    const { edit_token, pet_type, ...safePet } = data;
    return NextResponse.json({ pet: { ...safePet, type: pet_type } });
  } catch (err: any) {
    console.error('[Lost Pets POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
