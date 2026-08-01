import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { getPartnerPricing, updatePartnerPricing } from '@/lib/partner-pricing';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!stripeSecretKey) {
      console.error('[Stripe Partner Checkout API] Missing STRIPE_SECRET_KEY');
      return NextResponse.json({ error: 'Stripe is not configured on the server.' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey);
    const body = await request.json();
    const { partner_id, partner_type, email } = body;

    if (!partner_id || !partner_type || !email) {
      return NextResponse.json({ error: 'Missing partner_id, partner_type, or email.' }, { status: 400 });
    }

    const validTypes = ['vet_boarding', 'pet_daycare', 'shelter'];
    if (!validTypes.includes(partner_type)) {
      return NextResponse.json({ error: 'Invalid partner_type value.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Get current pricing config from database (defaults to $20 shelter, $30 daycare, $40 vet boarding)
    const pricing = await getPartnerPricing(partner_type as any);
    const amountInCents = Math.round(pricing.monthly_price_usd * 100);

    // 2. Get or create Stripe Product
    const productNameMap: Record<string, string> = {
      shelter: 'Lumo Shelter Partner Subscription',
      pet_daycare: 'Lumo Pet Daycare Partner Subscription',
      vet_boarding: 'Lumo Vet Boarding Partner Subscription',
    };

    const productName = productNameMap[partner_type] || 'Lumo Partner Subscription';

    const products = await stripe.products.list({ limit: 100 });
    let product = products.data.find(p => p.name === productName);

    if (!product) {
      product = await stripe.products.create({
        name: productName,
        description: `Monthly subscription listing for ${productName}.`,
        metadata: { partner_type },
      });
    }

    // 3. Get or create Stripe Price object
    let priceId = pricing.stripe_price_id;

    if (priceId) {
      try {
        const existingPrice = await stripe.prices.retrieve(priceId);
        if (existingPrice.unit_amount !== amountInCents || !existingPrice.active) {
          priceId = undefined;
        }
      } catch (err) {
        priceId = undefined;
      }
    }

    if (!priceId) {
      const prices = await stripe.prices.list({ product: product.id, limit: 100 });
      let matchingPrice = prices.data.find(
        p => p.unit_amount === amountInCents && p.recurring?.interval === 'month' && p.active
      );

      if (!matchingPrice) {
        matchingPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: amountInCents,
          currency: 'usd',
          recurring: { interval: 'month' },
        });
      }

      priceId = matchingPrice.id;
      // Save created priceId to partner_pricing_settings
      await updatePartnerPricing(partner_type as any, pricing.monthly_price_usd, priceId, pricing.trial_days_default);
    }

    // 4. Determine dashboard success / cancel URLs
    const origin = request.nextUrl.origin;
    const returnPathMap: Record<string, string> = {
      shelter: '/adoption/shelter/dashboard',
      pet_daycare: '/pet-daycare/dashboard',
      vet_boarding: '/vet-boarding/dashboard',
    };

    const returnPath = returnPathMap[partner_type] || '/account';

    // 5. Create Stripe Checkout Session in subscription mode
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: cleanEmail,
      success_url: `${origin}${returnPath}?billing_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${returnPath}`,
      metadata: {
        partner_id,
        partner_type,
        email: cleanEmail,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    console.error('[Stripe Partner Checkout API] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
