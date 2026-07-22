const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTables() {
  console.log('Testing query on shelters table...');
  const res1 = await supabase.from('shelters').select('*').limit(1);
  console.log('shelters error:', res1.error);
  console.log('shelters data:', res1.data);

  console.log('Testing query on adoption_pets table...');
  const res2 = await supabase.from('adoption_pets').select('*').limit(1);
  console.log('adoption_pets error:', res2.error);
  console.log('adoption_pets data:', res2.data);

  console.log('Testing query on adoption_messages table...');
  const res3 = await supabase.from('adoption_messages').select('*').limit(1);
  console.log('adoption_messages error:', res3.error);
  console.log('adoption_messages data:', res3.data);
}

testTables();
