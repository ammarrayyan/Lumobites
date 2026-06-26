import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import { brandedEmail, emailStyles } from '@/lib/email-template';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('sitters')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json(null);
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[PetSitting Profile API] Error fetching:', error);
    return NextResponse.json({ error: 'Something went wrong loading your profile. Please try again or contact support at info@lumobitespet.com' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, name, photo_url, id_photo_url, city, zip, country, 
      bio, pet_types, rate_per_night, rate_type, availability, phone_number, phone_visible,
      gender, available_days, available_times, service_types, self_declared, blocked_dates,
      rate_dropins, rate_walking, rate_overnight, rate_boarding, rate_daycare,
      cover_photo_url, cover_photo_position
    } = body;

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    if (!photo_url) {
      return NextResponse.json({ error: 'Please upload a clear photo of your face' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    let resolvedCountry = country || '';

    // Geocode the address
    let lat = null;
    let lng = null;
    try {
      const addressParts = [city];
      if (zip && zip.trim() !== '') addressParts.push(zip);
      
      const cityLower = city.toLowerCase();
      const countryLower = resolvedCountry.toLowerCase();
      const hasCountry = resolvedCountry && (
        cityLower.includes(countryLower) || 
        (countryLower === 'united states' && (cityLower.includes('usa') || cityLower.includes('u.s.a.'))) ||
        (countryLower === 'united kingdom' && (cityLower.includes('uk') || cityLower.includes('u.k.')))
      );

      if (resolvedCountry && !hasCountry) {
        addressParts.push(resolvedCountry);
      }
      const address = addressParts.join(', ');
      
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_VISION_API_KEY;
      const isRealKey = apiKey && apiKey.startsWith('AIzaSy');

      if (apiKey && isRealKey) {
        const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`);
        const geoData = await geoRes.json();
        if (geoData.status === 'OK' && geoData.results && geoData.results.length > 0) {
          lat = geoData.results[0].geometry.location.lat;
          lng = geoData.results[0].geometry.location.lng;
          
          const countryComp = geoData.results[0].address_components?.find((c: any) => c.types.includes('country'));
          if (countryComp) {
            resolvedCountry = countryComp.long_name;
          }
        } else {
          console.warn(`[PetSitting Profile API] Geocoding returned status: ${geoData.status} for address: ${address}. Falling back to default coordinates.`);
          lat = 25.7617;
          lng = -80.1918;
        }
      } else {
        console.warn(`[PetSitting Profile API] Mock or missing Google Maps key. Using mock coordinates for address: ${address}`);
        lat = 25.7617;
        lng = -80.1918;
      }
    } catch (e) {
      console.error('[PetSitting Profile API] Geocoding error:', e);
      lat = 25.7617;
      lng = -80.1918;
    }

    let finalPhotoUrl = photo_url;
    if (photo_url && photo_url.startsWith('data:image/')) {
      try {
        const matches = photo_url.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const fileExt = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const base64Data = matches[2];
          
          // Google Vision API Face Detection
          const visionApiKey = process.env.GOOGLE_VISION_API_KEY;
          if (visionApiKey) {
            const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`;
            const visionRes = await fetch(visionUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                requests: [{
                  image: { content: base64Data },
                  features: [{ type: 'FACE_DETECTION' }]
                }]
              })
            });
            const visionData = await visionRes.json();
            const faces = visionData.responses?.[0]?.faceAnnotations;
            if (!faces || faces.length === 0) {
              return NextResponse.json({ error: 'Please upload a clear photo of your face' }, { status: 400 });
            }
          }

          const buffer = Buffer.from(base64Data, 'base64');
          const fileName = `${cleanEmail.replace(/[^a-z0-9]/g, '_')}_${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('sitter-photos')
            .upload(fileName, buffer, {
              contentType: `image/${matches[1]}`,
              upsert: true
            });
            
          if (uploadError) {
            console.warn('[PetSitting Profile] Supabase storage upload failed. Using raw/base64 URL fallback:', uploadError.message);
            finalPhotoUrl = photo_url;
          } else {
            const { data: publicUrlData } = supabaseAdmin.storage
              .from('sitter-photos')
              .getPublicUrl(fileName);
              
            finalPhotoUrl = publicUrlData.publicUrl;
          }
        }
      } catch (uploadEx) {
        console.error('[PetSitting Profile] Failed to upload photo:', uploadEx);
        finalPhotoUrl = photo_url;
      }
    }
    let finalCoverPhotoUrl = cover_photo_url || null;
    if (cover_photo_url && cover_photo_url.startsWith('data:image/')) {
      try {
        const matches = cover_photo_url.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const fileExt = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          const fileName = `${cleanEmail.replace(/[^a-z0-9]/g, '_')}_cover_${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('sitter-photos')
            .upload(fileName, buffer, {
              contentType: `image/${matches[1]}`,
              upsert: true
            });
            
          if (uploadError) {
            console.warn('[PetSitting Profile] Supabase storage cover upload failed. Using raw/base64 URL fallback:', uploadError.message);
            finalCoverPhotoUrl = cover_photo_url;
          } else {
            const { data: publicUrlData } = supabaseAdmin.storage
              .from('sitter-photos')
              .getPublicUrl(fileName);
              
            finalCoverPhotoUrl = publicUrlData.publicUrl;
          }
        }
      } catch (uploadEx) {
        console.error('[PetSitting Profile] Failed to upload cover photo:', uploadEx);
        finalCoverPhotoUrl = cover_photo_url;
      }
    }

    let finalIdUrl = id_photo_url;
    if (id_photo_url && id_photo_url.startsWith('data:image/')) {
      try {
        const matches = id_photo_url.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const fileExt = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          
          const fileName = `${cleanEmail.replace(/[^a-z0-9]/g, '_')}_id_${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('sitter-ids')
            .upload(fileName, buffer, {
              contentType: `image/${matches[1]}`,
              upsert: true
            });
            
          if (uploadError) {
            console.warn('[PetSitting Profile] Supabase storage ID upload failed. Using raw/base64 URL fallback:', uploadError.message);
            finalIdUrl = id_photo_url;
          } else {
            finalIdUrl = fileName; // Store just the path for private bucket
          }
        }
      } catch (uploadEx) {
        console.error('[PetSitting Profile] Failed to upload ID:', uploadEx);
        finalIdUrl = id_photo_url;
      }
    }

    const isNewPhoto = photo_url && photo_url.startsWith('data:image/');
    const isNewId = id_photo_url && id_photo_url.startsWith('data:image/');

    let nextApprovalStatus = 'pending';
    let nextIsApproved = false;
    let nextNeedsReapproval = false;
    let isInitialSubmission = true;
    let existingSitter: any = null;

    try {
      const { data } = await supabaseAdmin
        .from('sitters')
        .select('approval_status, is_approved, needs_reapproval, id_photo_url, self_declared, self_declared_at')
        .eq('email', cleanEmail)
        .maybeSingle();
      
      existingSitter = data;

      if (existingSitter) {
        isInitialSubmission = false;

        // Prevent changing ID if it's already on file
        if (existingSitter.id_photo_url) {
          finalIdUrl = existingSitter.id_photo_url;
        }

        if (isNewPhoto || (isNewId && !existingSitter.id_photo_url)) {
          nextApprovalStatus = 'pending';
          nextIsApproved = false;
          nextNeedsReapproval = true;
        } else {
          nextApprovalStatus = existingSitter.approval_status || 'pending';
          nextIsApproved = !!existingSitter.is_approved;
          nextNeedsReapproval = !!existingSitter.needs_reapproval;
        }
      }
    } catch (dbErr) {
      console.error('[PetSitting Profile] Failed to fetch existing sitter:', dbErr);
    }

    const { data, error } = await supabaseAdmin
      .from('sitters')
      .upsert({
        email: cleanEmail,
        name,
        photo_url: finalPhotoUrl,
        cover_photo_url: finalCoverPhotoUrl,
        cover_photo_position: cover_photo_position || 'center',
        id_photo_url: finalIdUrl,
        city,
        zip,
        country: resolvedCountry,
        lat,
        lng,
        phone_number: phone_number || null,
        phone_visible: phone_visible !== undefined ? phone_visible : false,
        bio,
        pet_types,
        rate_per_night: rate_per_night ? parseFloat(rate_per_night) : null,
        rate_type: rate_type || 'night',
        rate_dropins: rate_dropins ? parseFloat(rate_dropins) : null,
        rate_walking: rate_walking ? parseFloat(rate_walking) : null,
        rate_overnight: rate_overnight ? parseFloat(rate_overnight) : null,
        rate_boarding: rate_boarding ? parseFloat(rate_boarding) : null,
        rate_daycare: rate_daycare ? parseFloat(rate_daycare) : null,
        availability: availability !== undefined ? availability : true,
        available_days: available_days || [],
        available_times: available_times || [],
        service_types: service_types || [],
        gender: gender || null,
        self_declared: (existingSitter?.self_declared) || self_declared || false,
        self_declared_at: (existingSitter?.self_declared_at) || (self_declared ? new Date().toISOString() : null),
        approval_status: nextApprovalStatus,
        is_approved: nextIsApproved,
        needs_reapproval: nextNeedsReapproval,
        submitted_at: new Date().toISOString(),
        blocked_dates: blocked_dates || [],
        ...(cleanEmail === 'premierpetnutritionllc@gmail.com' || cleanEmail === 'reviewer@lumobites.net' ? { is_pro: true } : {})
      }, { onConflict: 'email', ignoreDuplicates: false })
      .select()
      .single();

    if (error) throw error;

    // Send admin notification email
    if (isInitialSubmission || (isNewPhoto || isNewId)) {
      try {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
        const adminEmail = process.env.ADMIN_EMAIL || 'info@lumobitespet.com';
        
        let subject = '';
        let bodyHtml = '';
        
        if (isInitialSubmission) {
          subject = 'New Sitter Application — Review Required';
          bodyHtml = `
            <h1 style="${emailStyles.h1}">New Sitter Application 🐾</h1>
            <p style="${emailStyles.p}">Hi Admin,</p>
            <p style="${emailStyles.p}">A new sitter has submitted their profile for review.</p>
            <p style="${emailStyles.p}"><strong>Sitter Name:</strong> ${name}</p>
            <p style="${emailStyles.p}"><strong>Sitter Email:</strong> ${cleanEmail}</p>
            ${emailStyles.button('https://lumobites.net/admin', 'Go to Admin Panel')}
            ${emailStyles.divider}
            ${emailStyles.signoff}
          `;
        } else {
          subject = 'Existing Sitter Updated Verification — Review Required';
          bodyHtml = `
            <h1 style="${emailStyles.h1}">Existing Sitter Updated Verification 🐾</h1>
            <p style="${emailStyles.p}">Hi Admin,</p>
            <p style="${emailStyles.p}">An existing verified sitter has updated their photo or ID and needs re-verification. This is NOT a new application.</p>
            <p style="${emailStyles.p}"><strong>Sitter Name:</strong> ${name}</p>
            <p style="${emailStyles.p}"><strong>Sitter Email:</strong> ${cleanEmail}</p>
            <p style="${emailStyles.p}" style="color: #d97706; font-weight: bold;">⚠️ This sitter was previously approved. Please review their updated verification documents.</p>
            ${emailStyles.button('https://lumobites.net/admin', 'Go to Admin Panel')}
            ${emailStyles.divider}
            ${emailStyles.signoff}
          `;
        }

        const adminRes = await resend.emails.send({
          from: fromEmail,
          to: adminEmail,
          subject,
          html: brandedEmail({
            subject,
            preheader: isInitialSubmission 
              ? `New sitter application from ${name}.`
              : `Existing sitter ${name} updated their verification.`,
            body: bodyHtml
          })
        });
        if (adminRes.error) {
          console.error('[PetSitting Profile API] Resend admin email error:', adminRes.error);
        } else {
          console.log(`[PetSitting Profile API] Admin review notification sent for: ${cleanEmail}`);
        }
      } catch (adminEmailErr) {
        console.error('[PetSitting Profile API] Failed to send admin notification email:', adminEmailErr);
      }
    }

    // Send application confirmation email ONLY if it's initial submission OR a new photo/ID is uploaded for re-approval
    if (isInitialSubmission || isNewPhoto || isNewId) {
      try {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
        const subject = nextNeedsReapproval 
          ? 'Your Updated Lumo Bites Profile is Under Review 🐾' 
          : 'Your Lumo Bites Sitter Application is Under Review 🐾';
        const bodyHtml = nextNeedsReapproval
          ? `
              <h1 style="${emailStyles.h1}">Updates Received 🐾</h1>
              <p style="${emailStyles.p}">Hi ${name},</p>
              <p style="${emailStyles.p}">Your updated verification has been submitted for review. Your profile remains active while we review.</p>
              ${emailStyles.highlightBox(`
                <p style="margin:0;font-size:12px;color:#8B6A50;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Application Status</p>
                <p style="margin:8px 0 0 0;font-size:24px;font-weight:800;color:#8B5E3C;">⏳ RE-REVIEW PENDING</p>
                <p style="margin:8px 0 0 0;font-size:13px;color:#666666;line-height:1.4;">We review photo updates as quickly as possible, usually within 24 hours.</p>
              `)}
              ${emailStyles.divider}
              ${emailStyles.signoff}
            `
          : `
              <h1 style="${emailStyles.h1}">Application Received 🐾</h1>
              <p style="${emailStyles.p}">Hi ${name},</p>
              <p style="${emailStyles.p}">Thank you for applying to become a pet sitter on Lumo Bites! We have received your profile details and our safety team is currently reviewing your application.</p>
              ${emailStyles.highlightBox(`
                <p style="margin:0;font-size:12px;color:#8B6A50;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Application Status</p>
                <p style="margin:8px 0 0 0;font-size:24px;font-weight:800;color:#8B5E3C;">⏳ PENDING REVIEW</p>
                <p style="margin:8px 0 0 0;font-size:13px;color:#666666;line-height:1.4;">We review applications in the order they are received, usually within 24 to 48 hours. You will receive another email from us as soon as your status is updated.</p>
              `)}
              <p style="${emailStyles.p}">While you wait, feel free to visit the Lumo Bites community board or manage your settings.</p>
              ${emailStyles.divider}
              ${emailStyles.signoff}
            `;

        const confirmRes = await resend.emails.send({
          from: fromEmail,
          to: cleanEmail,
          subject,
          html: brandedEmail({
            subject,
            preheader: nextNeedsReapproval 
              ? 'Your profile photo update is being reviewed by our safety team.'
              : 'We are reviewing your sitter profile. You will receive an email as soon as it is approved!',
            body: bodyHtml
          })
        });
        if (confirmRes.error) {
          console.error('[PetSitting Profile API] Resend confirmation email error:', confirmRes.error);
        } else {
          console.log(`[PetSitting Profile API] Application confirmation email sent to: ${cleanEmail}`);
        }
      } catch (emailErr) {
        console.error('[PetSitting Profile API] Failed to send confirmation email:', emailErr);
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[PetSitting Profile API] Error saving:', error);
    return NextResponse.json({ error: 'Something went wrong saving your profile. Please try again or contact support at info@lumobitespet.com' }, { status: 500 });
  }
}
