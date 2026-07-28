import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { extractOgImage } from '@/lib/og-fetcher';
import {
  sendVetClinicRegistrationEmail,
} from '@/lib/adoption-email';

export const dynamic = 'force-dynamic';

// ─── GET /api/vet-boarding?email= ─────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const { data: clinic, error } = await supabaseAdmin
      .from('vet_clinics')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !clinic) {
      return NextResponse.json({ clinic: null });
    }

    return NextResponse.json({ clinic });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST /api/vet-boarding — Register a new clinic ──────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clinic_name, license_number, email, phone,
      address, city, state, zip, website, description, services,
    } = body;
    let { org_photo_url } = body;

    if (!clinic_name || !email || !city) {
      return NextResponse.json(
        { error: 'Missing required fields (clinic_name, email, city)' },
        { status: 400 },
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Auto-fetch OG image from website if no manual photo supplied
    if (!org_photo_url && website) {
      try {
        const fetched = await extractOgImage(website);
        if (fetched) org_photo_url = fetched;
      } catch (e) {
        console.log('[VetBoarding API] OG image fetch skipped:', e);
      }
    }

    // Check for existing registration
    const { data: existing } = await supabaseAdmin
      .from('vet_clinics')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if (existing) {
      if (existing.status === 'approved') {
        return NextResponse.json({
          clinic: existing,
          message: 'Your clinic account is already approved. Please log in to your dashboard.',
        });
      }

      // Re-application: reset to pending and update fields
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from('vet_clinics')
        .update({
          clinic_name,
          license_number: license_number || existing.license_number || '',
          phone: phone || existing.phone || '',
          address: address || existing.address || '',
          city,
          state: state || existing.state || '',
          zip: zip || existing.zip || '',
          website: website || existing.website || '',
          description: description || existing.description || '',
          services: services || existing.services || [],
          org_photo_url: org_photo_url || existing.org_photo_url || '',
          status: 'pending',
          rejection_reason: null,
        })
        .eq('id', existing.id)
        .select('*')
        .single();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      sendVetClinicRegistrationEmail(cleanEmail, clinic_name);
      return NextResponse.json({ clinic: updated, message: 'Application re-submitted! Pending admin review.' });
    }

    const { data: clinic, error } = await supabaseAdmin
      .from('vet_clinics')
      .insert({
        clinic_name,
        license_number: license_number || '',
        email: cleanEmail,
        phone: phone || '',
        address: address || '',
        city,
        state: state || '',
        zip: zip || '',
        website: website || '',
        description: description || '',
        services: services || [],
        org_photo_url: org_photo_url || '',
        status: 'pending',
      })
      .select('*')
      .single();

    if (error) {
      console.error('[VetBoarding API] POST error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    sendVetClinicRegistrationEmail(cleanEmail, clinic_name);
    return NextResponse.json({ clinic, message: 'Application submitted! Pending admin review.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── PATCH /api/vet-boarding — Update profile ────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email, org_photo_url, website, clinic_name, description, services, status, phone, address, city, state, zip } = body;

    if (!id && !email) {
      return NextResponse.json({ error: 'Missing clinic id or email' }, { status: 400 });
    }

    // Only allow clinics to set status to 'approved' or 'paused' (not pending/rejected — that's admin only)
    const allowedStatuses = ['approved', 'paused'];
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    let resolvedPhoto = org_photo_url;
    if (!resolvedPhoto && website) {
      try {
        resolvedPhoto = await extractOgImage(website);
      } catch (e) {}
    }

    const updatePayload: Record<string, any> = {};
    if (resolvedPhoto !== undefined) updatePayload.org_photo_url = resolvedPhoto || '';
    if (website !== undefined) updatePayload.website = website;
    if (clinic_name !== undefined) updatePayload.clinic_name = clinic_name;
    if (description !== undefined) updatePayload.description = description;
    if (services !== undefined) updatePayload.services = services;
    if (status !== undefined) updatePayload.status = status;
    if (phone !== undefined) updatePayload.phone = phone;
    if (address !== undefined) updatePayload.address = address;
    if (city !== undefined) updatePayload.city = city;
    if (state !== undefined) updatePayload.state = state;
    if (zip !== undefined) updatePayload.zip = zip;

    let query = supabaseAdmin.from('vet_clinics').update(updatePayload);
    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('email', email.toLowerCase().trim());
    }

    const { data: clinic, error } = await query.select('*').single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ clinic });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
