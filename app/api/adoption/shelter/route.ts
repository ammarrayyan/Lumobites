import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendShelterRegistrationEmail } from '@/lib/adoption-email';

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
