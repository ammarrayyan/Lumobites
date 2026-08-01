const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/"/g, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const validKey = serviceKey && serviceKey.startsWith('ey') ? serviceKey : anonKey;

const supabaseAdmin = createClient(url, validKey);

async function checkEvidence() {
  console.log('=== EMPIRICAL EVIDENCE: VET CLINIC RECORD ===');
  const { data: clinic, error } = await supabaseAdmin
    .from('vet_clinics')
    .select('id, clinic_name, status, subscription_status, stripe_subscription_id, cancel_at_period_end, trial_end, current_period_end')
    .eq('clinic_name', 'Lumo bites vet')
    .single();

  console.log('Supabase Live DB Record for "Lumo bites vet":', clinic);
  console.log('Fetch Error:', error?.message);
}

checkEvidence();
