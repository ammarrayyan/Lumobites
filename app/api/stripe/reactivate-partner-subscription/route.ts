import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe is not configured on the server.' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey);
    const body = await request.json();
    const { partner_id, partner_type } = body;

    if (!partner_id || !partner_type) {
      return NextResponse.json({ error: 'Missing partner_id or partner_type.' }, { status: 400 });
    }

    const tableMap: Record<string, string> = {
      shelter: 'shelters',
      pet_daycare: 'pet_daycares',
      vet_boarding: 'vet_clinics',
    };

    const tableName = tableMap[partner_type];
    if (!tableName) {
      return NextResponse.json({ error: 'Invalid partner_type.' }, { status: 400 });
    }

    // Fetch partner subscription ID
    const { data: partner, error: fetchErr } = await supabaseAdmin
      .from(tableName)
      .select('stripe_subscription_id')
      .eq('id', partner_id)
      .single();

    if (fetchErr || !partner || !partner.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active Stripe subscription found for this partner.' }, { status: 404 });
    }

    // Update Stripe subscription to resume automatic renewals (cancel_at_period_end: false)
    const updatedSub = await stripe.subscriptions.update(partner.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    // Update database record
    await supabaseAdmin
      .from(tableName)
      .update({ cancel_at_period_end: false })
      .eq('id', partner_id);

    return NextResponse.json({
      success: true,
      cancel_at_period_end: false,
      current_period_end: new Date(updatedSub.current_period_end * 1000).toISOString(),
    });
  } catch (err: any) {
    console.error('[Reactivate Partner Subscription API] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to reactivate subscription' }, { status: 500 });
  }
}
