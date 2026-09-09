import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendPushNotification } from '@/lib/push';

export const dynamic = 'force-dynamic';

/**
 * Parses appointment start time from date string and optional time slot.
 */
function parseAppointmentStartTime(dateStr?: string | null, timeSlotStr?: string | null): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;

  try {
    // 1. Extract the start date substring (e.g. "Sep 15, 2026 → Sep 18, 2026" or "2026-09-15 to 2026-09-18")
    const parts = dateStr.split(/\s*(?:→|->|to|–|—|-)\s*/i);
    const startDatePart = parts[0]?.trim();
    if (!startDatePart) return null;

    const parsedDate = new Date(startDatePart);
    if (isNaN(parsedDate.getTime())) return null;

    let startHour = 9; // Default 9:00 AM
    let startMinute = 0;

    // 2. Parse time slot if provided (e.g. "Morning (8am - 12pm)", "8:30 AM", "Afternoon", "Evening")
    if (timeSlotStr && typeof timeSlotStr === 'string') {
      const lowerSlot = timeSlotStr.toLowerCase();
      const timeMatch = lowerSlot.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
      
      if (timeMatch) {
        let hour = parseInt(timeMatch[1], 10);
        const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        const meridian = timeMatch[3].toLowerCase();

        if (meridian === 'pm' && hour < 12) hour += 12;
        if (meridian === 'am' && hour === 12) hour = 0;

        startHour = hour;
        startMinute = minute;
      } else if (lowerSlot.includes('morning')) {
        startHour = 8;
        startMinute = 0;
      } else if (lowerSlot.includes('afternoon')) {
        startHour = 12;
        startMinute = 0;
      } else if (lowerSlot.includes('evening')) {
        startHour = 16;
        startMinute = 0;
      } else if (lowerSlot.includes('overnight')) {
        startHour = 18;
        startMinute = 0;
      }
    }

    // Set local year, month, date, hour, minute
    const appointmentDate = new Date(
      parsedDate.getFullYear(),
      parsedDate.getMonth(),
      parsedDate.getDate(),
      startHour,
      startMinute,
      0,
      0
    );

    return isNaN(appointmentDate.getTime()) ? null : appointmentDate;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // 1. Validate Cron Secret (bypassed in local development or with valid admin key)
    const authHeader = request.headers.get('authorization');
    const adminKey = request.headers.get('x-admin-key') || request.nextUrl.searchParams.get('key');
    const expectedSecret = process.env.CRON_SECRET;
    const expectedAdminKey = process.env.ADMIN_BYPASS_KEY || process.env.ADMIN_KEY;

    const isAuthorized =
      (authHeader && expectedSecret && authHeader === `Bearer ${expectedSecret}`) ||
      (adminKey && expectedAdminKey && adminKey === expectedAdminKey) ||
      process.env.NODE_ENV !== 'production';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const sentReminders: any[] = [];
    let totalChecked = 0;

    // ─── A. PET SITTING BOOKINGS ─────────────────────────────────────────────
    const { data: sittingBookings, error: sitErr } = await supabaseAdmin
      .from('sitting_requests')
      .select('id, owner_email, pet_name, dates, time_slot, status, sitters(name, email)')
      .eq('status', 'accepted');

    if (sitErr) {
      console.error('[Booking Reminders] Sitting query error:', sitErr);
    } else if (sittingBookings) {
      totalChecked += sittingBookings.length;

      for (const booking of sittingBookings) {
        if (!booking.owner_email || !booking.dates) continue;

        const startTime = parseAppointmentStartTime(booking.dates, booking.time_slot);
        if (!startTime) continue;

        const diffHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Target reminder window: within 0 to 3.5 hours before appointment start
        if (diffHours > 0 && diffHours <= 3.5) {
          const bookingId = String(booking.id);
          const ownerEmail = booking.owner_email.toLowerCase().trim();

          // Deduplication check: Has a reminder already been dispatched for this booking?
          const { data: existingNotif } = await supabaseAdmin
            .from('notifications')
            .select('id')
            .eq('recipient_email', ownerEmail)
            .eq('type', 'booking_reminder')
            .eq('booking_id', bookingId)
            .maybeSingle();

          if (!existingNotif) {
            const sitterObj = Array.isArray(booking.sitters) ? booking.sitters[0] : booking.sitters;
            const sitterName = sitterObj?.name || 'your pet sitter';
            const petName = booking.pet_name || 'your pet';
            const deepLink = `/petsitting?booking=${bookingId}&tab=owner`;
            const title = 'Upcoming Appointment Reminder ⏰';
            const message = `Reminder: Your pet sitting appointment for ${petName} with ${sitterName} is in 3 hours.`;

            // 1. In-App Notification
            await supabaseAdmin.from('notifications').insert({
              recipient_email: ownerEmail,
              type: 'booking_reminder',
              title,
              message,
              link: deepLink,
              booking_id: bookingId,
              read: false,
            });

            // 2. Native Push Notification
            await sendPushNotification(ownerEmail, title, message, deepLink, {
              type: 'booking_reminder',
              bookingId,
              service: 'sitting',
            });

            // 3. Mark reminder_sent on booking if supported
            await supabaseAdmin
              .from('sitting_requests')
              .update({ reminder_sent: true })
              .eq('id', bookingId)
              .catch(() => {});

            sentReminders.push({
              service: 'sitting',
              bookingId,
              ownerEmail,
              startTime: startTime.toISOString(),
            });
          }
        }
      }
    }

    // ─── B. PET DAYCARE BOOKINGS ─────────────────────────────────────────────
    const { data: daycareBookings, error: dayErr } = await supabaseAdmin
      .from('daycare_inquiries')
      .select('id, owner_email, dates, time_slot, status, pet_daycares(business_name, email)')
      .in('status', ['accepted', 'confirmed', 'active'])
      .eq('archived', false);

    if (dayErr) {
      console.error('[Booking Reminders] Daycare query error:', dayErr);
    } else if (daycareBookings) {
      totalChecked += daycareBookings.length;

      for (const booking of daycareBookings) {
        if (!booking.owner_email || !booking.dates) continue;

        const startTime = parseAppointmentStartTime(booking.dates, booking.time_slot);
        if (!startTime) continue;

        const diffHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (diffHours > 0 && diffHours <= 3.5) {
          const bookingId = String(booking.id);
          const ownerEmail = booking.owner_email.toLowerCase().trim();

          const { data: existingNotif } = await supabaseAdmin
            .from('notifications')
            .select('id')
            .eq('recipient_email', ownerEmail)
            .eq('type', 'booking_reminder')
            .eq('booking_id', bookingId)
            .maybeSingle();

          if (!existingNotif) {
            const daycareObj = Array.isArray(booking.pet_daycares) ? booking.pet_daycares[0] : booking.pet_daycares;
            const daycareName = daycareObj?.business_name || 'your pet daycare';
            const deepLink = `/pet-daycare/dashboard?inquiry=${bookingId}`;
            const title = 'Upcoming Daycare Reminder ⏰';
            const message = `Reminder: Your pet daycare appointment with ${daycareName} is in 3 hours.`;

            // 1. In-App Notification
            await supabaseAdmin.from('notifications').insert({
              recipient_email: ownerEmail,
              type: 'booking_reminder',
              title,
              message,
              link: deepLink,
              booking_id: bookingId,
              read: false,
            });

            // 2. Native Push Notification
            await sendPushNotification(ownerEmail, title, message, deepLink, {
              type: 'booking_reminder',
              bookingId,
              service: 'daycare',
            });

            // 3. Update reminder flag
            await supabaseAdmin
              .from('daycare_inquiries')
              .update({ reminder_sent: true })
              .eq('id', bookingId)
              .catch(() => {});

            sentReminders.push({
              service: 'daycare',
              bookingId,
              ownerEmail,
              startTime: startTime.toISOString(),
            });
          }
        }
      }
    }

    // ─── C. VET BOARDING BOOKINGS ────────────────────────────────────────────
    const { data: vetBookings, error: vetErr } = await supabaseAdmin
      .from('vet_inquiries')
      .select('id, owner_email, dates, time_slot, status, vet_clinics(clinic_name, email)')
      .in('status', ['accepted', 'confirmed', 'active'])
      .eq('archived', false);

    if (vetErr) {
      console.error('[Booking Reminders] Vet query error:', vetErr);
    } else if (vetBookings) {
      totalChecked += vetBookings.length;

      for (const booking of vetBookings) {
        if (!booking.owner_email || !booking.dates) continue;

        const startTime = parseAppointmentStartTime(booking.dates, booking.time_slot);
        if (!startTime) continue;

        const diffHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (diffHours > 0 && diffHours <= 3.5) {
          const bookingId = String(booking.id);
          const ownerEmail = booking.owner_email.toLowerCase().trim();

          const { data: existingNotif } = await supabaseAdmin
            .from('notifications')
            .select('id')
            .eq('recipient_email', ownerEmail)
            .eq('type', 'booking_reminder')
            .eq('booking_id', bookingId)
            .maybeSingle();

          if (!existingNotif) {
            const clinicObj = Array.isArray(booking.vet_clinics) ? booking.vet_clinics[0] : booking.vet_clinics;
            const clinicName = clinicObj?.clinic_name || 'your vet clinic';
            const deepLink = `/vet-boarding/dashboard?inquiry=${bookingId}`;
            const title = 'Upcoming Vet Boarding Reminder ⏰';
            const message = `Reminder: Your vet boarding appointment with ${clinicName} is in 3 hours.`;

            // 1. In-App Notification
            await supabaseAdmin.from('notifications').insert({
              recipient_email: ownerEmail,
              type: 'booking_reminder',
              title,
              message,
              link: deepLink,
              booking_id: bookingId,
              read: false,
            });

            // 2. Native Push Notification
            await sendPushNotification(ownerEmail, title, message, deepLink, {
              type: 'booking_reminder',
              bookingId,
              service: 'vet',
            });

            // 3. Update reminder flag
            await supabaseAdmin
              .from('vet_inquiries')
              .update({ reminder_sent: true })
              .eq('id', bookingId)
              .catch(() => {});

            sentReminders.push({
              service: 'vet',
              bookingId,
              ownerEmail,
              startTime: startTime.toISOString(),
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      sentCount: sentReminders.length,
      totalChecked,
      reminders: sentReminders,
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    console.error('[Booking Reminders Cron Error]:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
