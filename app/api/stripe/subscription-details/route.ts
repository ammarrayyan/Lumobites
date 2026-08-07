import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUserProStatusDetails } from '@/lib/aiLimiter';
import { getVerifiedSessionEmail } from '@/lib/accountAuth';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

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

    if (!proDetails.isPro) {
      return NextResponse.json({
        success: true,
        active: false,
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
