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

    // Verify Pro status first in Supabase to prevent unauthenticated access
    const { data: userData, error: userError } = await supabase
      .from('emails')
      .select('is_pro')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (userError || !userData || !userData.is_pro) {
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

    const nextBillingDate = new Date(activeSubscription.current_period_end * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return NextResponse.json({
      success: true,
      active: true,
      adminBypass: false,
      nextBillingDate,
      subscriptionId: activeSubscription.id
    });

  } catch (err: any) {
    console.error('[Subscription Details API] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
