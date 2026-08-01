const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/"/g, '');

console.log('Testing with clean anon key...');
const supabase = createClient(url, anonKey);

async function test() {
  const { data: d, error: dErr } = await supabase.from('pet_daycares').select('*');
  console.log('pet_daycares count:', d?.length, 'error:', dErr?.message);
  if (d && d.length) console.log('Sample daycare:', d[0].business_name, d[0].subscription_status, d[0].trial_end);

  const { data: v, error: vErr } = await supabase.from('vet_clinics').select('*');
  console.log('vet_clinics count:', v?.length, 'error:', vErr?.message);
  if (v && v.length) console.log('Sample clinic:', v[0].clinic_name, v[0].subscription_status, v[0].trial_end);

  const { data: s, error: sErr } = await supabase.from('shelters').select('*');
  console.log('shelters count:', s?.length, 'error:', sErr?.message);
  if (s && s.length) console.log('Sample shelter:', s[0].name, s[0].subscription_status, s[0].trial_end);
}

test();
