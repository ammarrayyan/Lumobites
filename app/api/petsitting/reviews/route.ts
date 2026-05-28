import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sitterId = request.nextUrl.searchParams.get('sitter_id');

    if (!sitterId) {
      return NextResponse.json({ error: 'sitter_id is required' }, { status: 400 });
    }

    const { data: reviews, error } = await supabaseAdmin
      .from('sitter_reviews')
      .select('*')
      .eq('sitter_id', sitterId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch unmasked sitter details for the review page display
    const { data: sitter } = await supabaseAdmin
      .from('sitters')
      .select('name, photo_url')
      .eq('id', sitterId)
      .single();

    return NextResponse.json({ reviews, sitter });
  } catch (error: any) {
    console.error('[PetSitting Reviews GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sitter_id, rating, review_text, owner_name, owner_email } = body;

    // Validate required fields
    if (!sitter_id || !rating || !review_text || !owner_name || !owner_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cleanEmail = owner_email.toLowerCase().trim();

    // Validate rating
    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 });
    }

    // Validate review length
    if (review_text.trim().length < 20) {
      return NextResponse.json({ error: 'Review text must be at least 20 characters long' }, { status: 400 });
    }

    // 1. Prevents duplicate reviews — one per owner email per sitter
    const { data: existingReview, error: checkError } = await supabaseAdmin
      .from('sitter_reviews')
      .select('id')
      .eq('sitter_id', sitter_id)
      .eq('owner_email', cleanEmail)
      .maybeSingle();

    if (checkError) {
      console.error('[PetSitting Reviews POST] Check error:', checkError);
      return NextResponse.json({ error: 'Database check failed' }, { status: 500 });
    }

    if (existingReview) {
      return NextResponse.json({
        error: 'duplicate',
        message: 'You have already submitted a review for this sitter.'
      }, { status: 400 });
    }

    // 2. Insert new review
    const { error: insertError } = await supabaseAdmin
      .from('sitter_reviews')
      .insert({
        sitter_id,
        rating: ratingNum,
        review_text: review_text.trim(),
        owner_name: owner_name.trim(),
        owner_email: cleanEmail
      });

    if (insertError) {
      console.error('[PetSitting Reviews POST] Insert error:', insertError);
      return NextResponse.json({ error: 'Database insertion failed' }, { status: 500 });
    }

    // 3. Recalculate sitter avg_rating and review_count automatically
    const { data: allReviews, error: reviewsError } = await supabaseAdmin
      .from('sitter_reviews')
      .select('rating')
      .eq('sitter_id', sitter_id);

    if (reviewsError) {
      console.error('[PetSitting Reviews POST] Recalculate fetch error:', reviewsError);
    } else {
      const review_count = allReviews ? allReviews.length : 0;
      let avg_rating = 0;
      if (review_count > 0) {
        const total = allReviews.reduce((sum, r) => sum + r.rating, 0);
        avg_rating = Math.round((total / review_count) * 10) / 10; // Round to 1 decimal place
      }

      const { error: updateError } = await supabaseAdmin
        .from('sitters')
        .update({ avg_rating, review_count })
        .eq('id', sitter_id);

      if (updateError) {
        console.error('[PetSitting Reviews POST] Recalculate update error:', updateError);
      }
    }

    return NextResponse.json({ success: true, message: 'Thank you for your review! 🐾' });
  } catch (error: any) {
    console.error('[PetSitting Reviews POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
