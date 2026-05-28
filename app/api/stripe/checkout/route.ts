import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!stripeSecretKey) {
      console.error('[Stripe Checkout API] Missing STRIPE_SECRET_KEY');
      return NextResponse.json({ error: 'Stripe is not configured on the server.' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey);

    const body = await request.json();
    const { email } = body;
    const referralCode = request.cookies.get('lumobites_ref')?.value;

    if (!email) {
      return NextResponse.json({ error: 'Email is required to checkout.' }, { status: 400 });
    }

    // 1. Get or create product
    let product;
    const products = await stripe.products.list({ limit: 100 });
    product = products.data.find(p => p.name === 'Lumo Bites Pro');

    if (!product) {
      product = await stripe.products.create({
        name: 'Lumo Bites Pro',
        description: 'Unlimited ingredient safety scans and detailed AI reports.',
        metadata: {
          service: 'safety-scanner',
        },
      });
    }

    // 2. Get or create price (2.99 USD / month recurring)
    let price;
    const prices = await stripe.prices.list({ product: product.id, limit: 100 });
    price = prices.data.find(p => p.unit_amount === 299 && p.recurring?.interval === 'month');

    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: 299,
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
      });
    }

    // 3. Create checkout session
    const origin = request.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: email.toLowerCase().trim(),
      success_url: `${origin}/scan?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(email)}`,
      cancel_url: `${origin}/scan`,
      metadata: {
        email: email.toLowerCase().trim(),
        service: 'safety-scanner-pro',
        ...(referralCode && { referral_code: referralCode }),
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    console.error('[Stripe Checkout API] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
