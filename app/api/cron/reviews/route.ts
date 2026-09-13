import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { formatSitterName } from '@/lib/email-template';
import { extractAdoptionMeta, packAdoptionDescription } from '@/lib/adoptionPetHelper';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Validate Cron Secret (bypassed in local development or with admin key)
    const authHeader = request.headers.get('authorization');
    const adminKey = request.headers.get('x-admin-key') || request.nextUrl.searchParams.get('key');
    const expectedSecret = process.env.CRON_SECRET;
    const expectedAdminKey = process.env.ADMIN_BYPASS_KEY || process.env.ADMIN_KEY;

    const isAuthorized =
      (authHeader && expectedSecret && authHeader === `Bearer ${expectedSecret}`) ||
      (adminKey && expectedAdminKey && adminKey === expectedAdminKey) ||
      process.env.NODE_ENV !== 'production';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate timestamp for 10 minutes ago
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    let sittingCount = 0;
    let daycareCount = 0;
    let vetCount = 0;
    let shelterCount = 0;

    // ─── A. PET SITTING REVIEWS ──────────────────────────────────────────────
    const { data: sittingRequests, error: sitErr } = await supabaseAdmin
      .from('sitting_requests')
      .select('id, owner_email, sitter_id, pet_name, dates, completed_at, sitters(id, name, email)')
      .eq('status', 'completed')
      .or('review_sent.is.null,review_sent.eq.false')
      .lte('completed_at', tenMinsAgo);

    if (sitErr) {
      console.error('[Cron Reviews] Sitting Fetch Error:', sitErr);
    } else if (sittingRequests && sittingRequests.length > 0) {
      for (const reqRow of sittingRequests) {
        if (!reqRow.owner_email || !reqRow.sitter_id) continue;
        const ownerEmail = reqRow.owner_email.toLowerCase().trim();
        const bookingId = String(reqRow.id);

        try {
          // Check deduplication in notifications
          const { data: existingNotif } = await supabaseAdmin
            .from('notifications')
            .select('id')
            .eq('recipient_email', ownerEmail)
            .eq('type', 'review_request')
            .eq('booking_id', bookingId)
            .maybeSingle();

          if (!existingNotif) {
            const sitterObj = Array.isArray(reqRow.sitters) ? reqRow.sitters[0] : reqRow.sitters;
            const sitterName = formatSitterName(sitterObj?.name) || 'your sitter';
            const reviewLink = `/petsitting/review/${reqRow.sitter_id}?token=${encodeURIComponent(ownerEmail)}`;

            await supabaseAdmin.from('notifications').insert({
              recipient_email: ownerEmail,
              type: 'review_request',
              title: 'Leave a Review 🐾',
              message: `How was your pet sitting experience with ${sitterName}? Leave a review`,
              link: reviewLink,
              booking_id: bookingId,
              read: false,
            });
          }

          // Mark review_sent on sitting_requests
          await supabaseAdmin
            .from('sitting_requests')
            .update({ review_sent: true })
            .eq('id', reqRow.id);

          sittingCount++;
        } catch (innerErr) {
          console.error(`[Cron Reviews] Failed to process sitting request ${reqRow.id}:`, innerErr);
        }
      }
    }

    // ─── B. PET DAYCARE REVIEWS ──────────────────────────────────────────────
    const { data: daycareRequests, error: dayErr } = await supabaseAdmin
      .from('daycare_inquiries')
      .select('id, owner_email, daycare_id, completed_at, updated_at, pet_daycares(id, business_name, email)')
      .eq('status', 'completed')
      .or('review_sent.is.null,review_sent.eq.false');

    if (dayErr) {
      console.error('[Cron Reviews] Daycare Fetch Error:', dayErr);
    } else if (daycareRequests && daycareRequests.length > 0) {
      for (const inqRow of daycareRequests) {
        if (!inqRow.owner_email || !inqRow.daycare_id) continue;

        // Check if completed at least 10 minutes ago
        const completionTime = inqRow.completed_at || inqRow.updated_at;
        if (completionTime && new Date(completionTime).getTime() > new Date(tenMinsAgo).getTime()) {
          continue;
        }

        const ownerEmail = inqRow.owner_email.toLowerCase().trim();
        const bookingId = String(inqRow.id);

        try {
          const { data: existingNotif } = await supabaseAdmin
            .from('notifications')
            .select('id')
            .eq('recipient_email', ownerEmail)
            .eq('type', 'review_request')
            .eq('booking_id', bookingId)
            .maybeSingle();

          if (!existingNotif) {
            const daycareObj = Array.isArray(inqRow.pet_daycares) ? inqRow.pet_daycares[0] : inqRow.pet_daycares;
            const daycareName = daycareObj?.business_name || 'your pet daycare';
            const reviewLink = `/petsitting?review_daycare=${inqRow.daycare_id}&tab=owner`;

            await supabaseAdmin.from('notifications').insert({
              recipient_email: ownerEmail,
              type: 'review_request',
              title: 'Leave a Review 🐾',
              message: `How was your daycare experience with ${daycareName}? Leave a review`,
              link: reviewLink,
              booking_id: bookingId,
              read: false,
            });
          }

          // Mark review_sent on daycare_inquiries
          await supabaseAdmin
            .from('daycare_inquiries')
            .update({ review_sent: true })
            .eq('id', inqRow.id)
            .catch(() => {});

          daycareCount++;
        } catch (innerErr) {
          console.error(`[Cron Reviews] Failed to process daycare request ${inqRow.id}:`, innerErr);
        }
      }
    }

    // ─── C. VET BOARDING REVIEWS ─────────────────────────────────────────────
    const { data: vetRequests, error: vetErr } = await supabaseAdmin
      .from('vet_inquiries')
      .select('id, owner_email, clinic_id, completed_at, updated_at, vet_clinics(id, clinic_name, email)')
      .eq('status', 'completed')
      .or('review_sent.is.null,review_sent.eq.false');

    if (vetErr) {
      console.error('[Cron Reviews] Vet Fetch Error:', vetErr);
    } else if (vetRequests && vetRequests.length > 0) {
      for (const inqRow of vetRequests) {
        if (!inqRow.owner_email || !inqRow.clinic_id) continue;

        // Check if completed at least 10 minutes ago
        const completionTime = inqRow.completed_at || inqRow.updated_at;
        if (completionTime && new Date(completionTime).getTime() > new Date(tenMinsAgo).getTime()) {
          continue;
        }

        const ownerEmail = inqRow.owner_email.toLowerCase().trim();
        const bookingId = String(inqRow.id);

        try {
          const { data: existingNotif } = await supabaseAdmin
            .from('notifications')
            .select('id')
            .eq('recipient_email', ownerEmail)
            .eq('type', 'review_request')
            .eq('booking_id', bookingId)
            .maybeSingle();

          if (!existingNotif) {
            const clinicObj = Array.isArray(inqRow.vet_clinics) ? inqRow.vet_clinics[0] : inqRow.vet_clinics;
            const clinicName = clinicObj?.clinic_name || 'your vet clinic';
            const reviewLink = `/petsitting?review_vet=${inqRow.clinic_id}&tab=owner`;

            await supabaseAdmin.from('notifications').insert({
              recipient_email: ownerEmail,
              type: 'review_request',
              title: 'Leave a Review 🐾',
              message: `How was your vet boarding experience with ${clinicName}? Leave a review`,
              link: reviewLink,
              booking_id: bookingId,
              read: false,
            });
          }

          // Mark review_sent on vet_inquiries
          await supabaseAdmin
            .from('vet_inquiries')
            .update({ review_sent: true })
            .eq('id', inqRow.id)
            .catch(() => {});

          vetCount++;
        } catch (innerErr) {
          console.error(`[Cron Reviews] Failed to process vet request ${inqRow.id}:`, innerErr);
        }
      }
    }

    // ─── D. SHELTER ADOPTION REVIEWS ─────────────────────────────────────────
    const { data: adoptedPets, error: shelterErr } = await supabaseAdmin
      .from('adoption_pets')
      .select('id, name, shelter_id, description, status, created_at, shelters(id, org_name, email)')
      .eq('status', 'adopted');

    if (shelterErr) {
      console.error('[Cron Reviews] Shelter Fetch Error:', shelterErr);
    } else if (adoptedPets && adoptedPets.length > 0) {
      for (const petRow of adoptedPets) {
        const meta = extractAdoptionMeta(petRow);
        if (!meta.adoptedByEmail || meta.reviewSent) continue;

        // Check if adopted at least 10 minutes ago
        const adoptionTime = meta.adoptedAt || petRow.created_at;
        if (adoptionTime && new Date(adoptionTime).getTime() > new Date(tenMinsAgo).getTime()) {
          continue;
        }

        const adopterEmail = meta.adoptedByEmail.toLowerCase().trim();
        const bookingId = String(petRow.id);

        try {
          const { data: existingNotif } = await supabaseAdmin
            .from('notifications')
            .select('id')
            .eq('recipient_email', adopterEmail)
            .eq('type', 'review_request')
            .eq('booking_id', bookingId)
            .maybeSingle();

          const shelterObj = Array.isArray(petRow.shelters) ? petRow.shelters[0] : petRow.shelters;
          const shelterName = shelterObj?.org_name || 'Rescue Partner';
          const shelterId = petRow.shelter_id || shelterObj?.id;
          const reviewLink = `/adoption?review_shelter=${shelterId}&pet_id=${petRow.id}`;

          if (!existingNotif) {
            await supabaseAdmin.from('notifications').insert({
              recipient_email: adopterEmail,
              type: 'review_request',
              title: `Congratulations on Adopting ${petRow.name || 'your pet'}! 🐾`,
              message: `How was your adoption experience with ${shelterName}? Leave a review`,
              link: reviewLink,
              booking_id: bookingId,
              read: false,
            });
          }

          // Mark review_sent = true
          const updatedMeta = { ...meta, review_sent: true };
          const newDesc = packAdoptionDescription(meta.cleanDescription, updatedMeta);

          // Update DB (attempting column + description fallback)
          await supabaseAdmin
            .from('adoption_pets')
            .update({
              description: newDesc,
              review_sent: true,
            })
            .eq('id', petRow.id)
            .catch(async () => {
              await supabaseAdmin
                .from('adoption_pets')
                .update({ description: newDesc })
                .eq('id', petRow.id);
            });

          shelterCount++;
        } catch (innerErr) {
          console.error(`[Cron Reviews] Failed to process shelter pet ${petRow.id}:`, innerErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent: {
        sitting: sittingCount,
        daycare: daycareCount,
        vet: vetCount,
        shelter: shelterCount,
        total: sittingCount + daycareCount + vetCount + shelterCount,
      },
    });
  } catch (error: any) {
    console.error('[Cron Reviews] Failed to run review cron:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
