import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId is required' }, { status: 400 });
    }

    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe is not configured on the server.' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey);

    // Undo cancel_at_period_end — subscription renews normally
    await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: false });

    console.log(`[Reactivate Subscription API] Successfully reactivated subscription: ${subscriptionId}`);
    return NextResponse.json({ success: true, message: 'Subscription reactivated successfully.' });
  } catch (err: any) {
    console.error('[Reactivate Subscription API] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
