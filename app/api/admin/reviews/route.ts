import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';

function checkAuth(req: NextRequest) {
  const key = req.headers.get('x-admin-key');
  return key === process.env.NEXT_PUBLIC_ADMIN_BYPASS_KEY;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('sitter_reviews')
      .select('*, sitters(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedData = data.map((review: any) => ({
      ...review,
      sitter_name: review.sitters?.name || 'Unknown Sitter'
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
    const sitterId = searchParams.get('sitter_id');

    if (!reviewId || !sitterId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Delete the review
    const { error: deleteError } = await supabaseAdmin
      .from('sitter_reviews')
      .delete()
      .eq('id', reviewId);

    if (deleteError) throw deleteError;

    // Recalculate sitter rating
    const { data: allReviews, error: fetchError } = await supabaseAdmin
      .from('sitter_reviews')
      .select('rating')
      .eq('sitter_id', sitterId);

    if (fetchError) throw fetchError;

    let avg_rating = 0;
    const review_count = allReviews ? allReviews.length : 0;

    if (review_count > 0) {
      const total = allReviews.reduce((sum, r) => sum + r.rating, 0);
      avg_rating = Math.round((total / review_count) * 10) / 10;
    }

    const { error: updateError } = await supabaseAdmin
      .from('sitters')
      .update({ avg_rating, review_count })
      .eq('id', sitterId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, avg_rating, review_count });
  } catch (error: any) {
    console.error('[Admin Reviews API] Delete Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
