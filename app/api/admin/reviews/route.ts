import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';

import { isAuthorizedAdmin } from '@/lib/adminAuth';

function checkAuth(req: NextRequest) {
  return isAuthorizedAdmin(req);
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'sitter';

    if (type === 'vet') {
      const { data } = await supabaseAdmin
        .from('vet_reviews')
        .select('*, vet_clinics(clinic_name)')
        .order('created_at', { ascending: false });

      const formatted = (data || []).map((r: any) => ({
        ...r,
        partner_name: r.vet_clinics?.clinic_name || 'Unknown Clinic',
        partner_type: 'vet',
      }));
      return NextResponse.json({ reviews: formatted });
    }

    if (type === 'daycare') {
      const { data } = await supabaseAdmin
        .from('daycare_reviews')
        .select('*, pet_daycares(business_name)')
        .order('created_at', { ascending: false });

      const formatted = (data || []).map((r: any) => ({
        ...r,
        partner_name: r.pet_daycares?.business_name || 'Unknown Daycare',
        partner_type: 'daycare',
      }));
      return NextResponse.json({ reviews: formatted });
    }

    if (type === 'shelter') {
      const { data } = await supabaseAdmin
        .from('shelter_reviews')
        .select('*, shelters(org_name)')
        .order('created_at', { ascending: false });

      const formatted = (data || []).map((r: any) => ({
        ...r,
        partner_name: r.shelters?.org_name || 'Unknown Shelter',
        partner_type: 'shelter',
      }));
      return NextResponse.json({ reviews: formatted });
    }

    // Default: Sitter reviews
    const { data, error } = await supabaseAdmin
      .from('sitter_reviews')
      .select('*, sitters(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedData = (data || []).map((review: any) => ({
      ...review,
      partner_name: review.sitters?.name || 'Unknown Sitter',
      partner_type: 'sitter',
    }));

    return NextResponse.json({ reviews: formattedData });
  } catch (error: any) {
    console.error('[Admin Reviews API] Fetch Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get('id');
    const partnerId = searchParams.get('partner_id') || searchParams.get('sitter_id');
    const partnerType = searchParams.get('type') || 'sitter';

    if (!reviewId || !partnerId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const tableName =
      partnerType === 'vet'
        ? 'vet_reviews'
        : partnerType === 'daycare'
        ? 'daycare_reviews'
        : partnerType === 'shelter'
        ? 'shelter_reviews'
        : 'sitter_reviews';

    const partnerIdCol =
      partnerType === 'vet'
        ? 'clinic_id'
        : partnerType === 'daycare'
        ? 'daycare_id'
        : partnerType === 'shelter'
        ? 'shelter_id'
        : 'sitter_id';

    const parentTable =
      partnerType === 'vet'
        ? 'vet_clinics'
        : partnerType === 'daycare'
        ? 'pet_daycares'
        : partnerType === 'shelter'
        ? 'shelters'
        : 'sitters';

    // Delete the review
    const { error: deleteError } = await supabaseAdmin.from(tableName).delete().eq('id', reviewId);
    if (deleteError) throw deleteError;

    // Recalculate partner rating
    const { data: allReviews, error: fetchError } = await supabaseAdmin
      .from(tableName)
      .select('rating')
      .eq(partnerIdCol, partnerId);

    if (fetchError) throw fetchError;

    let avg_rating = 0;
    const review_count = allReviews ? allReviews.length : 0;

    if (review_count > 0) {
      const total = allReviews.reduce((sum, r) => sum + r.rating, 0);
      avg_rating = Math.round((total / review_count) * 10) / 10;
    }

    await supabaseAdmin.from(parentTable).update({ avg_rating, review_count }).eq('id', partnerId);

    return NextResponse.json({ success: true, avg_rating, review_count });
  } catch (error: any) {
    console.error('[Admin Reviews API] Delete Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
