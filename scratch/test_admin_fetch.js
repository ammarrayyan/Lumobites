const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseKey ? supabaseKey.length : 0);

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: d, error: dErr } = await supabase.from('pet_daycares').select('*');
  console.log('pet_daycares:', dErr || d);

  const { data: v, error: vErr } = await supabase.from('vet_clinics').select('*');
  console.log('vet_clinics:', vErr || v);

  const { data: s, error: sErr } = await supabase.from('shelters').select('*');
  console.log('shelters:', sErr || s);
}

check();
