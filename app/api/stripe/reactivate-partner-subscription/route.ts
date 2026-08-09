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
    let { partner_id, partner_type, email, type } = body;

    const pType = partner_type || type;
    const tableMap: Record<string, string> = {
      shelter: 'shelters',
      pet_daycare: 'pet_daycares',
      vet_boarding: 'vet_clinics',
      vet: 'vet_clinics',
      daycare: 'pet_daycares',
    };

    const tableName = pType ? tableMap[pType] : null;

    if (!tableName) {
      return NextResponse.json({ error: 'Missing or invalid partner_type.' }, { status: 400 });
    }

    let partner: any = null;
    if (partner_id) {
      const { data } = await supabaseAdmin
        .from(tableName)
        .select('id, stripe_subscription_id')
        .eq('id', partner_id)
        .maybeSingle();
      partner = data;
    } else if (email) {
      const { data } = await supabaseAdmin
        .from(tableName)
        .select('id, stripe_subscription_id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();
      partner = data;
    }

    if (!partner || !partner.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active Stripe subscription found for this partner.' }, { status: 404 });
    }

    // Update Stripe subscription to resume automatic renewals (cancel_at_period_end: false)
    const updatedSub = await stripe.subscriptions.update(partner.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    const periodEndMs = updatedSub?.current_period_end ? updatedSub.current_period_end * 1000 : null;
    const periodEndIso = periodEndMs && !isNaN(periodEndMs) ? new Date(periodEndMs).toISOString() : null;

    // Update database record
    await supabaseAdmin
      .from(tableName)
      .update({
        cancel_at_period_end: false,
        ...(periodEndIso ? { current_period_end: periodEndIso } : {})
      })
      .eq('id', partner.id);

    return NextResponse.json({
      success: true,
      cancel_at_period_end: false,
      current_period_end: periodEndIso,
    });
  } catch (err: any) {
    console.error('[Reactivate Partner Subscription API] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to reactivate subscription' }, { status: 500 });
  }
}
