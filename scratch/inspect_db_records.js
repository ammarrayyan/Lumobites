const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env.local manually
const envText = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envText.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const key = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Connecting to Supabase at:', url);
const supabase = createClient(url, key);

async function inspect() {
  const { data: daycares, error: dErr } = await supabase.from('pet_daycares').select('id, business_name, email, status, subscription_status, trial_start, trial_end, is_paused');
  console.log('Daycares query result:', { count: daycares?.length, error: dErr?.message, daycares });

  const { data: vets, error: vErr } = await supabase.from('vet_clinics').select('id, clinic_name, email, status, subscription_status, trial_start, trial_end, is_paused');
  console.log('Vets query result:', { count: vets?.length, error: vErr?.message, vets });

  const { data: shelters, error: sErr } = await supabase.from('shelters').select('id, name, email, status, subscription_status, trial_start, trial_end, is_paused');
  console.log('Shelters query result:', { count: shelters?.length, error: sErr?.message, shelters });
}

inspect();
