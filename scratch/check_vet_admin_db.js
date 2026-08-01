const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/"/g, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const validKey = serviceKey && serviceKey.startsWith('ey') ? serviceKey : anonKey;

const supabaseAdmin = createClient(url, validKey);

async function checkAdminVet() {
  console.log('--- CHECKING VET CLINICS WITH ADMIN CLIENT ---');
  const { data: clinics, error } = await supabaseAdmin.from('vet_clinics').select('*');
  console.log('Clinics found count:', clinics?.length, 'Error:', error?.message);
  if (clinics && clinics.length) {
    clinics.forEach(c => {
      console.log('CLINIC RECORD:', {
        id: c.id,
        clinic_name: c.clinic_name,
        email: c.email,
        status: c.status,
        is_paused: c.is_paused,
        subscription_status: c.subscription_status,
        stripe_customer_id: c.stripe_customer_id,
        stripe_subscription_id: c.stripe_subscription_id,
      });
    });
  }
}

checkAdminVet();
