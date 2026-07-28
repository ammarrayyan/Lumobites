import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// ─── GET /api/vet-boarding/availability?clinic_id= ────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinic_id = searchParams.get('clinic_id');

    if (!clinic_id) {
      return NextResponse.json({ error: 'Missing clinic_id' }, { status: 400 });
    }

    const { data: records, error } = await supabaseAdmin
      .from('vet_clinic_availability')
      .select('date, status')
      .eq('clinic_id', clinic_id);

    if (error) {
      // If table doesn't exist yet, return empty list gracefully
      console.warn('[VetAvailability API] Error fetching availability:', error.message);
      return NextResponse.json({ full_dates: [] });
    }

    const full_dates = (records || [])
      .filter((r: any) => r.status === 'full')
      .map((r: any) => r.date);

    return NextResponse.json({ full_dates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST /api/vet-boarding/availability ─────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clinic_id, email, date, status } = body;

    if (!clinic_id || !date || !status) {
      return NextResponse.json({ error: 'Missing clinic_id, date, or status' }, { status: 400 });
    }

    // Verify clinic exists & email matches if supplied
    if (email) {
      const { data: clinic } = await supabaseAdmin
        .from('vet_clinics')
        .select('id')
        .eq('id', clinic_id)
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (!clinic) {
        return NextResponse.json({ error: 'Unauthorized clinic access' }, { status: 403 });
      }
    }

    if (status === 'full') {
      const { error } = await supabaseAdmin
        .from('vet_clinic_availability')
        .upsert({ clinic_id, date, status: 'full' }, { onConflict: 'clinic_id,date' });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // Remove override so date returns to default (Available)
      const { error } = await supabaseAdmin
        .from('vet_clinic_availability')
        .delete()
        .eq('clinic_id', clinic_id)
        .eq('date', date);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, date, status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
