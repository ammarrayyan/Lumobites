import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import Stripe from 'stripe';
import { getVerifiedSessionEmail, clearAccountSessionCookie } from '@/lib/accountAuth';
import { getUserProStatusDetails } from '@/lib/aiLimiter';
import { Resend } from 'resend';
import { brandedEmail, emailStyles } from '@/lib/email-template';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    const verifiedEmail = await getVerifiedSessionEmail(request);

    if (!verifiedEmail) {
      return NextResponse.json({ error: 'Unauthorized — valid session cookie required' }, { status: 401 });
    }

    const cleanEmail = verifiedEmail.toLowerCase().trim();
    let canceledSubscriptionsCount = 0;

    // 1. Partner Account Cleanup (Vet Boarding, Pet Daycare, Shelter)
    if (stripeSecretKey) {
      try {
        const stripe = new Stripe(stripeSecretKey);

        // Cancel partner subscriptions for vet_clinics
        const { data: vet } = await supabaseAdmin.from('vet_clinics').select('id, stripe_subscription_id').eq('email', cleanEmail).maybeSingle();
        if (vet) {
          if (vet.stripe_subscription_id) {
            try {
              await stripe.subscriptions.cancel(vet.stripe_subscription_id);
              canceledSubscriptionsCount++;
            } catch (e) {}
          }
          const { data: inqs } = await supabaseAdmin.from('vet_inquiries').select('id').eq('clinic_id', vet.id);
          if (inqs && inqs.length > 0) {
            await supabaseAdmin.from('messages').delete().in('booking_id', inqs.map(i => i.id));
          }
          await supabaseAdmin.from('vet_clinic_availability').delete().eq('clinic_id', vet.id);
          await supabaseAdmin.from('vet_inquiries').delete().eq('clinic_id', vet.id);
          await supabaseAdmin.from('vet_clinics').delete().eq('id', vet.id);
        }

        // Cancel partner subscriptions for pet_daycares
        const { data: daycare } = await supabaseAdmin.from('pet_daycares').select('id, stripe_subscription_id').eq('email', cleanEmail).maybeSingle();
        if (daycare) {
          if (daycare.stripe_subscription_id) {
            try {
              await stripe.subscriptions.cancel(daycare.stripe_subscription_id);
              canceledSubscriptionsCount++;
            } catch (e) {}
          }
          const { data: inqs } = await supabaseAdmin.from('daycare_inquiries').select('id').eq('daycare_id', daycare.id);
          if (inqs && inqs.length > 0) {
            await supabaseAdmin.from('messages').delete().in('booking_id', inqs.map(i => i.id));
          }
          await supabaseAdmin.from('daycare_availability').delete().eq('daycare_id', daycare.id);
          await supabaseAdmin.from('daycare_inquiries').delete().eq('daycare_id', daycare.id);
          await supabaseAdmin.from('pet_daycares').delete().eq('id', daycare.id);
        }

        // Cancel partner subscriptions for shelters
        const { data: shelter } = await supabaseAdmin.from('shelters').select('id, stripe_subscription_id').eq('email', cleanEmail).maybeSingle();
        if (shelter) {
          if (shelter.stripe_subscription_id) {
            try {
              await stripe.subscriptions.cancel(shelter.stripe_subscription_id);
              canceledSubscriptionsCount++;
            } catch (e) {}
          }
          await supabaseAdmin.from('adoption_pets').delete().eq('shelter_id', shelter.id);
          await supabaseAdmin.from('adoption_messages').delete().eq('shelter_id', shelter.id);
          await supabaseAdmin.from('shelters').delete().eq('id', shelter.id);
        }
      } catch (partnerErr) {
        console.error('[Account Delete] Partner cleanup error:', partnerErr);
      }
    }

    // 2. Stripe Subscription Cancellation for Sitter Profile (if exists)
    try {
      const { data: sitter } = await supabaseAdmin
        .from('sitters')
        .select('id, stripe_customer_id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (sitter?.stripe_customer_id && stripeSecretKey) {
        const stripe = new Stripe(stripeSecretKey);
        const subscriptions = await stripe.subscriptions.list({
          customer: sitter.stripe_customer_id,
          status: 'active',
        });
        for (const sub of subscriptions.data) {
          await stripe.subscriptions.cancel(sub.id);
          canceledSubscriptionsCount++;
          console.log(`[Account Delete] Cancelled Stripe subscription ${sub.id} for ${cleanEmail}`);
        }
      }

      if (sitter?.id) {
        // Delete reviews of the sitter
        await supabaseAdmin.from('sitter_reviews').delete().eq('sitter_id', sitter.id);
        // Delete requests assigned to the sitter
        await supabaseAdmin.from('sitting_requests').delete().eq('sitter_id', sitter.id);
      }
    } catch (sitterErr) {
      console.error('[Account Delete] Sitter details/Stripe error:', sitterErr);
    }

    // 2. Stripe Subscription Cancellation for Owner & Partner (query ALL Stripe customers for this email)
    if (stripeSecretKey) {
      try {
        const stripe = new Stripe(stripeSecretKey);
        const customers = await stripe.customers.list({ email: cleanEmail, limit: 100 });
        for (const customer of customers.data) {
          const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'all',
          });
          for (const sub of subscriptions.data) {
            if (sub.status === 'active' || sub.status === 'trialing') {
              await stripe.subscriptions.cancel(sub.id);
              canceledSubscriptionsCount++;
              console.log(`[Account Delete] Cancelled Stripe subscription ${sub.id} (customer ${customer.id}) for ${cleanEmail}`);
            }
          }
        }
      } catch (stripeErr) {
        console.error('[Account Delete] Owner Stripe cancel error:', stripeErr);
      }
    }

    // 3. Delete comments on user's lost pets
    try {
      const { data: userLostPets } = await supabaseAdmin
        .from('lost_pets')
        .select('id')
        .eq('contact_email', cleanEmail);
      
      if (userLostPets && userLostPets.length > 0) {
        const petIds = userLostPets.map(p => p.id);
        await supabaseAdmin.from('lost_pet_comments').delete().in('lost_pet_id', petIds);
      }
    } catch (commentsErr) {
      console.error('[Account Delete] Failed to delete lost pet comments:', commentsErr);
    }

    // 4. Delete user data from all tables
    await supabaseAdmin.from('owner_pets').delete().eq('owner_email', cleanEmail);
    await supabaseAdmin.from('sitting_requests').delete().eq('owner_email', cleanEmail);
    await supabaseAdmin.from('notifications').delete().eq('email', cleanEmail);
    await supabaseAdmin.from('lost_pets').delete().eq('contact_email', cleanEmail);
    await supabaseAdmin.from('emails').delete().eq('email', cleanEmail);
    await supabaseAdmin.from('sitters').delete().eq('email', cleanEmail);

    // 5. Send Account Deletion & Subscription Cancellation Confirmation Email via Resend
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
      const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');
      
      const subInfoText = canceledSubscriptionsCount > 0
        ? `<p style="${emailStyles.p}">Your active subscription has been <strong>immediately canceled in Stripe</strong>. You will not receive any further billing charges.</p>`
        : `<p style="${emailStyles.p}">Your Lumo Bites account and associated profile data have been permanently deleted.</p>`;

      await resend.emails.send({
        from: fromEmail,
        to: cleanEmail,
        subject: '🗑️ Your Lumo Bites account has been deleted',
        html: brandedEmail({
          subject: '🗑️ Your Lumo Bites account has been deleted',
          preheader: 'Confirmation that your Lumo Bites account and data have been deleted.',
          body: `
    <h1 style="${emailStyles.h1}">Account Deleted</h1>
    <p style="${emailStyles.p}">This email confirms that your Lumo Bites account (<strong>${cleanEmail}</strong>) and all associated data (pets, bookings, community posts) have been permanently deleted.</p>
    ${subInfoText}
    ${emailStyles.highlightBox(`
      <p style="margin:0 0 4px 0;font-size:12px;color:#8B6A50;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Account Status</p>
      <p style="margin:0;font-size:22px;font-weight:800;color:#3B2410;">Permanently Closed</p>
      <p style="margin:6px 0 0 0;font-size:13px;color:#8B6A50;">No further action is required.</p>
    `)}
    <p style="${emailStyles.pSmall}">If you did not request this deletion or have any questions, please contact support immediately.</p>
    ${emailStyles.divider}
    ${emailStyles.signoff}
  `
        })
      });
      console.log(`[Account Delete] Confirmation email sent to: ${cleanEmail}`);
    } catch (emailErr) {
      console.error('[Account Delete] Failed to send deletion email:', emailErr);
    }

    const response = NextResponse.json({ success: true, message: 'Account deleted successfully.' });
    clearAccountSessionCookie(response);
    return response;
  } catch (err: any) {
    console.error('[Account Delete] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
