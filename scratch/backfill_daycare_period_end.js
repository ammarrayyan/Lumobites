const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/"/g, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const validKey = serviceKey && serviceKey.startsWith('ey') ? serviceKey : anonKey;

const supabaseAdmin = createClient(url, validKey);
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

async function backfillDaycare() {
  console.log('--- BACKFILLING "LUMO DAYCARE" CURRENT_PERIOD_END ---');

  const { data: daycare } = await supabaseAdmin
    .from('pet_daycares')
    .select('*')
    .eq('email', 'ammar-rayyan@hotmail.com')
    .single();

  if (!daycare) {
    console.error('Daycare not found!');
    return;
  }

  let periodEndIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  if (stripeSecretKey && daycare.stripe_subscription_id) {
    try {
      const stripe = new Stripe(stripeSecretKey);
      const sub = await stripe.subscriptions.retrieve(daycare.stripe_subscription_id);
      if (sub && sub.current_period_end) {
        periodEndIso = new Date(sub.current_period_end * 1000).toISOString();
        console.log('Fetched live Stripe current_period_end:', periodEndIso);
      }
    } catch (err) {
      console.warn('Could not fetch Stripe subscription:', err.message);
    }
  }

  const { data: updated, error } = await supabaseAdmin
    .from('pet_daycares')
    .update({ current_period_end: periodEndIso })
    .eq('id', daycare.id)
    .select('*')
    .single();

  if (error) {
    console.error('Failed to backfill daycare:', error.message);
  } else {
    console.log('✅ BACKFILL SUCCESSFUL FOR LUMO DAYCARE:', {
      id: updated.id,
      business_name: updated.business_name,
      subscription_status: updated.subscription_status,
      current_period_end: updated.current_period_end,
      stripe_subscription_id: updated.stripe_subscription_id,
    });
  }
}

backfillDaycare();
