import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { sendPushNotification } from '@/lib/push';
import { Resend } from 'resend';
import { brandedEmail, emailStyles, formatSitterName } from '@/lib/email-template';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sitter_id, owner_email, pet_name, pet_type, dates, special_notes, phone_number, owner_name, time_slot, pet_id, pet_details } = body;

    if (!sitter_id || !owner_email || !pet_name || !pet_type || !dates) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cleanEmail = owner_email.toLowerCase().trim();

    // 1. Check if owner is PRO (Code intact for future)
    const { data: emailData } = await supabase
      .from('emails')
      .select('is_pro')
      .eq('email', cleanEmail)
      .single();

    const isOwnerPro = emailData?.is_pro || false;

    // 2. Get Sitter details
    const { data: sitter, error: sitterError } = await supabase
      .from('sitters')
      .select('email, name, phone_number, available_times')
      .eq('id', sitter_id)
      .single();

    if (sitterError || !sitter) {
      return NextResponse.json({ error: 'Sitter not found' }, { status: 404 });
    }

    if (sitter.email && cleanEmail.toLowerCase() === sitter.email.toLowerCase()) {
      return NextResponse.json({ error: 'You cannot request yourself as a sitter' }, { status: 400 });
    }

    // Rate Limiting: Limit booking requests to max 5 pending requests per owner at once
    const { count: pendingCount, error: pendingError } = await supabaseAdmin
      .from('sitting_requests')
      .select('id', { count: 'exact', head: true })
      .eq('owner_email', cleanEmail)
      .eq('status', 'pending');

    if (pendingError) {
      console.error('[Request POST] Pending count check error:', pendingError);
    } else if (pendingCount !== null && pendingCount >= 5) {
      return NextResponse.json({ error: 'You have too many pending requests. Please wait for responses before sending more.' }, { status: 400 });
    }

    // Check if owner already has a pending request with this same sitter
    const { data: existingSitterPending, error: existingSitterPendingError } = await supabaseAdmin
      .from('sitting_requests')
      .select('id')
      .eq('owner_email', cleanEmail)
      .eq('sitter_id', sitter_id)
      .eq('status', 'pending')
      .limit(1);

    if (existingSitterPendingError) {
      console.error('[Request POST] Existing sitter pending check error:', existingSitterPendingError);
    } else if (existingSitterPending && existingSitterPending.length > 0) {
      return NextResponse.json({ error: 'You already have a pending request with this sitter. Please wait for them to respond before sending another request.' }, { status: 400 });
    }


    // Validation: Check if requested time slot is in sitter's available times
    if (time_slot) {
      const sitterAvailable = sitter.available_times || [];
      let isAvailable = sitterAvailable.includes(time_slot);
      if (!isAvailable) {
        // Fallback mapping for old/new values
        const slotLower = time_slot.toLowerCase();
        isAvailable = sitterAvailable.some((s: string) => {
          const sLower = s.toLowerCase();
          if (sLower === slotLower) return true;
          if (slotLower.includes('morning') && (sLower === 'morning' || sLower.includes('6am-12pm'))) return true;
          if (slotLower.includes('afternoon') && (sLower === 'afternoon' || sLower.includes('12pm-6pm'))) return true;
          if (slotLower.includes('evening') && (sLower === 'evening' || sLower.includes('6pm-10pm'))) return true;
          if (slotLower.includes('overnight') && (sLower === 'overnight' || sLower.includes('9pm-8am'))) return true;
          if (slotLower.includes('full day') && (sLower === 'full day' || sLower === 'flexible')) return true;
          return false;
        });
      }
      if (!isAvailable) {
        return NextResponse.json({ error: `This sitter is not available during ${time_slot} — please select another time` }, { status: 400 });
      }

      // Check for slot overlaps with existing accepted bookings
      const parseBookingDates = (dateStr: string) => {
        if (!dateStr) return null;
        const parts = dateStr.split(' → ');
        if (parts.length === 2) {
          const start = new Date(parts[0]);
          const end = new Date(parts[1]);
          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            return { start, end };
          }
        }
        return null;
      };

      const getDatesInRange = (startDate: Date, endDate: Date) => {
        const dates: string[] = [];
        let current = new Date(startDate);
        while (current <= endDate) {
          dates.push(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 1);
        }
        return dates;
      };

      const parsedRequested = parseBookingDates(dates);
      const requestedDatesInRange = parsedRequested ? getDatesInRange(parsedRequested.start, parsedRequested.end) : [];

      if (requestedDatesInRange.length > 0) {
        const { data: existingBookings, error: existingBookingsError } = await supabase
          .from('sitting_requests')
          .select('dates, time_slot')
          .eq('sitter_id', sitter_id)
          .eq('status', 'accepted');

        if (existingBookingsError) {
          console.error('[Request POST] Fetch Existing Bookings Error:', existingBookingsError);
          return NextResponse.json({ error: 'Failed to validate availability' }, { status: 500 });
        }

        const slotsOverlap = (slotA: string | null, slotB: string | null) => {
          if (!slotA || !slotB) return true; // Legacy bookings block everything

          const normalize = (slot: string) => {
            const lower = slot.toLowerCase();
            if (lower.includes('morning')) return 'morning';
            if (lower.includes('afternoon')) return 'afternoon';
            if (lower.includes('evening')) return 'evening';
            if (lower.includes('overnight')) return 'overnight';
            if (lower.includes('full day') || lower === 'flexible') return 'full day';
            return lower;
          };

          const nA = normalize(slotA);
          const nB = normalize(slotB);
          if (nA === 'full day' && nB !== 'overnight') return true;
          if (nB === 'full day' && nA !== 'overnight') return true;
          return nA === nB;
        };

        const hasOverlap = (existingBookings || []).some((booking: any) => {
          const parsedExisting = parseBookingDates(booking.dates);
          const existingDatesInRange = parsedExisting ? getDatesInRange(parsedExisting.start, parsedExisting.end) : [];
          const dateIntersection = requestedDatesInRange.some(d => existingDatesInRange.includes(d));
          if (dateIntersection) {
            return slotsOverlap(booking.time_slot, time_slot);
          }
          return false;
        });

        if (hasOverlap) {
          return NextResponse.json({ error: `The time slot '${time_slot}' is already booked on one or more of the selected dates.` }, { status: 400 });
        }
      }
    }

    // 3. Generate sequential booking number
    const { count, error: countError } = await supabase
      .from('sitting_requests')
      .select('id', { count: 'exact', head: true });

    const countVal = count !== null ? count : 0;
    const booking_number = `Booking #${countVal + 1}`;

    // 4. Insert Request Record
    const { data: insertedReq, error: insertError } = await supabase
      .from('sitting_requests')
      .insert({
        owner_email: cleanEmail,
        owner_name: owner_name || null,
        sitter_id,
        pet_name,
        pet_type,
        dates,
        special_notes,
        phone_number: phone_number || null,
        booking_number,
        status: 'pending',
        time_slot: time_slot || null,
        pet_id: pet_id || null,
        pet_details: pet_details || null
      })
      .select('id, secure_token')
      .single();

    if (insertError || !insertedReq) {
      console.error('[PetSitting Request API] Supabase Insert Error:', insertError);
      return NextResponse.json({ error: insertError?.message || 'Database error' }, { status: 500 });
    }

    // Generate care plan silently in the background
    if (process.env.ANTHROPIC_API_KEY) {
      const selectedPetIds = pet_details?.pets?.map((p: any) => p.id).filter(Boolean) || (pet_id ? [pet_id] : []);
      if (selectedPetIds.length > 0) {
        (async () => {
          try {
            console.log('[Care Plan Background] Starting care plan generation for request:', insertedReq.id);
            const { data: pets, error: petsErr } = await supabaseAdmin
              .from('owner_pets')
              .select('*')
              .in('id', selectedPetIds);

            if (petsErr) {
              console.error('[Care Plan Background] Error fetching pets:', petsErr);
              return;
            }

            if (pets && pets.length > 0) {
              const careplanResponse = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': process.env.ANTHROPIC_API_KEY!,
                  'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                  model: 'claude-sonnet-4-6',
                  max_tokens: 1000,
                  messages: [{
                    role: 'user',
                    content: `Create a professional pet care plan for a pet sitter based on this pet profile data:

Current Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

${pets.map(pet => `
Pet Name: ${pet.pet_name}
Species: ${pet.pet_type}
Breed: ${pet.breed || 'Not specified'}
Age: ${pet.age || 'Not specified'}
Weight: ${pet.weight || 'Not specified'}
Gender: ${pet.gender || 'Not specified'}
Spayed/Neutered: ${pet.spayed_neutered ? 'Yes' : 'No'}
Feeding Schedule: ${pet.feeding_schedule || 'Not specified'}
Medications: ${pet.medication || 'None'}
Behavior Notes: ${pet.behavior_notes || 'None'}
Primary Vet: ${pet.vet_name || 'Not specified'}
Vet Phone: ${pet.vet_phone || 'Not specified'}
`).join('\n')}

Format as a clean, professional care plan the sitter can follow easily.
Use clear sections with headers.
Be concise and practical.

Important: This is a digital care plan for a mobile app. 
Do NOT include signature lines, date fields, physical document 
formatting, or emojis. Keep it clean, professional and digital.`
                  }]
                })
              });

              if (!careplanResponse.ok) {
                console.error('[Care Plan Background] Anthropic API returned status:', careplanResponse.status);
                return;
              }

              const careplanData = await careplanResponse.json();
              const carePlan = careplanData.content[0].text;

              const { error: updateErr } = await supabaseAdmin
                .from('sitting_requests')
                .update({ care_plan: carePlan })
                .eq('id', insertedReq.id);

              if (updateErr) {
                console.error('[Care Plan Background] Supabase update error:', updateErr);
              } else {
                console.log('[Care Plan Background] Care plan generated and saved successfully for request:', insertedReq.id);
              }
            }
          } catch (err) {
            console.error('[Care Plan Background] Error in background execution:', err);
          }
        })();
      }
    }

    // Notification
    try {
      const { error: notifErr } = await supabaseAdmin.from('notifications').insert({
        recipient_email: sitter.email,
        type: 'booking_request',
        title: 'New Booking Request! 🐾',
        message: `${owner_name || 'An owner'} has sent you a pet sitting request`,
        link: '/petsitting?section=sitter-dashboard&tab=requests',
        booking_id: insertedReq.id
      });
      if (notifErr) {
        console.error('[PetSitting Request] Notification insert error:', notifErr);
      }
    } catch (err) {
      console.error('[PetSitting Request] Notification exception:', err);
    }

    try {
      await sendPushNotification(
        sitter.email,
        'New Booking Request! 🐾',
        `${owner_name || 'An owner'} has sent you a pet sitting request`,
        '/petsitting?section=sitter-dashboard&tab=requests',
        { type: 'booking_request', requestId: insertedReq.id }
      );
    } catch (err) {
      console.error('[PetSitting Request] Push error:', err);
    }

    // 5. Send Email to Sitter via Resend
    const origin = request.nextUrl.origin;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
    try {
      const emailRes = await resend.emails.send({
        from: fromEmail,
        to: sitter.email,
      replyTo: cleanEmail,
      subject: `🐾 New Pet Sitting Request: ${booking_number} from ${owner_name ? formatSitterName(owner_name) : cleanEmail}`,
      html: brandedEmail({
        subject: `🐾 New Pet Sitting Request: ${booking_number}`,
        preheader: `${pet_name} needs a sitter! Respond to manage this request.`,
        body: `
    <h1 style="${emailStyles.h1}">New Pet Sitting Request! 🐾</h1>
    <p style="${emailStyles.p}">Hi <strong>${formatSitterName(sitter.name)}</strong>,</p>
    <p style="${emailStyles.p}">You have a new pet sitting request through Lumo Bites (<strong>${booking_number}</strong>). Here are the details:</p>
    ${emailStyles.infoBox(`
      <p style="margin:0 0 10px 0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Booking Number:</strong> ${booking_number}</p>
      <p style="margin:0 0 10px 0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Owner Name:</strong> ${owner_name ? formatSitterName(owner_name) : 'N/A'}</p>
      <p style="margin:0 0 10px 0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Pet Name:</strong> ${pet_name}</p>
      <p style="margin:0 0 10px 0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Pet Type:</strong> ${pet_type}</p>
      <p style="margin:0 0 10px 0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Dates Needed:</strong> ${dates} ${time_slot ? `— ${time_slot}` : ''}</p>
      <p style="margin:0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Notes:</strong> ${special_notes || 'None'}</p>
    `)}
    ${emailStyles.divider}
    <p style="${emailStyles.p}">You can message the owner directly on Lumo Bites — log in to your dashboard to view and reply to this request.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${origin}/petsitting" style="background-color:#8B5E3C;color:#FFFFFF;font-weight:700;font-size:14px;text-decoration:none;padding:12px 24px;border-radius:10px;display:inline-block;margin-bottom:12px;">View Request → lumobites.net/petsitting</a>
      <br/>
      <a href="${origin}/api/petsitting/request/accept?id=${insertedReq.id}&token=${insertedReq.secure_token}" style="background-color:#10B981;color:#FFFFFF;font-weight:700;font-size:14px;text-decoration:none;padding:12px 24px;border-radius:10px;display:inline-block;margin-right:12px;">✓ Accept Booking</a>
      <a href="${origin}/api/petsitting/request/decline?id=${insertedReq.id}&token=${insertedReq.secure_token}" style="background-color:#EF4444;color:#FFFFFF;font-weight:700;font-size:14px;text-decoration:none;padding:12px 24px;border-radius:10px;display:inline-block;">✕ Decline Booking</a>
    </div>
    ${emailStyles.signoff}
  `
        })
      });

      if (emailRes.error) {
        console.error('[PetSitting Request API] Resend Error:', emailRes.error);
      }
    } catch (err) {
      console.error('[PetSitting Request API] Email sending failed:', err);
    }

    // 6. Return success
    return NextResponse.json({ success: true, booking_number });
  } catch (error: any) {
    console.error('[PetSitting Request API] Unhandled Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('sitting_requests')
      .select('status')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[Request GET] Supabase Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, status: data.status });
  } catch (err: any) {
    console.error('[Request GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
