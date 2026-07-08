const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use service role key if available to inspect all fields
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Querying lost_pets...');
  const { data, error } = await supabase
    .from('lost_pets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching lost_pets:', error);
    return;
  }

  console.log(`Fetched ${data.length} recent rows.`);
  if (data.length > 0) {
    console.log('Columns in first row:', Object.keys(data[0]));
    data.forEach((row, i) => {
      console.log(`\n--- Row ${i + 1} ---`);
      console.log('ID:', row.id);
      console.log('Pet Name:', row.pet_name);
      console.log('Pet Type:', row.pet_type);
      console.log('Species:', row.species);
      console.log('Status:', row.status);
      console.log('Description Excerpt:', row.description ? row.description.substring(0, 100) : null);
      console.log('AI Features:', row.ai_features);
    });
  } else {
    console.log('No rows returned.');
  }
}

check();
