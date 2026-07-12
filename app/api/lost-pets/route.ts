import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import { randomUUID } from 'crypto';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const species = searchParams.get('species');
    const q = searchParams.get('q'); // city or zip
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;
    const radius = searchParams.get('radius') ? parseInt(searchParams.get('radius')!) : null;
    const status = searchParams.get('status');

    let query = supabaseAdmin.from('lost_pets').select('*').order('created_at', { ascending: false });

    if (type && type !== 'all') query = query.eq('pet_type', type);
    if (species && species !== 'all') query = query.eq('species', species);
    if (status) query = query.eq('status', status);
    if (q && !lat) { // Only fallback to text search if no lat/lng provided
      query = query.or(`city.ilike.%${q}%,zip_code.ilike.%${q}%`);
    }

    const { data, error } = await query;
    console.log('[Lost Pets API] Querying with params:', { type, species, status, q, lat, lng, radius });
    console.log('[Lost Pets API] Supabase response count:', data ? data.length : 0);

    if (error) {
      console.error('[Lost Pets API] Supabase error:', error);
      throw error;
    }

    // Helper function for Haversine distance
    const getDistanceInMiles = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 3958.8; // Radius of earth in miles
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // Filter out the edit_token from public responses, calculate distance, and format photos
    let sanitizedData = data.map(pet => {
      const { edit_token, pet_type, ...safePet } = pet;
      let distance = null;
      if (lat !== null && lng !== null && pet.latitude && pet.longitude) {
        distance = getDistanceInMiles(lat, lng, pet.latitude, pet.longitude);
      }

      // Format photos array with fallback parsing
      let photos = pet.photos;
      let cleanDesc = pet.description;
      
      if (!Array.isArray(photos) || photos.length === 0) {
        if (pet.description && pet.description.startsWith('{"photos":')) {
          try {
            const dividerIndex = pet.description.indexOf(' || ');
            if (dividerIndex !== -1) {
              const jsonStr = pet.description.substring(0, dividerIndex);
              const payload = JSON.parse(jsonStr);
              if (Array.isArray(payload.photos)) {
                photos = payload.photos;
              }
              cleanDesc = pet.description.substring(dividerIndex + 4);
            }
          } catch (e) {}
        }
      }

      if (!Array.isArray(photos) || photos.length === 0) {
        photos = pet.photo_url ? [pet.photo_url] : [];
      }

      return { 
        ...safePet, 
        type: pet_type, 
        distance,
        photos,
        description: cleanDesc
      };
    });

    if (lat !== null && lng !== null && radius) {
      sanitizedData = sanitizedData.filter(pet => pet.distance !== null && pet.distance <= radius);
      // Sort by distance
      sanitizedData.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    return NextResponse.json({ pets: sanitizedData });
  } catch (err: any) {
    console.error('[Lost Pets GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Lost Pets POST] Received body elements...');
    
    const {
      type, pet_name, species, photo_url, photo_urls, description,
      city, zip_code, contact_email, contact_phone, date_lost_found,
      latitude, longitude, notify_matches
    } = body;

    // Parse incoming photo targets: supports single and array formats
    const incomingUrls = Array.isArray(photo_urls)
      ? photo_urls
      : photo_url 
        ? [photo_url]
        : [];

    if (!type || !species || incomingUrls.length === 0 || !description || !city || (!contact_email && !contact_phone)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Upload all base64 photos to lost-pets bucket
    const finalPhotoUrls: string[] = [];
    for (const url of incomingUrls) {
      if (url && url.startsWith('data:image/')) {
        try {
          const matches = url.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const fileExt = matches[1] === 'jpeg' ? 'jpg' : matches[1];
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, 'base64');
            const fileName = `lost_${Date.now()}_${randomUUID()}.${fileExt}`;
            
            const { error: uploadError } = await supabaseAdmin.storage
              .from('lost-pets')
              .upload(fileName, buffer, {
                contentType: `image/${matches[1]}`,
                upsert: true
              });
              
            if (uploadError) throw uploadError;
            
            const { data: publicUrlData } = supabaseAdmin.storage
              .from('lost-pets')
              .getPublicUrl(fileName);
              
            finalPhotoUrls.push(publicUrlData.publicUrl);
          }
        } catch (uploadEx) {
          console.error('[Lost Pets] Failed to upload photo:', uploadEx);
          throw uploadEx;
        }
      } else if (url) {
        finalPhotoUrls.push(url);
      }
    }

    // 2. Generate edit token
    const editToken = randomUUID();

    // 3. Insert into DB with self-healing fallback
    let data = null;
    let dbError = null;

    try {
      const response = await supabaseAdmin.from('lost_pets').insert({
        pet_type: type,
        pet_name,
        species,
        photo_url: finalPhotoUrls[0] || '',
        photos: finalPhotoUrls,
        description,
        city,
        zip_code,
        latitude,
        longitude,
        contact_email: contact_email || null,
        contact_phone: contact_phone || null,
        date_lost_found,
        status: 'active',
        edit_token: editToken,
        notify_matches: notify_matches !== undefined ? notify_matches : true
      }).select().single();
      
      data = response.data;
      dbError = response.error;
    } catch (err) {
      dbError = err;
    }

    // Fallback: Store the array inside the description field if native photos column is not in DB yet
    if (dbError) {
      console.log('📦 Supabase direct photos column failed. Falling back to structured description encoding...');
      const encodedDesc = JSON.stringify({ photos: finalPhotoUrls }) + ' || ' + description;
      
      const response = await supabaseAdmin.from('lost_pets').insert({
        pet_type: type,
        pet_name,
        species,
        photo_url: finalPhotoUrls[0] || '',
        description: encodedDesc,
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
      
      if (response.error) throw response.error;
      data = response.data;
    }

    // 3.5 Extract AI features if API key is configured
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        console.log('[AI Features] Starting feature extraction for pet ID:', data.id);
        const featuresResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 500,
            messages: [{
              role: 'user',
              content: `Extract pet features from this description. Return ONLY JSON, no other text:
Description: "${description}"
Type: "${type}"

{
  "species": "dog or cat or other",
  "breed": "breed name or mixed or unknown", 
  "color": ["primary color", "secondary color"],
  "size": "small or medium or large",
  "markings": "any distinctive markings or none",
  "gender": "male or female or unknown",
  "age": "puppy/kitten or young or adult or senior or unknown"
}`
            }]
          })
        });
        
        if (!featuresResponse.ok) {
          throw new Error(`Anthropic API returned status ${featuresResponse.status}`);
        }
        
        const featuresData = await featuresResponse.json();
        const textContent = featuresData.content?.[0]?.text || '';
        const cleanText = textContent.replace(/```json|```/g, '').trim();
        const features = JSON.parse(cleanText);
        
        console.log('[AI Features] Extracted features successfully:', features);
        
        const { error: updateError } = await supabaseAdmin
          .from('lost_pets')
          .update({ ai_features: features })
          .eq('id', data.id);
          
        if (updateError) throw updateError;
        console.log('[AI Features] Database record updated successfully for ID:', data.id);
      } catch (err) {
        console.error('[AI Features] Feature extraction failed:', err);
        // Don't fail the whole request if AI extraction fails
      }
    } else {
      console.warn('[AI Features] ANTHROPIC_API_KEY is not defined. Skipping feature extraction.');
    }

    // 4. Send email if provided
    if (contact_email && process.env.RESEND_API_KEY) {
      console.log(`[Lost Pets POST] About to send email to: ${contact_email}`);
      let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lumobites.net';
      if (!siteUrl.startsWith('http')) {
        siteUrl = `https://${siteUrl}`;
      }
      const manageUrl = `${siteUrl}/lost-pets/manage?id=${data.id}&token=${editToken}`;
      
      try {
        const textContent = `Your post for ${pet_name || 'them'} has been shared!\n\nUse the links below to manage your post. Please do not share these secure links.\n\nManage Your Post:\nMark as Resolved: ${manageUrl}\nDelete My Post: ${manageUrl}\n\nYou can also manage your post directly on its page by visiting this secure link: ${siteUrl}/lost-pets/${data.id}?token=${editToken}`;

        const localResend = new Resend(process.env.RESEND_API_KEY);

        const resendResponse = await localResend.emails.send({
          from: 'Lumo Bites Pet <no-reply@lumobites.net>',
          to: contact_email,
          subject: `Manage your Lumo Bites lost pet post`,
          text: textContent,
          html: `
            <h1>Your post for ${pet_name || 'them'} has been shared!</h1>
            <p>Use the links below to manage your post. Please do not share these secure links.</p>
            <hr />
            <h3>Manage Your Post</h3>
            <p><a href="${manageUrl}">Mark as Resolved 🎉</a></p>
            <p><a href="${manageUrl}">Delete My Post</a></p>
            <br/>
            <p>You can also manage your post directly on its page by visiting this secure link: <a href="${siteUrl}/lost-pets/${data.id}?token=${editToken}">${siteUrl}/lost-pets/${data.id}?token=${editToken}</a></p>
          `
        });
        
        console.log('[Lost Pets POST] Resend called, response:', JSON.stringify(resendResponse, null, 2));
      } catch (emailError) {
        console.error('[Lost Pets POST] Resend threw an exception:', emailError);
      }
    }

    const { edit_token, pet_type, ...safePet } = data;
    
    // Parse formatting for immediate response
    let finalPhotos = data.photos;
    let finalDesc = data.description;
    if (!Array.isArray(finalPhotos) || finalPhotos.length === 0) {
      if (data.description && data.description.startsWith('{"photos":')) {
        try {
          const dividerIndex = data.description.indexOf(' || ');
          if (dividerIndex !== -1) {
            const jsonStr = data.description.substring(0, dividerIndex);
            const payload = JSON.parse(jsonStr);
            finalPhotos = payload.photos;
            finalDesc = data.description.substring(dividerIndex + 4);
          }
        } catch (e) {}
      }
    }
    if (!Array.isArray(finalPhotos) || finalPhotos.length === 0) {
      finalPhotos = data.photo_url ? [data.photo_url] : [];
    }

    return NextResponse.json({ 
      pet: { 
        ...safePet, 
        type: pet_type,
        photos: finalPhotos,
        description: finalDesc
      } 
    });
  } catch (err: any) {
    console.error('[Lost Pets POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
