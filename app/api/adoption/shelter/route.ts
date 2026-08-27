import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import Stripe from 'stripe';
import { sendShelterRegistrationEmail, sendAdminNewPartnerNotificationEmail, sendPartnerAccountDeletionEmail } from '@/lib/adoption-email';
import { extractOgImage } from '@/lib/og-fetcher';
import { getUserProStatusDetails } from '@/lib/aiLimiter';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

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
        formatted_address: formatted_address || fullAddress,
        city,
        state,
        zip: postal_code,
      };
    }
  } catch (e) {
    console.error('Geocoding error:', e);
  }
  return null;
}

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

    const noCacheHeaders = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };

    if (error || !shelter) {
      return NextResponse.json({ shelter: null }, { headers: noCacheHeaders });
    }

    return NextResponse.json({ shelter }, { headers: noCacheHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { org_name, tax_id, email, phone, address, city, state, zip, website } = body;
    let { org_photo_url } = body;

    if (!org_name || !email || (!city && !address)) {
      return NextResponse.json({ error: 'Missing required organization details (org_name, email, city)' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Auto-fetch Open Graph image if website is provided and manual photo is not supplied
    if (!org_photo_url && website) {
      try {
        const fetchedOgPhoto = await extractOgImage(website);
        if (fetchedOgPhoto) org_photo_url = fetchedOgPhoto;
      } catch (e) {
        console.log('[Shelter API] OG Image extraction skipped/failed:', e);
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
        error: "This email already has an active AI Membership. Please cancel it on your Account page first if you'd like to register as a Shelter partner instead."
      }, { status: 400 });
    }

    // Check for existing registration in other partner tables FIRST
    const { data: existingVet } = await supabaseAdmin.from('vet_clinics').select('id').eq('email', cleanEmail).maybeSingle();
    if (existingVet) {
      return NextResponse.json({
        error: 'This email is already registered as a Vet Boarding partner. Each business email may only have one active partner listing.'
      }, { status: 400 });
    }

    const { data: existingDaycare } = await supabaseAdmin.from('pet_daycares').select('id').eq('email', cleanEmail).maybeSingle();
    if (existingDaycare) {
      return NextResponse.json({
        error: 'This email is already registered as a Pet Daycare partner. Each business email may only have one active partner listing.'
      }, { status: 400 });
    }

    // Check if already registered in shelters table
    const { data: existing } = await supabaseAdmin
      .from('shelters')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if (existing) {
      if (existing.status === 'approved') {
        return NextResponse.json({
          shelter: existing,
          message: 'Your shelter account is already approved. Please log in to your dashboard.'
        });
      }

      // Re-application for pending or rejected shelter: reset status to pending & update fields
      const { data: updatedShelter, error: updateErr } = await supabaseAdmin
        .from('shelters')
        .update({
          org_name,
          tax_id: tax_id || existing.tax_id || '',
          phone: phone || existing.phone || '',
          address: finalAddress,
          city: finalCity,
          state: finalState,
          zip: finalZip,
          lat: finalLat,
          lng: finalLng,
          website: website || existing.website || '',
          org_photo_url: org_photo_url || existing.org_photo_url || '',
          status: 'pending' // Reset to pending for admin review
        })
        .eq('id', existing.id)
        .select('*')
        .single();

      if (updateErr) {
        console.error('[Shelter API] Re-application update error:', updateErr);
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      // Send confirmation email to applicant & notification to admin
      sendShelterRegistrationEmail(cleanEmail, org_name);
      sendAdminNewPartnerNotificationEmail('Shelter', org_name, cleanEmail, finalCity, finalState, phone, website);

      return NextResponse.json({
        shelter: updatedShelter,
        message: 'Application re-submitted! Pending admin review.'
      });
    }

    const { data: shelter, error } = await supabaseAdmin
      .from('shelters')
      .insert({
        org_name,
        tax_id: tax_id || '',
        email: cleanEmail,
        phone: phone || '',
        address: finalAddress,
        city: finalCity,
        state: finalState,
        zip: finalZip,
        lat: finalLat,
        lng: finalLng,
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

    // Send email notification to shelter & admin
    sendShelterRegistrationEmail(cleanEmail, org_name);
    sendAdminNewPartnerNotificationEmail('Shelter', org_name, cleanEmail, finalCity, finalState, phone, website);

    return NextResponse.json({ shelter, message: 'Application submitted! Pending admin review.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      email,
      org_name,
      tax_id,
      phone,
      org_photo_url,
      website,
      address,
      city,
      state,
      zip,
      is_paused,
      description,
      gallery_urls,
      hours,
      starting_rate,
      pricing_type,
      pricing_note,
    } = body;

    if (!id && !email) {
      return NextResponse.json({ error: 'Missing shelter id or email' }, { status: 400 });
    }

    const { data: existingShelter } = await supabaseAdmin
      .from('shelters')
      .select('*')
      .or(id ? `id.eq.${id}` : `email.eq.${email.toLowerCase().trim()}`)
      .maybeSingle();

    let updatedPhoto = org_photo_url;
    if (!updatedPhoto && website) {
      try {
        const fetchedOgPhoto = await extractOgImage(website);
        if (fetchedOgPhoto) updatedPhoto = fetchedOgPhoto;
      } catch (e) {}
    }

    const { extractPartnerMeta, packPartnerDescription } = await import('@/lib/partnerProfileHelper');
    const existingMeta = extractPartnerMeta(existingShelter);

    const mergedMeta = {
      hours: hours !== undefined ? hours : existingMeta.hours,
      gallery: gallery_urls !== undefined ? gallery_urls : existingMeta.gallery,
      pricing: {
        startingRate: starting_rate !== undefined ? starting_rate : existingMeta.pricing.startingRate,
        pricingType: pricing_type !== undefined ? pricing_type : existingMeta.pricing.pricingType,
        pricingNote: pricing_note !== undefined ? pricing_note : existingMeta.pricing.pricingNote,
        unit: 'adoption',
      },
    };

    const rawCleanDesc = description !== undefined ? description : existingMeta.cleanDescription;
    const packedDescription = packPartnerDescription(rawCleanDesc, mergedMeta);

    const updateFields: any = {
      description: packedDescription,
    };
    if (org_name !== undefined) updateFields.org_name = org_name;
    if (tax_id !== undefined) updateFields.tax_id = tax_id;
    if (phone !== undefined) updateFields.phone = phone;
    if (website !== undefined) updateFields.website = website;
    if (updatedPhoto !== undefined) updateFields.org_photo_url = updatedPhoto;
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

    let query = supabaseAdmin.from('shelters').update(updateFields);

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

    let query = supabaseAdmin.from('shelters').select('*');
    if (id) {
      query = query.eq('id', id);
    } else if (email) {
      query = query.eq('email', email.toLowerCase().trim());
    }

    const { data: shelter } = await query.single();
    if (!shelter) {
      return NextResponse.json({ error: 'Shelter not found' }, { status: 404 });
    }

    // Cancel active Stripe subscriptions FIRST
    let canceledStripeSubs = 0;
    if (stripeSecretKey) {
      try {
        const stripe = new Stripe(stripeSecretKey);

        if (shelter.stripe_subscription_id) {
          try {
            await stripe.subscriptions.cancel(shelter.stripe_subscription_id);
            canceledStripeSubs++;
          } catch (e: any) {
            console.error('[Shelter DELETE] Error canceling subscription ID:', e.message);
          }
        }

        if (shelter.email) {
          const customers = await stripe.customers.list({
            email: shelter.email.toLowerCase().trim(),
            limit: 5,
          });

          for (const cust of customers.data) {
            const subs = await stripe.subscriptions.list({
              customer: cust.id,
              status: 'active',
            });

            for (const sub of subs.data) {
              if (sub.id !== shelter.stripe_subscription_id) {
                await stripe.subscriptions.cancel(sub.id);
                canceledStripeSubs++;
              }
            }
          }
        }
      } catch (stripeErr: any) {
        console.error('[Shelter DELETE] Stripe check error:', stripeErr);
      }
    }

    // Cascade cleanup
    await supabaseAdmin.from('adoption_pets').delete().eq('shelter_id', shelter.id);
    await supabaseAdmin.from('adoption_messages').delete().eq('shelter_id', shelter.id);

    // Delete shelter record
    const { error: deleteErr } = await supabaseAdmin.from('shelters').delete().eq('id', shelter.id);
    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    // Send confirmation email
    if (shelter.email) {
      sendPartnerAccountDeletionEmail(shelter.email, shelter.org_name, 'Shelter');
    }

    return NextResponse.json({ success: true, message: 'Shelter account deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
