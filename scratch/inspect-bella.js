const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectBella() {
  console.log('Querying pet Bella...');
  const { data, error } = await supabase
    .from('lost_pets')
    .select('*')
    .eq('id', '5e7a1831-a2e9-49ec-8b01-d81191cced1e')
    .single();

  if (error) {
    console.error('Error fetching Bella:', error);
  } else {
    console.log('Bella record values:');
    console.log(JSON.stringify(data, null, 2));
  }
}

inspectBella();
