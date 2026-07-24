const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('adoption_pets')
    .select('*, shelters(org_name)')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching adoption_pets:', error);
  } else {
    console.log('Successfully fetched', data.length, 'adoption pets.');
    if (data.length > 0) {
      console.log('First pet:', data[0].name, 'Shelter:', data[0].shelters?.org_name);
    }
  }
}

run();
