import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserProStatusDetails } from '@/lib/aiLimiter';
import { getVerifiedSessionEmail } from '@/lib/accountAuth';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

function safeFormatDate(dateVal: any): string {
  if (!dateVal) return '30-Day Free Trial';
  try {
    const timeMs = typeof dateVal === 'number' ? (dateVal > 1e11 ? dateVal : dateVal * 1000) : new Date(dateVal).getTime();
    if (isNaN(timeMs) || timeMs <= 0) return '30-Day Free Trial';
    return new Date(timeMs).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return '30-Day Free Trial';
  }
}

export async function POST(request: NextRequest) {
  try {
    const verifiedEmail = await getVerifiedSessionEmail(request);

    if (!verifiedEmail) {
      return NextResponse.json({ error: 'Unauthorized — valid session cookie required' }, { status: 401 });
    }

    const cleanEmail = verifiedEmail.toLowerCase().trim();

    const proDetails = await getUserProStatusDetails(cleanEmail);

    if (proDetails.proSource === 'unlimited') {
      return NextResponse.json({
        success: true,
        active: true,
        adminBypass: true,
        email: cleanEmail,
        verified: !!verifiedEmail,
        nextBillingDate: 'N/A - Unlimited Admin Access 🐾',
        subscriptionId: 'admin_bypass'
      });
    }

    if (proDetails.isPro && proDetails.proSource.startsWith('partner_')) {
      const partnerMap: Record<string, { partnerType: 'vet' | 'daycare' | 'shelter'; partnerLabel: string; dashboardUrl: string; table: string; defaultPrice: number }> = {
        partner_vet: { partnerType: 'vet', partnerLabel: 'Vet Boarding', dashboardUrl: '/vet-boarding/dashboard', table: 'vet_clinics', defaultPrice: 40 },
        partner_daycare: { partnerType: 'daycare', partnerLabel: 'Pet Daycare', dashboardUrl: '/pet-daycare/dashboard', table: 'pet_daycares', defaultPrice: 30 },
        partner_shelter: { partnerType: 'shelter', partnerLabel: 'Shelter', dashboardUrl: '/adoption/shelter/dashboard', table: 'shelters', defaultPrice: 20 },
      };

      const info = partnerMap[proDetails.proSource] || { partnerType: 'vet', partnerLabel: 'Partner', dashboardUrl: '/', table: 'vet_clinics', defaultPrice: 40 };

      // Fetch live partner record from Supabase
      const { data: partnerRecord } = await supabaseAdmin
        .from(info.table)
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      // Auto-sync with Stripe if partner is showing trialing or missing subscription ID
      if (stripeSecretKey && partnerRecord && (partnerRecord.subscription_status === 'trialing' || !partnerRecord.stripe_subscription_id)) {
        try {
          const stripe = new Stripe(stripeSecretKey);
          const customers = await stripe.customers.list({ email: cleanEmail, limit: 5 });
          for (const customer of customers.data) {
            const subs = await stripe.subscriptions.list({ customer: customer.id, status: 'active', limit: 5 });
            if (subs.data.length > 0) {
              const activeSub = subs.data[0];
              const updatePayload: any = {
                stripe_customer_id: customer.id,
                stripe_subscription_id: activeSub.id,
                subscription_status: 'active',
                cancel_at_period_end: !!activeSub.cancel_at_period_end,
              };
              if (activeSub.current_period_end) {
                updatePayload.current_period_end = new Date(activeSub.current_period_end * 1000).toISOString();
                partnerRecord.current_period_end = updatePayload.current_period_end;
              }
              if (info.table !== 'vet_clinics') {
                updatePayload.is_paused = false;
              } else {
                updatePayload.status = 'approved';
              }

              await supabaseAdmin.from(info.table).update(updatePayload).eq('email', cleanEmail);
              partnerRecord.subscription_status = 'active';
              partnerRecord.stripe_subscription_id = activeSub.id;
              partnerRecord.stripe_customer_id = customer.id;
              partnerRecord.cancel_at_period_end = !!activeSub.cancel_at_period_end;
              break;
            }
          }
        } catch (e) {
          console.error('[Subscription Details] Error auto-syncing partner Stripe status:', e);
        }
      }

      // Re-evaluate proDetails after auto-sync
      const updatedProDetails = await getUserProStatusDetails(cleanEmail);

      const businessName = partnerRecord?.clinic_name || partnerRecord?.business_name || partnerRecord?.org_name || info.partnerLabel;
      const cancelAtPeriodEnd = !!partnerRecord?.cancel_at_period_end;
      const currentPeriodEnd = partnerRecord?.current_period_end;

      const dateToFormat = currentPeriodEnd || partnerRecord?.trial_end;
      const nextBillingDate = safeFormatDate(dateToFormat);

      const dbPartnerType = info.table === 'vet_clinics' ? 'vet_boarding' : info.table === 'pet_daycares' ? 'pet_daycare' : 'shelter';

      return NextResponse.json({
        success: true,
        active: true,
        isPartner: true,
        partnerId: partnerRecord?.id,
        dbPartnerType,
        partnerType: info.partnerType,
        partnerLabel: info.partnerLabel,
        dashboardUrl: info.dashboardUrl,
        businessName,
        priceUsd: info.defaultPrice,
        cancelAtPeriodEnd,
        status: partnerRecord?.status || 'approved',
        rawSubscriptionStatus: proDetails.rawSubscriptionStatus,
        billingHealthLabel: proDetails.billingHealthLabel,
        adminBypass: false,
        email: cleanEmail,
        verified: !!verifiedEmail,
        nextBillingDate,
        subscriptionId: partnerRecord?.stripe_subscription_id || 'partner_bypass'
      });
    }

    if (!proDetails.isPro) {
      return NextResponse.json({
        success: true,
        active: false,
        email: cleanEmail,
        verified: !!verifiedEmail,
        proSource: proDetails.proSource,
        error: 'Free Account — No active paid subscription.'
      });
    }

    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe is not configured on the server.' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey);

    const customers = await stripe.customers.list({ email: cleanEmail, limit: 1 });
    if (!customers.data || customers.data.length === 0) {
      return NextResponse.json({
        success: true,
        active: false,
        email: cleanEmail,
        verified: !!verifiedEmail,
        error: 'Stripe customer record not found for this email address.'
      });
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10
    });

    const activeSubscription = subscriptions.data.find(
      sub => sub.status === 'active' || sub.status === 'trialing'
    );

    if (!activeSubscription) {
      return NextResponse.json({
        success: true,
        active: false,
        email: cleanEmail,
        verified: !!verifiedEmail,
        error: 'No active subscription found in Stripe.'
      });
    }

    let rawPeriodEnd: number | null | undefined = activeSubscription.current_period_end;
    if (!rawPeriodEnd && activeSubscription.items?.data?.[0]) {
      rawPeriodEnd = (activeSubscription.items.data[0] as any).current_period_end;
    }

    let nextBillingDate = 'N/A';
    let periodEndMs = 0;
    let daysRemaining = 0;

    if (rawPeriodEnd && rawPeriodEnd > 0) {
      periodEndMs = rawPeriodEnd * 1000;
      try {
        nextBillingDate = new Date(periodEndMs).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'UTC',
        });
      } catch {
        nextBillingDate = new Date(periodEndMs).toDateString();
      }
      daysRemaining = Math.max(0, Math.ceil((periodEndMs - Date.now()) / (1000 * 60 * 60 * 24)));
    }

    return NextResponse.json({
      success: true,
      active: true,
      adminBypass: false,
      email: cleanEmail,
      verified: !!verifiedEmail,
      nextBillingDate,
      periodEndMs,
      daysRemaining,
      cancelAtPeriodEnd: activeSubscription.cancel_at_period_end,
      subscriptionId: activeSubscription.id
    });
  } catch (err: any) {
    console.error('[Subscription Details API] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
