import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendShelterRegistrationEmail } from '@/lib/adoption-email';
import { extractOgImage } from '@/lib/og-fetcher';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const { data: shelter, error } = await supabaseAdmin
      .from('shelters')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !shelter) {
      return NextResponse.json({ shelter: null });
    }

    return NextResponse.json({ shelter });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { org_name, tax_id, email, phone, address, city, state, zip, website } = body;
    let { org_photo_url } = body;

    if (!org_name || !email || !city) {
      return NextResponse.json({ error: 'Missing required organization details (org_name, email, city)' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if already registered
    const { data: existing } = await supabaseAdmin
      .from('shelters')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if (existing) {
      return NextResponse.json({ shelter: existing, message: 'Shelter account already exists.' });
    }

    // Auto-fetch Open Graph image if website is provided and manual photo is not supplied
    if (!org_photo_url && website) {
      try {
        const fetchedOgPhoto = await extractOgImage(website);
        if (fetchedOgPhoto) org_photo_url = fetchedOgPhoto;
      } catch (e) {
        console.log('[Shelter API] OG Image extraction skipped/failed:', e);
      }
    }

    const { data: shelter, error } = await supabaseAdmin
      .from('shelters')
      .insert({
        org_name,
        tax_id: tax_id || '',
        email: cleanEmail,
        phone: phone || '',
        address: address || '',
        city,
        state: state || '',
        zip: zip || '',
        website: website || '',
        org_photo_url: org_photo_url || '',
        status: 'pending' // Requires admin approval
      })
      .select('*')
      .single();

    if (error) {
      console.error('[Shelter API] POST error:', error);
      if (error.code === 'PGRST205') {
        return NextResponse.json({
          error: "Database table 'shelters' does not exist in Supabase yet. Please run scratch/create-adoption-tables.sql in Supabase SQL Editor."
        }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send email notification to shelter
    sendShelterRegistrationEmail(cleanEmail, org_name);

    return NextResponse.json({ shelter, message: 'Application submitted! Pending admin review.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email, org_photo_url, website } = body;

    if (!id && !email) {
      return NextResponse.json({ error: 'Missing shelter id or email' }, { status: 400 });
    }

    let updatedPhoto = org_photo_url;
    if (!updatedPhoto && website) {
      updatedPhoto = await extractOgImage(website);
    }

    let query = supabaseAdmin.from('shelters').update({
      org_photo_url: updatedPhoto || '',
      ...(website ? { website } : {})
    });

    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('email', email.toLowerCase().trim());
    }

    const { data: shelter, error } = await query.select('*').single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ shelter });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
