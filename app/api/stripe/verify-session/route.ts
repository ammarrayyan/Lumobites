import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id parameter' }, { status: 400 });
    }

    if (!stripeSecretKey) {
      console.error('[Stripe Verify API] Missing STRIPE_SECRET_KEY');
      return NextResponse.json({ error: 'Stripe is not configured on the server.' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey);

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ isPro: false, error: 'Payment not completed' }, { status: 400 });
    }

    const email = session.customer_details?.email || session.metadata?.email;
    if (!email) {
      return NextResponse.json({ error: 'No email associated with this session' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Update is_pro in Supabase
    // If the email doesn't exist, we upsert it.
    const { error: dbError } = await supabase
      .from('emails')
      .upsert(
        {
          email: cleanEmail,
          is_pro: true,
          source: 'stripe',
          created_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );

    if (dbError) {
      console.error('[Stripe Verify API] Supabase DB error:', dbError);
      return NextResponse.json({ error: 'Database update failed: ' + dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, isPro: true, email: cleanEmail });
  } catch (err: any) {
    console.error('[Stripe Verify API] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
