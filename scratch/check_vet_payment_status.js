const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/"/g, '');

const supabase = createClient(url, anonKey);

async function checkVetPayment() {
  console.log('--- CHECKING VET CLINICS IN DATABASE ---');
  const { data: clinics, error } = await supabase.from('vet_clinics').select('*');
  console.log('Clinics found:', clinics?.length, 'Error:', error);
  if (clinics && clinics.length) {
    clinics.forEach(c => {
      console.log({
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

checkVetPayment();
