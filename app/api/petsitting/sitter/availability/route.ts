import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sitterId = searchParams.get('sitter_id');
    const email = searchParams.get('email');

    if (!sitterId && !email) {
      return NextResponse.json({ error: 'sitter_id or email is required' }, { status: 400 });
    }

    let query = supabaseAdmin.from('sitters').select('id, blocked_dates, available_days');
    if (sitterId) {
      query = query.eq('id', sitterId);
    } else {
      query = query.eq('email', email!.toLowerCase().trim());
    }

    const { data: sitter, error: sitterError } = await query.maybeSingle();

    if (sitterError) {
      console.error('[Availability GET] Fetch Sitter Error:', sitterError);
      return NextResponse.json({ error: sitterError.message }, { status: 500 });
    }

    if (!sitter) {
      return NextResponse.json({ error: 'Sitter not found' }, { status: 404 });
    }

    // Fetch accepted bookings
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('sitting_requests')
      .select('booking_number, dates, status')
      .eq('sitter_id', sitter.id)
      .eq('status', 'accepted');

    if (bookingsError) {
      console.error('[Availability GET] Fetch Bookings Error:', bookingsError);
      return NextResponse.json({ error: bookingsError.message }, { status: 500 });
    }

    // Helper to parse dates like "Jun 5, 2026 → Jun 8, 2026"
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

    // Helper to get dates between start and end in YYYY-MM-DD format
    const getDatesInRange = (startDate: Date, endDate: Date) => {
      const dates: string[] = [];
      let current = new Date(startDate);
      while (current <= endDate) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
      return dates;
    };

    const accepted_bookings = (bookings || []).map((booking: any) => {
      const parsed = parseBookingDates(booking.dates);
      const dates_in_range = parsed ? getDatesInRange(parsed.start, parsed.end) : [];
      return {
        booking_number: booking.booking_number,
        start_date: parsed ? parsed.start.toISOString().split('T')[0] : null,
        end_date: parsed ? parsed.end.toISOString().split('T')[0] : null,
        dates_in_range
      };
    });

    return NextResponse.json({
      success: true,
      blocked_dates: sitter.blocked_dates || [],
      available_days: sitter.available_days || [],
      accepted_bookings
    });
  } catch (error: any) {
    console.error('[Availability GET] Server Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sitter_id, email, blocked_dates } = body;

    if (!sitter_id && !email) {
      return NextResponse.json({ error: 'sitter_id or email is required' }, { status: 400 });
    }

    if (!Array.isArray(blocked_dates)) {
      return NextResponse.json({ error: 'blocked_dates must be an array' }, { status: 400 });
    }

    let updateQuery = supabaseAdmin.from('sitters').update({ blocked_dates });
    if (sitter_id) {
      updateQuery = updateQuery.eq('id', sitter_id);
    } else {
      updateQuery = updateQuery.eq('email', email.toLowerCase().trim());
    }

    const { error } = await updateQuery;

    if (error) {
      console.error('[Availability POST] Update Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, blocked_dates });
  } catch (error: any) {
    console.error('[Availability POST] Server Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
