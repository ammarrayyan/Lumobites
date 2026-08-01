const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/"/g, '');

const supabase = createClient(url, anonKey);

async function checkVet() {
  const { data: vetByEmail, error: e1 } = await supabase.from('vet_clinics').select('*').eq('email', 'lumobites@net.com');
  console.log('by email lumobites@net.com:', vetByEmail, e1);

  const { data: allVets, error: e2 } = await supabase.from('vet_clinics').select('*');
  console.log('all vets:', allVets, e2);
}

checkVet();
