import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check for owner/admin bypass
    const isOwner = cleanEmail === 'premierpetnutritionllc@gmail.com';

    if (isOwner) {
      return NextResponse.json({
        success: true,
        active: true,
        adminBypass: true,
        nextBillingDate: 'N/A - Lifetime Owner Access 🐾',
        subscriptionId: 'admin_bypass'
      });
    }

    // Verify Pro status first in Supabase to prevent unauthenticated access (check both owner and sitter tables)
    const { data: emailData } = await supabase
      .from('emails')
      .select('is_pro')
      .eq('email', cleanEmail)
      .maybeSingle();

    const { data: sitterData } = await supabase
      .from('sitters')
      .select('is_pro')
      .eq('email', cleanEmail)
      .maybeSingle();

    const isPro = (emailData && emailData.is_pro) || (sitterData && sitterData.is_pro);

    if (!isPro) {
      return NextResponse.json({
        success: true,
        active: false,
        error: 'No active Pro subscription found for this email address.'
      }, { status: 404 });
    }

    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe is not configured on the server.' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey);

    // Find Stripe customer by email
    const customers = await stripe.customers.list({ email: cleanEmail, limit: 1 });
    if (!customers.data || customers.data.length === 0) {
      return NextResponse.json({
        success: true,
        active: false,
        error: 'Stripe customer record not found for this email address.'
      }, { status: 404 });
    }

    const customerId = customers.data[0].id;

    // Retrieve active or trialing subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10
    });

    const activeSubscription = subscriptions.data.find(
      sub => sub.status === 'active' || sub.status === 'trialing'
    );

    if (!activeSubscription) {
      return NextResponse.json({
        success: true,
        active: false,
        error: 'No active subscription found in Stripe.'
      }, { status: 404 });
    }

    // Log raw subscription data to diagnose the Invalid Date issue
    console.log('[Subscription Details API] Raw subscription:', JSON.stringify({
      id: activeSubscription.id,
      status: activeSubscription.status,
      current_period_end: activeSubscription.current_period_end,
      cancel_at_period_end: activeSubscription.cancel_at_period_end,
      items_count: activeSubscription.items?.data?.length,
    }));

    // Defensively extract current_period_end — fall back to items[0] if top-level is missing
    let rawPeriodEnd: number | null | undefined = activeSubscription.current_period_end;
    if (!rawPeriodEnd && activeSubscription.items?.data?.[0]) {
      rawPeriodEnd = (activeSubscription.items.data[0] as any).current_period_end;
      console.log('[Subscription Details API] Used items[0].current_period_end fallback:', rawPeriodEnd);
    }

    let nextBillingDate = 'N/A';
    let periodEndMs = 0;
    let daysRemaining = 0;

    if (rawPeriodEnd && rawPeriodEnd > 0) {
      periodEndMs = rawPeriodEnd * 1000;
      try {
        nextBillingDate = new Date(periodEndMs).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'UTC',
        });
      } catch {
        nextBillingDate = new Date(periodEndMs).toDateString();
      }
      daysRemaining = Math.max(0, Math.ceil((periodEndMs - Date.now()) / (1000 * 60 * 60 * 24)));
    } else {
      console.error('[Subscription Details API] current_period_end is missing or zero for subscription:', activeSubscription.id);
    }

    console.log('[Subscription Details API] Resolved nextBillingDate:', nextBillingDate, 'daysRemaining:', daysRemaining);

    return NextResponse.json({
      success: true,
      active: true,
      adminBypass: false,
      nextBillingDate,
      periodEndMs,
      daysRemaining,
      cancelAtPeriodEnd: activeSubscription.cancel_at_period_end,
      subscriptionId: activeSubscription.id
    });

  } catch (err: any) {
    console.error('[Subscription Details API] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
