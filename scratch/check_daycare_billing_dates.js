const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/"/g, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const validKey = serviceKey && serviceKey.startsWith('ey') ? serviceKey : anonKey;

const supabaseAdmin = createClient(url, validKey);

async function checkDaycareDates() {
  console.log('=== CHECKING PET DAYCARE BILLING DATES IN DB ===');
  const { data: daycare, error } = await supabaseAdmin
    .from('pet_daycares')
    .select('id, business_name, email, status, subscription_status, current_period_end, trial_end, stripe_subscription_id, stripe_customer_id')
    .eq('email', 'ammar-rayyan@hotmail.com')
    .single();

  console.log('Daycare Record in DB:', daycare);
}

checkDaycareDates();
