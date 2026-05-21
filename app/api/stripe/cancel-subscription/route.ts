import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, subscriptionId } = body;

    if (!email || !subscriptionId) {
      return NextResponse.json({ error: 'Email and subscriptionId are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check for owner/admin bypass
    const isOwner = cleanEmail === 'premierpetnutritionllc@gmail.com';

    if (isOwner || subscriptionId === 'admin_bypass') {
      // For admin/owner, just update Supabase Pro status to false
      const { error: dbError } = await supabase
        .from('emails')
        .update({ is_pro: false })
        .eq('email', cleanEmail);

      if (dbError) {
        console.error('[Cancel Subscription API] Supabase DB error (owner):', dbError);
        return NextResponse.json({ error: 'Failed to update Pro status in database' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Admin bypass removed' });
    }

    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe is not configured on the server.' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey);

    // Cancel Stripe subscription immediately
    console.log(`[Cancel Subscription API] Cancelling Stripe subscription: ${subscriptionId} for email: ${cleanEmail}`);
    await stripe.subscriptions.cancel(subscriptionId);

    // Update Pro status in Supabase database to false
    const { error: dbError } = await supabase
      .from('emails')
      .update({ is_pro: false })
      .eq('email', cleanEmail);

    if (dbError) {
      console.error('[Cancel Subscription API] Supabase DB error:', dbError);
      return NextResponse.json({ error: 'Failed to update Pro status in database' }, { status: 500 });
    }

    console.log(`[Cancel Subscription API] Successfully cancelled subscription and disabled Pro for: ${cleanEmail}`);
    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('[Cancel Subscription API] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
