import { NextRequest, NextResponse } from 'next/server';
import { getPartnerReviews, submitPartnerReview } from '@/lib/partnerReviewsHelper';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daycare_id = searchParams.get('daycare_id');

    if (!daycare_id) {
      return NextResponse.json({ error: 'Missing daycare_id parameter' }, { status: 400 });
    }

    const { reviews, avgRating, reviewCount } = await getPartnerReviews(daycare_id, 'daycare');

    const { data: daycare } = await supabaseAdmin
      .from('pet_daycares')
      .select('id, business_name, city, state, logo_url, avg_rating, review_count')
      .eq('id', daycare_id)
      .maybeSingle();

    return NextResponse.json(
      { reviews, daycare, avg_rating: avgRating || daycare?.avg_rating || 0, review_count: reviewCount || daycare?.review_count || 0 },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { daycare_id, owner_email, owner_name, rating, review_text } = body;

    if (!daycare_id || !owner_email || !rating || !review_text) {
      return NextResponse.json({ error: 'Missing required review fields' }, { status: 400 });
    }

    const result = await submitPartnerReview({
      partnerId: daycare_id,
      partnerType: 'daycare',
      ownerEmail: owner_email,
      ownerName: owner_name || owner_email.split('@')[0],
      rating: Number(rating),
      reviewText: String(review_text),
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to submit review' }, { status: 500 });
    }

    return NextResponse.json({ success: true, avg_rating: result.avgRating, review_count: result.reviewCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
