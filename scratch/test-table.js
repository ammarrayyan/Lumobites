const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.from('sms_subscribers').select('*').limit(1);
  if (error) {
    console.log('Error checking table:', error.message);
  } else {
    console.log('sms_subscribers table exists! Data:', data);
  }
}
test();
