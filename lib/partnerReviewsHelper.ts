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
  // 1. For shelters: Reviews are stored as verified records in adoption_messages
  if (partnerType === 'shelter') {
    try {
      const { data: reviewMsgs, error } = await supabaseAdmin
        .from('adoption_messages')
        .select('id, sender_email, message, created_at')
        .eq('shelter_id', partnerId)
        .like('message', '%<!-- LUMO_SHELTER_REVIEW:%')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(reviewMsgs)) {
        const reviews: PartnerReview[] = reviewMsgs.map((m: any) => {
          const start = m.message.indexOf('<!-- LUMO_SHELTER_REVIEW:');
          const end = m.message.indexOf('-->', start);
          let meta: any = {};
          if (start !== -1 && end !== -1) {
            try {
              meta = JSON.parse(m.message.substring(start + '<!-- LUMO_SHELTER_REVIEW:'.length, end).trim());
            } catch (e) {}
          }
          return {
            id: m.id,
            partnerId,
            partnerType: 'shelter' as const,
            ownerEmail: meta.owner_email || m.sender_email,
            ownerName: meta.owner_name || 'Verified Adopter',
            rating: Number(meta.rating || 5),
            reviewText: meta.review_text || '',
            approved: meta.approved !== false,
            createdAt: meta.created_at || m.created_at,
          };
        });

        const approved = reviews.filter(r => r.approved);
        const total = approved.reduce((sum, r) => sum + r.rating, 0);
        const count = approved.length;
        const avg = count > 0 ? Math.round((total / count) * 10) / 10 : 0;

        return { reviews: approved, avgRating: avg, reviewCount: count };
      }
    } catch (e) {
      console.error('Error fetching shelter reviews:', e);
    }
    return { reviews: [], avgRating: 0, reviewCount: 0 };
  }

  // 2. For vet / daycare: check dedicated reviews table or parent table description
  const tableName = partnerType === 'vet' ? 'vet_reviews' : 'daycare_reviews';
  const partnerIdCol = partnerType === 'vet' ? 'clinic_id' : 'daycare_id';
  const parentTable = partnerType === 'vet' ? 'vet_clinics' : 'pet_daycares';

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
    // Dedicated table not available, proceed to fallback
  }

  // 3. Fallback: Parse embedded reviews from parent table description
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
  const cleanEmail = (ownerEmail || '').toLowerCase().trim();
  const cleanName = (ownerName || '').trim() || cleanEmail.split('@')[0];
  const cleanRating = Math.max(1, Math.min(5, Math.round(rating)));

  if (!cleanEmail) {
    return { success: false, error: 'Reviewer email is required.' };
  }

  const parentTable = partnerType === 'vet' ? 'vet_clinics' : partnerType === 'daycare' ? 'pet_daycares' : 'shelters';

  // 1. Fetch partner record for self-review safeguard
  const { data: partner, error: pErr } = await supabaseAdmin
    .from(parentTable)
    .select('*')
    .eq('id', partnerId)
    .maybeSingle();

  if (pErr || !partner) {
    return { success: false, error: 'Partner not found.' };
  }

  const partnerEmail = (partner.email || '').toLowerCase().trim();
  if (partnerEmail && cleanEmail === partnerEmail) {
    return { success: false, error: 'You cannot submit a review for your own shelter or business.' };
  }

  // 2. Shelter Reviews Adoption Gate: Reviewer must be an adopter / inquirer on an adopted pet
  if (partnerType === 'shelter') {
    // Check if reviewer exchanged messages for any adopted pet from this shelter
    const { data: userMessages } = await supabaseAdmin
      .from('adoption_messages')
      .select('id, pet_id, adoption_pets(id, status)')
      .eq('shelter_id', partnerId)
      .or(`sender_email.eq.${cleanEmail},receiver_email.eq.${cleanEmail}`);

    const hasAdoptedInquiry = (userMessages || []).some((m: any) => {
      if (m.message && m.message.startsWith('<!-- LUMO_SHELTER_REVIEW:')) return false;
      const pet = Array.isArray(m.adoption_pets) ? m.adoption_pets[0] : m.adoption_pets;
      return pet && pet.status === 'adopted';
    });

    if (!hasAdoptedInquiry) {
      return {
        success: false,
        error: 'Reviews for rescue shelters are reserved for confirmed adopters who have finalized an adoption with this shelter.',
      };
    }

    // 3. Save review in adoption_messages
    try {
      const reviewData = {
        rating: cleanRating,
        review_text: reviewText.trim(),
        owner_name: cleanName,
        owner_email: cleanEmail,
        created_at: new Date().toISOString(),
        approved: true,
      };

      const { data: existing } = await supabaseAdmin
        .from('adoption_messages')
        .select('id')
        .eq('shelter_id', partnerId)
        .eq('sender_email', cleanEmail)
        .like('message', '%<!-- LUMO_SHELTER_REVIEW:%');

      if (existing && existing.length > 0) {
        await supabaseAdmin
          .from('adoption_messages')
          .update({
            message: `<!-- LUMO_SHELTER_REVIEW: ${JSON.stringify(reviewData)} -->`,
            read: true,
          })
          .eq('id', existing[0].id);
      } else {
        await supabaseAdmin
          .from('adoption_messages')
          .insert({
            shelter_id: partnerId,
            pet_id: null,
            sender_email: cleanEmail,
            receiver_email: partnerEmail,
            message: `<!-- LUMO_SHELTER_REVIEW: ${JSON.stringify(reviewData)} -->`,
            read: true,
          });
      }

      // Re-fetch to return computed aggregates
      const { avgRating, reviewCount } = await getPartnerReviews(partnerId, 'shelter');
      return { success: true, avgRating, reviewCount };
    } catch (err: any) {
      console.error('Error saving shelter review:', err);
      return { success: false, error: err.message || 'Failed to submit review.' };
    }
  }

  // 4. For Vet / Daycare: Attempt insert into dedicated table
  const tableName = partnerType === 'vet' ? 'vet_reviews' : 'daycare_reviews';
  const partnerIdCol = partnerType === 'vet' ? 'clinic_id' : 'daycare_id';

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
      const { data: allReviews } = await supabaseAdmin
        .from(tableName)
        .select('rating, approved')
        .eq(partnerIdCol, partnerId);

      const approved = (allReviews || []).filter((r: any) => r.approved !== false);
      const review_count = approved.length;
      const total = approved.reduce((sum: number, r: any) => sum + Number(r.rating || 5), 0);
      const avg_rating = review_count > 0 ? Math.round((total / review_count) * 10) / 10 : 0;

      await supabaseAdmin
        .from(parentTable)
        .update({ avg_rating, review_count })
        .eq('id', partnerId)
        .catch(() => {});

      return { success: true, avgRating: avg_rating, reviewCount: review_count };
    }
  } catch (e) {
    // Dedicated table not available, use embedded description fallback
  }

  // 5. Embedded Fallback for Vet / Daycare
  try {
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
