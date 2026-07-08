const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing column existence by querying ai_features...');
  const { data, error } = await supabase
    .from('lost_pets')
    .select('id, ai_features')
    .limit(1);

  if (error) {
    console.error('Error fetching columns:', error);
  } else {
    console.log('Successfully queried ai_features. Response:', data);
  }
}

test();
