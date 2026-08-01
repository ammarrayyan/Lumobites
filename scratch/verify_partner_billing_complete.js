const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runVerification() {
  console.log('=== PARTNER BILLING SYSTEM VERIFICATION ===\n');

  // 1. Verify Pricing Settings
  const { data: pricing, error: pErr } = await supabase.from('partner_pricing_settings').select('*');
  console.log('1. Partner Pricing Settings Table:');
  if (pErr) {
    console.error('Error:', pErr.message);
  } else {
    console.table(pricing);
  }

  // 2. Check Vet Clinics Columns & Status
  const { data: vets } = await supabase.from('vet_clinics').select('id, clinic_name, email, status, subscription_status, trial_start, trial_end, is_paused').limit(3);
  console.log('\n2. Vet Clinics Table (Sample):');
  console.table(vets);

  // 3. Check Pet Daycares Columns & Status
  const { data: daycares } = await supabase.from('pet_daycares').select('id, business_name, email, status, subscription_status, trial_start, trial_end, is_paused').limit(3);
  console.log('\n3. Pet Daycares Table (Sample):');
  console.table(daycares);

  // 4. Check Shelters Columns & Status
  const { data: shelters } = await supabase.from('shelters').select('id, name, email, status, subscription_status, trial_start, trial_end, is_paused').limit(3);
  console.log('\n4. Shelters Table (Sample):');
  console.table(shelters);

  console.log('\n✅ Verification script complete.');
}

runVerification();
