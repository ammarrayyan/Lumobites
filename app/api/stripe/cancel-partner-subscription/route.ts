import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { getVerifiedSessionEmail } from '@/lib/accountAuth';
import { isAuthorizedAdmin } from '@/lib/adminAuth';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
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

    const isAdmin = isAuthorizedAdmin(request);
    const verifiedEmail = isAdmin ? null : await getVerifiedSessionEmail(request);
    if (!isAdmin && !verifiedEmail) {
      return NextResponse.json({ error: 'Unauthorized — please sign in.' }, { status: 401 });
    }

    // Fetch partner subscription ID and owner email
    const { data: partner, error: fetchErr } = await supabaseAdmin
      .from(tableName)
      .select('id, email, stripe_subscription_id')
      .eq('id', partner_id)
      .single();

    if (fetchErr || !partner) {
      return NextResponse.json({ error: 'Partner record not found.' }, { status: 404 });
    }

    if (!isAdmin) {
      const partnerEmail = (partner.email || '').toLowerCase().trim();
      if (!partnerEmail || verifiedEmail !== partnerEmail) {
        return NextResponse.json({ error: 'Forbidden — you can only cancel your own partner subscription.' }, { status: 403 });
      }
    }

    if (!partner.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active Stripe subscription found for this partner.' }, { status: 404 });
    }

    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe is not configured on the server.' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey);

    // Update Stripe subscription to cancel at period end
    const updatedSub = await stripe.subscriptions.update(partner.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    const currentPeriodEndIso = updatedSub.current_period_end
      ? new Date(updatedSub.current_period_end * 1000).toISOString()
      : null;

    // Update database record
    await supabaseAdmin
      .from(tableName)
      .update({ cancel_at_period_end: true, current_period_end: currentPeriodEndIso })
      .eq('id', partner_id);

    return NextResponse.json({
      success: true,
      cancel_at_period_end: true,
      current_period_end: currentPeriodEndIso,
    });
  } catch (err: any) {
    console.error('[Cancel Partner Subscription API] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to cancel subscription' }, { status: 500 });
  }
}
