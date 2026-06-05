import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, sitter_id } = body;

    if (!id || !sitter_id) {
      return NextResponse.json({ error: 'Missing request ID or sitter ID' }, { status: 400 });
    }

    // 1. Fetch current request status to prevent double completion
    const { data: reqRow, error: reqError } = await supabaseAdmin
      .from('sitting_requests')
      .select('status')
      .eq('id', id)
      .single();

    if (reqError || !reqRow) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (reqRow.status === 'completed') {
      return NextResponse.json({ success: true, message: 'Booking already completed.' });
    }

    // 2. Update booking request status
    const { error: updateError } = await supabaseAdmin
      .from('sitting_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('[Complete Booking] Update Request Error:', updateError);
      return NextResponse.json({ error: 'Failed to update booking status' }, { status: 500 });
    }

    // 3. Fetch sitter current completed bookings count
    const { data: sitterRow, error: sitterError } = await supabaseAdmin
      .from('sitters')
      .select('completed_bookings')
      .eq('id', sitter_id)
      .single();

    if (!sitterError && sitterRow) {
      const nextCount = (sitterRow.completed_bookings || 0) + 1;
      
      // 4. Increment count in sitters table
      const { error: sitterUpdateError } = await supabaseAdmin
        .from('sitters')
        .update({ completed_bookings: nextCount })
        .eq('id', sitter_id);

      if (sitterUpdateError) {
        console.error('[Complete Booking] Increment Sitter Count Error:', sitterUpdateError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Complete Booking] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
