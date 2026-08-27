import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { extractOgImage } from '@/lib/og-fetcher';
import { getUserProStatusDetails } from '@/lib/aiLimiter';
import { getVerifiedSessionEmail } from '@/lib/accountAuth';
import Stripe from 'stripe';
import {
  sendVetClinicRegistrationEmail,
  sendAdminNewPartnerNotificationEmail,
  sendPartnerAccountDeletionEmail,
} from '@/lib/adoption-email';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const dynamic = 'force-dynamic';

// ─── GET /api/vet-boarding?email= ─────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Enforce verified session matching clinic email
    const verifiedEmail = await getVerifiedSessionEmail(request);
    if (!verifiedEmail || verifiedEmail !== cleanEmail) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in with your verified partner account.', requires_auth: true },
        { status: 401 }
      );
    }

    const { data: clinic, error } = await supabaseAdmin
      .from('vet_clinics')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    const noCacheHeaders = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };

    if (error || !clinic) {
      return NextResponse.json({ clinic: null }, { headers: noCacheHeaders });
    }

    return NextResponse.json({ clinic }, { headers: noCacheHeaders });
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

    if (!clinic_name || !email || !license_number || (!city && !address)) {
      return NextResponse.json(
        { error: 'Missing required fields (clinic_name, license_number, email, location)' },
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

    // Check for active consumer AI Membership FIRST
    const proDetails = await getUserProStatusDetails(cleanEmail);
    if (proDetails.isPro && proDetails.proSource === 'ai_member') {
      return NextResponse.json({
        error: "This email already has an active AI Membership. Please cancel it on your Account page first if you'd like to register as a Vet Boarding partner instead."
      }, { status: 400 });
    }

    // Check for existing registration in other partner tables FIRST
    const { data: existingDaycare } = await supabaseAdmin.from('pet_daycares').select('id').eq('email', cleanEmail).maybeSingle();
    if (existingDaycare) {
      return NextResponse.json({
        error: 'This email is already registered as a Pet Daycare partner. Each business email may only have one active partner listing.'
      }, { status: 400 });
    }

    const { data: existingShelter } = await supabaseAdmin.from('shelters').select('id').eq('email', cleanEmail).maybeSingle();
    if (existingShelter) {
      return NextResponse.json({
        error: 'This email is already registered as a Shelter partner. Each business email may only have one active partner listing.'
      }, { status: 400 });
    }

    // Check for existing registration in vet_clinics table
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
    const verifiedEmail = await getVerifiedSessionEmail(request);
    if (!verifiedEmail) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in with your verified partner account.', requires_auth: true },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      id,
      email,
      org_photo_url,
      website,
      clinic_name,
      description,
      services,
      status,
      phone,
      address,
      city,
      state,
      zip,
      gallery_urls,
      hours,
      starting_rate,
      pricing_type,
      pricing_note,
    } = body;

    if (!id && !email) {
      return NextResponse.json({ error: 'Missing clinic id or email' }, { status: 400 });
    }

    // Verify clinic belongs to verifiedEmail
    const { data: existingClinic } = await supabaseAdmin
      .from('vet_clinics')
      .select('*')
      .or(id ? `id.eq.${id},email.eq.${verifiedEmail}` : `email.eq.${verifiedEmail}`)
      .maybeSingle();

    if (!existingClinic || existingClinic.email.toLowerCase().trim() !== verifiedEmail) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to modify this clinic.' }, { status: 403 });
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

    const { extractPartnerMeta, packPartnerDescription } = await import('@/lib/partnerProfileHelper');
    const existingMeta = extractPartnerMeta(existingClinic);

    const mergedMeta = {
      hours: hours !== undefined ? hours : existingMeta.hours,
      gallery: gallery_urls !== undefined ? gallery_urls : existingMeta.gallery,
      pricing: {
        startingRate: starting_rate !== undefined ? starting_rate : existingMeta.pricing.startingRate,
        pricingType: pricing_type !== undefined ? pricing_type : existingMeta.pricing.pricingType,
        pricingNote: pricing_note !== undefined ? pricing_note : existingMeta.pricing.pricingNote,
        unit: 'night',
      },
    };

    const rawCleanDesc = description !== undefined ? description : existingMeta.cleanDescription;
    const packedDescription = packPartnerDescription(rawCleanDesc, mergedMeta);

    const updatePayload: Record<string, any> = {
      description: packedDescription,
    };

    if (resolvedPhoto !== undefined) updatePayload.org_photo_url = resolvedPhoto || '';
    if (website !== undefined) updatePayload.website = website;
    if (clinic_name !== undefined) updatePayload.clinic_name = clinic_name;
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
      query = query.eq('email', verifiedEmail);
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
    const verifiedEmail = await getVerifiedSessionEmail(request);
    if (!verifiedEmail) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in with your verified partner account.', requires_auth: true },
        { status: 401 }
      );
    }

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

    let query = supabaseAdmin.from('vet_clinics').select('*');
    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('email', verifiedEmail);
    }

    const { data: clinic } = await query.maybeSingle();
    if (!clinic || clinic.email.toLowerCase().trim() !== verifiedEmail) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to delete this clinic.' }, { status: 403 });
    }

    // Cancel active Stripe subscriptions FIRST
    let canceledStripeSubs = 0;
    if (stripeSecretKey) {
      try {
        const stripe = new Stripe(stripeSecretKey);

        if (clinic.stripe_subscription_id) {
          try {
            await stripe.subscriptions.cancel(clinic.stripe_subscription_id);
            canceledStripeSubs++;
          } catch (e: any) {
            console.error('[VetBoarding DELETE] Error canceling subscription ID:', e.message);
          }
        }

        if (clinic.email) {
          const customers = await stripe.customers.list({
            email: clinic.email.toLowerCase().trim(),
            limit: 5,
          });

          for (const cust of customers.data) {
            const subs = await stripe.subscriptions.list({
              customer: cust.id,
              status: 'active',
            });

            for (const sub of subs.data) {
              if (sub.id !== clinic.stripe_subscription_id) {
                await stripe.subscriptions.cancel(sub.id);
                canceledStripeSubs++;
              }
            }
          }
        }
      } catch (stripeErr: any) {
        console.error('[VetBoarding DELETE] Stripe check error:', stripeErr);
      }
    }

    // Cascade cleanup
    const { data: inqs } = await supabaseAdmin.from('vet_inquiries').select('id').eq('clinic_id', clinic.id);
    if (inqs && inqs.length > 0) {
      await supabaseAdmin.from('messages').delete().in('booking_id', inqs.map(i => i.id));
    }
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
