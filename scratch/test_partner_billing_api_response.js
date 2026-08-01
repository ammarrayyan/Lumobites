const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

// We can test the internal handler or mock request
const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/"/g, '');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const validKey = serviceRoleKey && serviceRoleKey.startsWith('ey') ? serviceRoleKey : anonKey;

const supabaseAdmin = createClient(url, validKey);

async function testFetch() {
  console.log('--- TESTING ADMIN PARTNER BILLING DATA FETCH ---');
  
  const { data: vetClinics, error: vetErr } = await supabaseAdmin
    .from('vet_clinics')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: petDaycares, error: dayErr } = await supabaseAdmin
    .from('pet_daycares')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: shelters, error: shelterErr } = await supabaseAdmin
    .from('shelters')
    .select('*')
    .order('created_at', { ascending: false });

  console.log('Vet Clinics fetched:', vetClinics?.length, 'Err:', vetErr);
  console.log('Pet Daycares fetched:', petDaycares?.length, 'Err:', dayErr);
  console.log('Shelters fetched:', shelters?.length, 'Err:', shelterErr);

  if (petDaycares && petDaycares.length) {
    console.log('\n✅ SUCCESS: Found daycare:', {
      business_name: petDaycares[0].business_name,
      email: petDaycares[0].email,
      subscription_status: petDaycares[0].subscription_status,
      trial_end: petDaycares[0].trial_end
    });
  }
}

testFetch();
