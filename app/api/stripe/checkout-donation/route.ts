import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe is not configured on the server.' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const body = await request.json();
    const { amount, email, pet_id, pet_name, return_url } = body;

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount < 1) {
      return NextResponse.json(
        { error: 'Please enter a valid donation amount ($1.00 minimum).' },
        { status: 400 }
      );
    }

    if (numAmount > 10000) {
      return NextResponse.json(
        { error: 'Donation amount exceeds maximum allowed.' },
        { status: 400 }
      );
    }

    const unitAmount = Math.round(numAmount * 100);
    const origin = request.nextUrl.origin;

    const fallbackReturn = `${origin}/lost-pets`;
    const baseReturnUrl = return_url || fallbackReturn;
    
    // Add success query param
    const successSeparator = baseReturnUrl.includes('?') ? '&' : '?';
    const successUrl = `${baseReturnUrl}${successSeparator}donation=success`;
    const cancelUrl = baseReturnUrl;

    const productName = 'Support Lumo Bites (Lost Pets Community Fund)';
    const productDescription = pet_name
      ? `One-time contribution celebrating ${pet_name}'s reunion and supporting free lost pet recovery.`
      : 'One-time support donation to keep lost pet reunions free for all families.';

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: productDescription,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: 'donation',
        pet_id: pet_id || '',
        pet_name: pet_name || '',
        donor_email: email ? email.toLowerCase().trim() : '',
      },
    };

    if (email && email.includes('@')) {
      sessionParams.customer_email = email.toLowerCase().trim();
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error('Error creating donation checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment.' },
      { status: 500 }
    );
  }
}
