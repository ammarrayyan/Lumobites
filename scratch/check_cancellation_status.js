const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/"/g, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const validKey = serviceKey && serviceKey.startsWith('ey') ? serviceKey : anonKey;

const supabaseAdmin = createClient(url, validKey);
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

async function checkCancellation() {
  console.log('--- CHECKING CANCELLATION STATUS ---');

  // 1. Check Supabase DB
  const { data: clinic, error: cErr } = await supabaseAdmin
    .from('vet_clinics')
    .select('*')
    .eq('clinic_name', 'Lumo bites vet')
    .single();

  console.log('Database Record:', {
    id: clinic?.id,
    clinic_name: clinic?.clinic_name,
    subscription_status: clinic?.subscription_status,
    cancel_at_period_end: clinic?.cancel_at_period_end,
    stripe_subscription_id: clinic?.stripe_subscription_id,
    current_period_end: clinic?.current_period_end,
  });

  // 2. Check Stripe API
  if (stripeSecretKey && clinic?.stripe_subscription_id) {
    try {
      const stripe = new Stripe(stripeSecretKey);
      const sub = await stripe.subscriptions.retrieve(clinic.stripe_subscription_id);
      console.log('Stripe Live Subscription Status:', {
        id: sub.id,
        status: sub.status,
        cancel_at_period_end: sub.cancel_at_period_end,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      });
    } catch (err) {
      console.error('Failed to retrieve Stripe subscription:', err.message);
    }
  }
}

checkCancellation();
