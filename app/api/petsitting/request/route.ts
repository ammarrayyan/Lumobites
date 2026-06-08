import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';
import { brandedEmail, emailStyles, formatSitterName } from '@/lib/email-template';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sitter_id, owner_email, pet_name, pet_type, dates, special_notes, phone_number, owner_name, time_slot } = body;

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
        time_slot: time_slot || null
      })
      .select('id, secure_token')
      .single();

    if (insertError || !insertedReq) {
      console.error('[PetSitting Request API] Supabase Insert Error:', insertError);
      return NextResponse.json({ error: insertError?.message || 'Database error' }, { status: 500 });
    }

    // 5. Send Email to Sitter via Resend
    const origin = request.nextUrl.origin;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
    const emailRes = await resend.emails.send({
      from: fromEmail,
      to: sitter.email,
      replyTo: cleanEmail,
      subject: `🐾 New Pet Sitting Request: ${booking_number} from ${owner_name || cleanEmail}`,
      html: brandedEmail({
        subject: `🐾 New Pet Sitting Request: ${booking_number}`,
        preheader: `${pet_name} needs a sitter! Respond to manage this request.`,
        body: `
    <h1 style="${emailStyles.h1}">New Pet Sitting Request! 🐾</h1>
    <p style="${emailStyles.p}">Hi <strong>${formatSitterName(sitter.name)}</strong>,</p>
    <p style="${emailStyles.p}">You have a new pet sitting request through Lumo Bites (<strong>${booking_number}</strong>). Here are the details:</p>
    ${emailStyles.divider}
    ${emailStyles.infoBox(`
      <p style="margin:0 0 10px 0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Booking Number:</strong> ${booking_number}</p>
      <p style="margin:0 0 10px 0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Owner Name:</strong> ${owner_name || 'N/A'}</p>
      <p style="margin:0 0 10px 0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Owner Email:</strong> ${cleanEmail}</p>
      ${phone_number ? `<p style="margin:0 0 10px 0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Owner Phone:</strong> ${phone_number}</p>` : ''}
      <p style="margin:0 0 10px 0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Pet Name:</strong> ${pet_name}</p>
      <p style="margin:0 0 10px 0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Pet Type:</strong> ${pet_type}</p>
      <p style="margin:0 0 10px 0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Dates Needed:</strong> ${dates} ${time_slot ? `— ${time_slot}` : ''}</p>
      <p style="margin:0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Notes:</strong> ${special_notes || 'None'}</p>
    `)}
    ${emailStyles.divider}
    <p style="${emailStyles.p}">Please respond to this request by clicking one of the buttons below:</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${origin}/api/petsitting/request/accept?id=${insertedReq.id}&token=${insertedReq.secure_token}" style="background-color:#10B981;color:#FFFFFF;font-weight:700;font-size:14px;text-decoration:none;padding:12px 24px;border-radius:10px;display:inline-block;margin-right:12px;">✅ Accept Booking</a>
      <a href="${origin}/api/petsitting/request/decline?id=${insertedReq.id}&token=${insertedReq.secure_token}" style="background-color:#EF4444;color:#FFFFFF;font-weight:700;font-size:14px;text-decoration:none;padding:12px 24px;border-radius:10px;display:inline-block;">❌ Decline Booking</a>
    </div>
    <p style="${emailStyles.p}">Alternatively, you can visit <a href="${origin}/petsitting" style="color:#8B5E3C;font-weight:bold;text-decoration:underline;">lumobites.net/petsitting</a> to manage your bookings.</p>
    ${emailStyles.signoff}
  `
      })
    });

    if (emailRes.error) {
      console.error('[PetSitting Request API] Resend Error:', emailRes.error);
      return NextResponse.json({ error: emailRes.error.message || 'Email service error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, booking_number });
  } catch (error: any) {
    console.error('[PetSitting Request API] Unhandled Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
