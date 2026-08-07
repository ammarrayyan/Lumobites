import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getVerifiedSessionEmail } from '@/lib/accountAuth';
import { getUserProStatusDetails } from '@/lib/aiLimiter';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    const verifiedEmail = await getVerifiedSessionEmail(request);
    if (!verifiedEmail) {
      return NextResponse.json({ error: 'Unauthorized — valid session cookie required' }, { status: 401 });
    }

    let subscriptionId = '';
    try {
      const body = await request.json();
      subscriptionId = body.subscriptionId;
    } catch {}

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId is required' }, { status: 400 });
    }

    const cleanEmail = verifiedEmail.toLowerCase().trim();

    // Check if account is a partner subscription — block reactivation from consumer account page
    const proDetails = await getUserProStatusDetails(cleanEmail);
    if (proDetails.proSource.startsWith('partner_') || subscriptionId === 'partner_bypass') {
      return NextResponse.json({
        error: 'Partner subscriptions cannot be managed from the consumer account page. Please manage your business subscription in your partner dashboard.'
      }, { status: 403 });
    }

    // Verify subscription belongs to authenticated user
    const customers = await stripe.customers.list({ email: cleanEmail, limit: 1 });
    if (!customers.data || customers.data.length === 0) {
      return NextResponse.json({ error: 'No Stripe customer record found for authenticated user' }, { status: 403 });
    }

    const customerId = customers.data[0].id;
    const subObj = await stripe.subscriptions.retrieve(subscriptionId);

    if (!subObj || subObj.customer !== customerId) {
      return NextResponse.json({ error: 'Unauthorized — subscription does not belong to authenticated user' }, { status: 403 });
    }

    // Undo cancel_at_period_end — subscription renews normally
    await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: false });

    console.log(`[Reactivate Subscription API] Successfully reactivated subscription: ${subscriptionId} for ${cleanEmail}`);
    return NextResponse.json({ success: true, message: 'Subscription reactivated successfully.' });
  } catch (err: any) {
    console.error('[Reactivate Subscription API] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
