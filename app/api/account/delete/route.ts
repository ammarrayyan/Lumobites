import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Stripe Subscription Cancellation for Sitter Profile (if exists)
    try {
      const { data: sitter } = await supabaseAdmin
        .from('sitters')
        .select('id, stripe_customer_id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (sitter?.stripe_customer_id && stripeSecretKey) {
        const stripe = new Stripe(stripeSecretKey);
        const subscriptions = await stripe.subscriptions.list({
          customer: sitter.stripe_customer_id,
          status: 'active',
        });
        for (const sub of subscriptions.data) {
          await stripe.subscriptions.cancel(sub.id);
          console.log(`[Account Delete] Cancelled Stripe subscription ${sub.id} for ${cleanEmail}`);
        }
      }

      if (sitter?.id) {
        // Delete reviews of the sitter
        await supabaseAdmin.from('sitter_reviews').delete().eq('sitter_id', sitter.id);
        // Delete requests assigned to the sitter
        await supabaseAdmin.from('sitting_requests').delete().eq('sitter_id', sitter.id);
      }
    } catch (sitterErr) {
      console.error('[Account Delete] Sitter details/Stripe error:', sitterErr);
    }

    // 2. Stripe Subscription Cancellation for Owner (if exists via Stripe customer matching)
    if (stripeSecretKey) {
      try {
        const stripe = new Stripe(stripeSecretKey);
        const customers = await stripe.customers.list({ email: cleanEmail, limit: 1 });
        if (customers.data.length > 0) {
          const customerId = customers.data[0].id;
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
          });
          for (const sub of subscriptions.data) {
            await stripe.subscriptions.cancel(sub.id);
            console.log(`[Account Delete] Cancelled Stripe subscription ${sub.id} for ${cleanEmail}`);
          }
        }
      } catch (stripeErr) {
        console.error('[Account Delete] Owner Stripe cancel error:', stripeErr);
      }
    }

    // 3. Delete comments on user's lost pets
    try {
      const { data: userLostPets } = await supabaseAdmin
        .from('lost_pets')
        .select('id')
        .eq('contact_email', cleanEmail);
      
      if (userLostPets && userLostPets.length > 0) {
        const petIds = userLostPets.map(p => p.id);
        await supabaseAdmin.from('lost_pet_comments').delete().in('lost_pet_id', petIds);
      }
    } catch (commentsErr) {
      console.error('[Account Delete] Failed to delete lost pet comments:', commentsErr);
    }

    // 4. Delete user data from all tables
    await supabaseAdmin.from('owner_pets').delete().eq('owner_email', cleanEmail);
    await supabaseAdmin.from('pets').delete().eq('owner_email', cleanEmail);
    await supabaseAdmin.from('sitting_requests').delete().eq('owner_email', cleanEmail);
    await supabaseAdmin.from('notifications').delete().eq('email', cleanEmail);
    await supabaseAdmin.from('lost_pets').delete().eq('contact_email', cleanEmail);
    await supabaseAdmin.from('emails').delete().eq('email', cleanEmail);
    await supabaseAdmin.from('sitters').delete().eq('email', cleanEmail);

    return NextResponse.json({ success: true, message: 'Account deleted successfully.' });
  } catch (err: any) {
    console.error('[Account Delete] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
