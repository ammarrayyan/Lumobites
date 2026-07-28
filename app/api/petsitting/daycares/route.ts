import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/petsitting/daycares
 *
 * Returns approved (non-paused) pet daycares for the Find a Sitter search page.
 * This is intentionally an additive query — it never touches the sitters or vet_clinics tables.
 */
export async function GET(request: NextRequest) {
  try {
    const { data: daycares, error } = await supabaseAdmin
      .from('pet_daycares')
      .select('id, business_name, email, city, state, logo_url, description, services, website')
      .eq('status', 'approved')
      .eq('is_paused', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Daycares Search API] Error:', error);
      return NextResponse.json({ daycares: [] });
    }

    if (!daycares || daycares.length === 0) {
      return NextResponse.json({ daycares: [] });
    }

    // Get today's YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    // Fetch full dates for today across all returned daycares
    const daycareIds = daycares.map((d: any) => d.id);
    const { data: fullRecords } = await supabaseAdmin
      .from('daycare_availability')
      .select('daycare_id')
      .in('daycare_id', daycareIds)
      .eq('date', today)
      .eq('status', 'full');

    const fullDaycareSet = new Set((fullRecords || []).map((r: any) => r.daycare_id));

    const enrichedDaycares = daycares.map((d: any) => ({
      ...d,
      today_status: fullDaycareSet.has(d.id) ? 'full' : 'available',
    }));

    return NextResponse.json({ daycares: enrichedDaycares });
  } catch (err: any) {
    console.error('[Daycares Search API] Unhandled error:', err);
    return NextResponse.json({ daycares: [] });
  }
}
