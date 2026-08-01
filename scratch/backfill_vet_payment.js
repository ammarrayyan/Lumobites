const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/"/g, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const validKey = serviceKey && serviceKey.startsWith('ey') ? serviceKey : anonKey;

const supabaseAdmin = createClient(url, validKey);
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

async function backfill() {
  console.log('--- BACKFILLING "LUMO BITES VET" SUBSCRIPTION STATUS ---');

  let stripeCustId = 'cus_test_backfill';
  let stripeSubId = 'sub_test_backfill';

  if (stripeSecretKey) {
    try {
      const stripe = new Stripe(stripeSecretKey);
      const sessions = await stripe.checkout.sessions.list({ limit: 10 });
      console.log('Recent Stripe checkout sessions found:', sessions.data.length);
      const vetSession = sessions.data.find(s => s.metadata?.partner_type === 'vet_boarding' || s.customer_details?.email === 'ammar-rayyan@hotmail.com');
      if (vetSession) {
        console.log('Found vet session in Stripe:', vetSession.id, 'Sub ID:', vetSession.subscription, 'Cust ID:', vetSession.customer);
        if (vetSession.customer) stripeCustId = vetSession.customer;
        if (vetSession.subscription) stripeSubId = vetSession.subscription;
      }
    } catch (err) {
      console.warn('Could not fetch Stripe live sessions:', err.message);
    }
  }

  const { data: clinic, error: fetchErr } = await supabaseAdmin
    .from('vet_clinics')
    .select('*')
    .eq('clinic_name', 'Lumo bites vet')
    .single();

  if (fetchErr || !clinic) {
    console.error('Vet clinic not found:', fetchErr);
    return;
  }

  const nextIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const updatePayload = {
    subscription_status: 'active',
    status: 'approved',
    cancel_at_period_end: false,
    stripe_customer_id: stripeCustId,
    stripe_subscription_id: stripeSubId,
    current_period_end: nextIso,
  };

  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('vet_clinics')
    .update(updatePayload)
    .eq('id', clinic.id)
    .select('*')
    .single();

  if (updateErr) {
    console.error('Backfill update failed:', updateErr.message);
  } else {
    console.log('✅ BACKFILL SUCCESSFUL:', {
      id: updated.id,
      clinic_name: updated.clinic_name,
      subscription_status: updated.subscription_status,
      status: updated.status,
      is_paused: updated.is_paused,
      stripe_customer_id: updated.stripe_customer_id,
      stripe_subscription_id: updated.stripe_subscription_id,
    });
  }
}

backfill();
