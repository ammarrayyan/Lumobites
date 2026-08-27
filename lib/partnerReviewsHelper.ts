import { supabaseAdmin } from '@/lib/supabase';
import { extractPartnerMeta, packPartnerDescription } from '@/lib/partnerProfileHelper';

export interface PartnerReview {
  id: string;
  partnerId: string;
  partnerType: 'vet' | 'daycare' | 'shelter';
  ownerEmail: string;
  ownerName: string;
  rating: number;
  reviewText: string;
  approved: boolean;
  createdAt: string;
}

const REVIEW_META_START = '<!-- LUMO_REVIEWS:';
const REVIEW_META_END = '-->';

/**
 * Fetches all approved reviews for a given partner.
 */
export async function getPartnerReviews(
  partnerId: string,
  partnerType: 'vet' | 'daycare' | 'shelter'
): Promise<{ reviews: PartnerReview[]; avgRating: number; reviewCount: number }> {
  const tableName = partnerType === 'vet' ? 'vet_reviews' : partnerType === 'daycare' ? 'daycare_reviews' : 'shelter_reviews';
  const partnerIdCol = partnerType === 'vet' ? 'clinic_id' : partnerType === 'daycare' ? 'daycare_id' : 'shelter_id';
  const parentTable = partnerType === 'vet' ? 'vet_clinics' : partnerType === 'daycare' ? 'pet_daycares' : 'shelters';

  // 1. Try querying the dedicated reviews table
  try {
    const { data: dbReviews, error } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .eq(partnerIdCol, partnerId)
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(dbReviews) && dbReviews.length > 0) {
      const formatted: PartnerReview[] = dbReviews.map((r: any) => ({
        id: r.id,
        partnerId: r[partnerIdCol],
        partnerType,
        ownerEmail: r.owner_email,
        ownerName: r.owner_name,
        rating: Number(r.rating || 5),
        reviewText: r.review_text,
        approved: r.approved !== false,
        createdAt: r.created_at,
      }));

      const approved = formatted.filter(r => r.approved);
      const total = approved.reduce((sum, r) => sum + r.rating, 0);
      const count = approved.length;
      const avg = count > 0 ? Math.round((total / count) * 10) / 10 : 0;

      return { reviews: approved, avgRating: avg, reviewCount: count };
    }
  } catch (e) {
    // Table doesn't exist yet, proceed to fallback
  }

  // 2. Fallback: Parse embedded reviews from parent table description
  try {
    const { data: partner } = await supabaseAdmin
      .from(parentTable)
      .select('*')
      .eq('id', partnerId)
      .maybeSingle();

    if (partner) {
      const desc = partner.description || '';
      if (desc.includes(REVIEW_META_START)) {
        const start = desc.indexOf(REVIEW_META_START);
        const end = desc.indexOf(REVIEW_META_END, start);
        if (start !== -1 && end !== -1) {
          const jsonStr = desc.substring(start + REVIEW_META_START.length, end).trim();
          const reviews: PartnerReview[] = JSON.parse(jsonStr);
          const approved = reviews.filter(r => r.approved !== false);
          const total = approved.reduce((sum, r) => sum + Number(r.rating || 5), 0);
          const count = approved.length;
          const avg = count > 0 ? Math.round((total / count) * 10) / 10 : 0;
          return { reviews: approved, avgRating: avg, reviewCount: count };
        }
      }

      // Check partner columns
      const avg = Number(partner.avg_rating || 0);
      const count = Number(partner.review_count || 0);
      return { reviews: [], avgRating: avg, reviewCount: count };
    }
  } catch (e) {
    console.error('Error fetching partner reviews fallback:', e);
  }

  return { reviews: [], avgRating: 0, reviewCount: 0 };
}

/**
 * Submits a new review for a partner, prevents duplicates, and updates aggregate ratings.
 */
