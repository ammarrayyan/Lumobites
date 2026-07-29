import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { extractOgImage } from '@/lib/og-fetcher';
import {
  sendVetClinicRegistrationEmail,
  sendAdminNewPartnerNotificationEmail,
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

async function geocodeLocation(fullAddress: string) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey || !fullAddress) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      const location = result.geometry?.location;
      const addressComponents = result.address_components || [];
      const formatted_address = result.formatted_address;

      let locality = '';
      let state = '';
      let postal_code = '';

      for (const comp of addressComponents) {
        const types = comp.types || [];
        if (types.includes('locality')) {
          locality = comp.long_name;
        } else if (!locality && types.includes('sublocality')) {
          locality = comp.long_name;
        } else if (!locality && types.includes('neighborhood')) {
          locality = comp.long_name;
        } else if (!locality && types.includes('administrative_area_level_2')) {
          locality = comp.long_name;
        }

        if (types.includes('administrative_area_level_1')) {
          state = comp.short_name;
        }
        if (types.includes('postal_code')) {
          postal_code = comp.long_name;
        }
      }

      const city = locality && state ? `${locality}, ${state}` : locality || fullAddress;

      return {
        lat: location?.lat || null,
        lng: location?.lng || null,
        city,
        state,
        zip: postal_code,
        formatted_address
      };
    }
  } catch (err) {
    console.error('[Geocode Helper] Error:', err);
  }
  return null;
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

    if (!clinic_name || !email || (!city && !address)) {
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

    // Geocode location
    const locationQuery = (address || city || '').trim();
    const geo = await geocodeLocation(locationQuery);

    const finalCity = geo?.city || city || locationQuery;
    const finalState = geo?.state || state || '';
    const finalZip = geo?.zip || zip || '';
    const finalAddress = geo?.formatted_address || address || locationQuery;
    const finalLat = geo?.lat || null;
    const finalLng = geo?.lng || null;

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
          address: finalAddress,
          city: finalCity,
          state: finalState,
          zip: finalZip,
          lat: finalLat,
          lng: finalLng,
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
      sendAdminNewPartnerNotificationEmail('Vet Clinic', clinic_name, cleanEmail, finalCity, finalState, phone, website);
      return NextResponse.json({ clinic: updated, message: 'Application re-submitted! Pending admin review.' });
    }

    const { data: clinic, error } = await supabaseAdmin
      .from('vet_clinics')
      .insert({
        clinic_name,
        license_number: license_number || '',
        email: cleanEmail,
        phone: phone || '',
        address: finalAddress,
        city: finalCity,
        state: finalState,
        zip: finalZip,
        lat: finalLat,
        lng: finalLng,
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
    sendAdminNewPartnerNotificationEmail('Vet Clinic', clinic_name, cleanEmail, finalCity, finalState, phone, website);
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

    if (city !== undefined || address !== undefined) {
      const locString = ((address || '') + ' ' + (city || '')).trim();
      if (locString) {
        const geo = await geocodeLocation(locString);
        if (geo) {
          updatePayload.city = geo.city;
          updatePayload.state = geo.state;
          updatePayload.zip = geo.zip;
          updatePayload.address = geo.formatted_address;
          if (geo.lat) updatePayload.lat = geo.lat;
          if (geo.lng) updatePayload.lng = geo.lng;
        } else {
          if (city !== undefined) updatePayload.city = city;
          if (address !== undefined) updatePayload.address = address;
          if (state !== undefined) updatePayload.state = state;
          if (zip !== undefined) updatePayload.zip = zip;
        }
      }
    }

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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get('email');
    let email = emailParam;
    let id = searchParams.get('id');

    if (!email && !id) {
      try {
        const body = await request.json();
        email = body.email;
        id = body.id;
      } catch (e) {}
    }

    if (!email && !id) {
      return NextResponse.json({ error: 'Missing email or id parameter' }, { status: 400 });
    }

    let query = supabaseAdmin.from('vet_clinics').select('*');
    if (id) {
      query = query.eq('id', id);
    } else if (email) {
      query = query.eq('email', email.toLowerCase().trim());
    }

    const { data: clinic } = await query.single();
    if (!clinic) {
      return NextResponse.json({ error: 'Vet clinic not found' }, { status: 404 });
    }

    // Cascade cleanup
    await supabaseAdmin.from('vet_clinic_availability').delete().eq('clinic_id', clinic.id);
    await supabaseAdmin.from('vet_inquiries').delete().eq('clinic_id', clinic.id);

    // Delete clinic record
    const { error: deleteErr } = await supabaseAdmin.from('vet_clinics').delete().eq('id', clinic.id);
    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    // Send confirmation email
    if (clinic.email) {
      sendPartnerAccountDeletionEmail(clinic.email, clinic.clinic_name, 'Vet Boarding Clinic');
    }

    return NextResponse.json({ success: true, message: 'Vet clinic account deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
