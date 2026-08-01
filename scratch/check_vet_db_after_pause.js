const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/"/g, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const validKey = serviceKey && serviceKey.startsWith('ey') ? serviceKey : anonKey;

const supabaseAdmin = createClient(url, validKey);

async function checkVet() {
  console.log('--- CHECKING VET CLINIC DB RECORD AFTER PAUSE ---');
  const { data: clinic, error } = await supabaseAdmin
    .from('vet_clinics')
    .select('*')
    .eq('clinic_name', 'Lumo bites vet')
    .single();

  console.log('Vet DB Record:', {
    id: clinic?.id,
    clinic_name: clinic?.clinic_name,
    status: clinic?.status,
    is_paused: clinic?.is_paused,
    subscription_status: clinic?.subscription_status,
    stripe_subscription_id: clinic?.stripe_subscription_id,
    stripe_customer_id: clinic?.stripe_customer_id,
    current_period_end: clinic?.current_period_end,
    trial_end: clinic?.trial_end,
  });
}

checkVet();
