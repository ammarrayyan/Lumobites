import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// ─── GET /api/pet-daycare/availability?daycare_id= ────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daycare_id = searchParams.get('daycare_id');

    if (!daycare_id) {
      return NextResponse.json({ error: 'Missing daycare_id' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('daycare_availability')
      .select('*')
      .eq('daycare_id', daycare_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ availability: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST /api/pet-daycare/availability — Toggle date status ──────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { daycare_id, date, status } = body;

    if (!daycare_id || !date) {
      return NextResponse.json({ error: 'Missing daycare_id or date' }, { status: 400 });
    }

    // Check if entry exists
    const { data: existing } = await supabaseAdmin
      .from('daycare_availability')
      .select('*')
      .eq('daycare_id', daycare_id)
      .eq('date', date)
      .maybeSingle();

    if (existing) {
      if (status === 'available') {
        // Delete override to return to default available
        await supabaseAdmin
          .from('daycare_availability')
          .delete()
          .eq('id', existing.id);

        return NextResponse.json({ success: true, status: 'available' });
      } else {
        // Update existing record
        const { data: updated, error } = await supabaseAdmin
          .from('daycare_availability')
          .update({ status: status || 'full' })
          .eq('id', existing.id)
          .select('*')
          .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, availability: updated });
      }
    } else {
      if (status === 'full') {
        // Insert new full override
        const { data: inserted, error } = await supabaseAdmin
          .from('daycare_availability')
          .insert({ daycare_id, date, status: 'full' })
          .select('*')
          .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, availability: inserted });
      } else {
        return NextResponse.json({ success: true, status: 'available' });
      }
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
