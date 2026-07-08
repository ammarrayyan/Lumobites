const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkStatus() {
  const { data, error } = await supabase
    .from('emails')
    .select('phone_verified')
    .eq('email', 'ammar.rayyan12@gmail.com')
    .single();
    
  console.log("Supabase direct result:", data, error);
}

checkStatus();
