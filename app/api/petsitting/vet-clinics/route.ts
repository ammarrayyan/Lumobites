import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/petsitting/vet-clinics
 *
 * Returns approved (non-paused) vet clinics for the Find a Sitter search page.
 * This is intentionally a separate, additive query — it never touches the sitters table.
 *
 * Query params (all optional):
 *   city — plain text city name for rough match fallback
 */
export async function GET(request: NextRequest) {
  try {
    const { data: rawClinics, error } = await supabaseAdmin
      .from('vet_clinics')
      .select(
        'id, clinic_name, email, city, state, org_photo_url, description, services, website, lat, lng, status, subscription_status, trial_end'
      )
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[VetClinics Search API] Error:', error);
      return NextResponse.json({ clinics: [] });
    }

    const now = new Date();
    // Only return clinics that are NOT paused AND have an active subscription or valid trial
    const clinics = (rawClinics || []).filter((c: any) => {
      if (c.status === 'paused') return false;
      if (c.subscription_status === 'active') return true;
      if (c.subscription_status === 'canceled') return false;
      if (c.trial_end && new Date(c.trial_end) < now) return false;
      return true;
    });

    if (!clinics || clinics.length === 0) {
      return NextResponse.json({ clinics: [] });
    }

    // Get today's YYYY-MM-DD in local/server time
    const today = new Date().toISOString().split('T')[0];

    // Fetch full dates for today across all returned clinics
    const clinicIds = clinics.map((c: any) => c.id);
    const { data: fullRecords } = await supabaseAdmin
      .from('vet_clinic_availability')
      .select('clinic_id')
      .in('clinic_id', clinicIds)
      .eq('date', today)
      .eq('status', 'full');

    const fullClinicSet = new Set((fullRecords || []).map((r: any) => r.clinic_id));

    const { extractPartnerMeta, formatPartnerHoursSummary } = await import('@/lib/partnerProfileHelper');

    const enrichedClinics = clinics.map((c: any) => {
      const meta = extractPartnerMeta(c);
      return {
        ...c,
        description: meta.cleanDescription,
        gallery_urls: meta.gallery,
        hours: meta.hours,
        hours_summary: formatPartnerHoursSummary(meta.hours),
        pricing: meta.pricing,
        avg_rating: meta.avgRating,
        review_count: meta.reviewCount,
        today_status: fullClinicSet.has(c.id) ? 'full' : 'available',
      };
    });

    return NextResponse.json({ clinics: enrichedClinics });
  } catch (err: any) {
    console.error('[VetClinics Search API] Unhandled error:', err);
    return NextResponse.json({ clinics: [] });
  }
}
