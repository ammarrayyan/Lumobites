const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/"/g, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const validKey = serviceKey && serviceKey.startsWith('ey') ? serviceKey : anonKey;

const supabaseAdmin = createClient(url, validKey);

async function checkDaycares() {
  console.log('=== EMPIRICAL EVIDENCE: PET DAYCARES RECORDS ===');
  const { data: daycares, error } = await supabaseAdmin
    .from('pet_daycares')
    .select('id, business_name, email, status, is_paused, subscription_status, trial_end, stripe_subscription_id');

  console.log('Daycares in DB:', daycares);
  console.log('Error:', error?.message);
}

checkDaycares();
