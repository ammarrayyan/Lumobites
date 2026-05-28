const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('sitters').select('id, avg_rating, review_count').limit(1);
  if (error) {
    console.error('Error fetching sitters columns:', error.message);
  } else {
    console.log('sitters columns exist! Data:', data);
  }
}
test();
