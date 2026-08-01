const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/"/g, '');

const supabase = createClient(url, anonKey);

async function checkVet() {
  const { data: vets } = await supabase.from('vet_clinics').select('*');
  console.log('--- VET CLINICS DB RECORDS ---');
  console.log(vets);
}

checkVet();
