import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import Stripe from 'stripe';
import { extractOgImage } from '@/lib/og-fetcher';
import { getUserProStatusDetails } from '@/lib/aiLimiter';
import { sendDaycareRegistrationEmail, sendAdminNewPartnerNotificationEmail, sendPartnerAccountDeletionEmail } from '@/lib/adoption-email';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const dynamic = 'force-dynamic';

// ─── GET /api/pet-daycare?email= ───────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 });
    }

    const { data: daycare, error } = await supabaseAdmin
      .from('pet_daycares')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    const noCacheHeaders = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };

    if (error) {
      console.error('[PetDaycare API] GET Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500, headers: noCacheHeaders });
    }

    return NextResponse.json({ daycare }, { headers: noCacheHeaders });
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

// ─── POST /api/pet-daycare — Register or Re-apply ──────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      business_name,
      license_number,
      email,
      phone,
      address,
      city,
      state,
      zip,
      website,
      description,
      services,
    } = body;

    let { logo_url } = body;

    if (!business_name || !email || (!city && !address)) {
      return NextResponse.json({ error: 'Missing required fields (business_name, email, city)' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Auto-fetch Open Graph logo if website is provided and manual photo is not supplied
    if (!logo_url && website) {
      try {
        const fetchedOgPhoto = await extractOgImage(website);
        if (fetchedOgPhoto) logo_url = fetchedOgPhoto;
      } catch (e) {
        console.log('[PetDaycare API] OG Image extraction skipped:', e);
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
        error: "This email already has an active AI Membership. Please cancel it on your Account page first if you'd like to register as a Pet Daycare partner instead."
      }, { status: 400 });
    }

    // Check for existing registration in other partner tables FIRST
    const { data: existingVet } = await supabaseAdmin.from('vet_clinics').select('id').eq('email', cleanEmail).maybeSingle();
    if (existingVet) {
      return NextResponse.json({
        error: 'This email is already registered as a Vet Boarding partner. Each business email may only have one active partner listing.'
      }, { status: 400 });
    }

    const { data: existingShelter } = await supabaseAdmin.from('shelters').select('id').eq('email', cleanEmail).maybeSingle();
    if (existingShelter) {
      return NextResponse.json({
        error: 'This email is already registered as a Shelter partner. Each business email may only have one active partner listing.'
      }, { status: 400 });
    }

    // Check if already registered in pet_daycares table
    const { data: existing } = await supabaseAdmin
      .from('pet_daycares')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'approved') {
        return NextResponse.json({
          daycare: existing,
          message: 'Your daycare account is already approved. Please access your dashboard.'
        });
      }

      // Re-application for pending or rejected daycare
      const { data: updatedDaycare, error: updateErr } = await supabaseAdmin
        .from('pet_daycares')
        .update({
          business_name,
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
          logo_url: logo_url || existing.logo_url || '',
          status: 'pending'
        })
        .eq('id', existing.id)
        .select('*')
        .single();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      sendDaycareRegistrationEmail(cleanEmail, business_name);
      sendAdminNewPartnerNotificationEmail('Pet Daycare', business_name, cleanEmail, finalCity, finalState, phone, website);

      return NextResponse.json({
        daycare: updatedDaycare,
        message: 'Application re-submitted! Pending admin review.'
      });
    }

    const { data: daycare, error } = await supabaseAdmin
      .from('pet_daycares')
      .insert({
        business_name,
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
        logo_url: logo_url || '',
        status: 'pending'
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST205') {
        return NextResponse.json({
          error: "Database table 'pet_daycares' does not exist in Supabase yet. Please run scratch/create-pet-daycares-table.sql in Supabase SQL Editor."
        }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    sendDaycareRegistrationEmail(cleanEmail, business_name);
    sendAdminNewPartnerNotificationEmail('Pet Daycare', business_name, cleanEmail, finalCity, finalState, phone, website);

    return NextResponse.json({ daycare, message: 'Application submitted! Pending admin review.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── PATCH /api/pet-daycare — Update Profile / Pause Status ────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      email,
      business_name,
      license_number,
      phone,
      address,
      city,
      state,
      zip,
      website,
      description,
      services,
      logo_url,
      is_paused
    } = body;

    if (!id && !email) {
      return NextResponse.json({ error: 'Missing daycare id or email' }, { status: 400 });
    }

    let updatedLogo = logo_url;
    if (!updatedLogo && website) {
      try {
        const fetchedOgPhoto = await extractOgImage(website);
        if (fetchedOgPhoto) updatedLogo = fetchedOgPhoto;
      } catch (e) {}
    }

    const updateFields: any = {};
    if (business_name !== undefined) updateFields.business_name = business_name;
    if (license_number !== undefined) updateFields.license_number = license_number;
    if (phone !== undefined) updateFields.phone = phone;
    if (website !== undefined) updateFields.website = website;
    if (description !== undefined) updateFields.description = description;
    if (services !== undefined) updateFields.services = services;
    if (updatedLogo !== undefined) updateFields.logo_url = updatedLogo;
    if (is_paused !== undefined) updateFields.is_paused = is_paused;

    if (city !== undefined || address !== undefined) {
      const locString = ((address || '') + ' ' + (city || '')).trim();
      if (locString) {
        const geo = await geocodeLocation(locString);
        if (geo) {
          updateFields.city = geo.city;
          updateFields.state = geo.state;
          updateFields.zip = geo.zip;
          updateFields.address = geo.formatted_address;
          if (geo.lat) updateFields.lat = geo.lat;
          if (geo.lng) updateFields.lng = geo.lng;
        } else {
          if (city !== undefined) updateFields.city = city;
          if (address !== undefined) updateFields.address = address;
          if (state !== undefined) updateFields.state = state;
          if (zip !== undefined) updateFields.zip = zip;
        }
      }
    }

    let query = supabaseAdmin.from('pet_daycares').update(updateFields);

    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('email', email.toLowerCase().trim());
    }

    const { data: daycare, error } = await query.select('*').single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ daycare });
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

    let query = supabaseAdmin.from('pet_daycares').select('*');
    if (id) {
      query = query.eq('id', id);
    } else if (email) {
      query = query.eq('email', email.toLowerCase().trim());
    }

    const { data: daycare } = await query.single();
    if (!daycare) {
      return NextResponse.json({ error: 'Pet daycare not found' }, { status: 404 });
    }

    // Cancel active Stripe subscriptions FIRST
    let canceledStripeSubs = 0;
    if (stripeSecretKey) {
      try {
        const stripe = new Stripe(stripeSecretKey);

        if (daycare.stripe_subscription_id) {
          try {
            await stripe.subscriptions.cancel(daycare.stripe_subscription_id);
            canceledStripeSubs++;
          } catch (e: any) {
            console.error('[Daycare DELETE] Error canceling subscription ID:', e.message);
          }
        }

        if (daycare.email) {
          const customers = await stripe.customers.list({
            email: daycare.email.toLowerCase().trim(),
            limit: 5,
          });

          for (const cust of customers.data) {
            const subs = await stripe.subscriptions.list({
              customer: cust.id,
              status: 'active',
            });

            for (const sub of subs.data) {
              if (sub.id !== daycare.stripe_subscription_id) {
                await stripe.subscriptions.cancel(sub.id);
                canceledStripeSubs++;
              }
            }
          }
        }
      } catch (stripeErr: any) {
        console.error('[Daycare DELETE] Stripe check error:', stripeErr);
      }
    }

    // Cascade cleanup
    await supabaseAdmin.from('pet_daycare_availability').delete().eq('daycare_id', daycare.id);
    await supabaseAdmin.from('daycare_inquiries').delete().eq('daycare_id', daycare.id);

    // Delete daycare record
    const { error: deleteErr } = await supabaseAdmin.from('pet_daycares').delete().eq('id', daycare.id);
    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    // Send confirmation email
    if (daycare.email) {
      sendPartnerAccountDeletionEmail(daycare.email, daycare.business_name, 'Pet Daycare');
    }

    return NextResponse.json({ success: true, message: 'Pet daycare account deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