export async function submitPartnerReview(params: {
  partnerId: string;
  partnerType: 'vet' | 'daycare' | 'shelter';
  ownerEmail: string;
  ownerName: string;
  rating: number;
  reviewText: string;
}): Promise<{ success: boolean; error?: string; avgRating?: number; reviewCount?: number }> {
  const { partnerId, partnerType, ownerEmail, ownerName, rating, reviewText } = params;
  const cleanEmail = ownerEmail.toLowerCase().trim();
  const cleanName = ownerName.trim() || cleanEmail.split('@')[0];
  const cleanRating = Math.max(1, Math.min(5, Math.round(rating)));

  const tableName = partnerType === 'vet' ? 'vet_reviews' : partnerType === 'daycare' ? 'daycare_reviews' : 'shelter_reviews';
  const partnerIdCol = partnerType === 'vet' ? 'clinic_id' : partnerType === 'daycare' ? 'daycare_id' : 'shelter_id';
  const parentTable = partnerType === 'vet' ? 'vet_clinics' : partnerType === 'daycare' ? 'pet_daycares' : 'shelters';

  // 1. Attempt insert into dedicated table
  try {
    const { error: insertErr } = await supabaseAdmin.from(tableName).insert({
      [partnerIdCol]: partnerId,
      owner_email: cleanEmail,
      owner_name: cleanName,
      rating: cleanRating,
      review_text: reviewText.trim(),
      approved: true,
    });

    if (!insertErr) {
      // Recalculate stats
      const { data: allReviews } = await supabaseAdmin
        .from(tableName)
        .select('rating, approved')
        .eq(partnerIdCol, partnerId);

      const approved = (allReviews || []).filter((r: any) => r.approved !== false);
      const review_count = approved.length;
      const total = approved.reduce((sum: number, r: any) => sum + Number(r.rating || 5), 0);
      const avg_rating = review_count > 0 ? Math.round((total / review_count) * 10) / 10 : 0;

      // Update parent table
      await supabaseAdmin.from(parentTable).update({ avg_rating, review_count }).eq('id', partnerId);

      return { success: true, avgRating: avg_rating, reviewCount: review_count };
    }
  } catch (e) {
    // Dedicated table not available, use embedded description fallback
  }

  // 2. Embedded Fallback
  try {
    const { data: partner } = await supabaseAdmin
      .from(parentTable)
      .select('*')
      .eq('id', partnerId)
      .single();

    if (!partner) {
      return { success: false, error: 'Partner not found.' };
    }

    let existingReviews: PartnerReview[] = [];
    let cleanDesc = partner.description || '';

    if (cleanDesc.includes(REVIEW_META_START)) {
      const start = cleanDesc.indexOf(REVIEW_META_START);
      const end = cleanDesc.indexOf(REVIEW_META_END, start);
      if (start !== -1 && end !== -1) {
        try {
          existingReviews = JSON.parse(cleanDesc.substring(start + REVIEW_META_START.length, end).trim());
        } catch (e) {}
        cleanDesc = (cleanDesc.substring(0, start) + cleanDesc.substring(end + REVIEW_META_END.length)).trim();
      }
    }

    // Check duplicate
    const existingIndex = existingReviews.findIndex(r => r.ownerEmail.toLowerCase() === cleanEmail);
    const newReview: PartnerReview = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      partnerId,
      partnerType,
      ownerEmail: cleanEmail,
      ownerName: cleanName,
      rating: cleanRating,
      reviewText: reviewText.trim(),
      approved: true,
      createdAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      existingReviews[existingIndex] = newReview;
    } else {
      existingReviews.unshift(newReview);
    }

    const approved = existingReviews.filter(r => r.approved !== false);
    const count = approved.length;
    const total = approved.reduce((sum, r) => sum + r.rating, 0);
    const avg = count > 0 ? Math.round((total / count) * 10) / 10 : 0;

    const newDescription = `${cleanDesc}\n\n${REVIEW_META_START} ${JSON.stringify(existingReviews)} ${REVIEW_META_END}`.trim();

    await supabaseAdmin
      .from(parentTable)
      .update({
        description: newDescription,
        avg_rating: avg,
        review_count: count,
      })
      .eq('id', partnerId);

    return { success: true, avgRating: avg, reviewCount: count };
  } catch (err: any) {
    console.error('Error submitting review fallback:', err);
    return { success: false, error: err.message || 'Failed to submit review.' };
  }
}
