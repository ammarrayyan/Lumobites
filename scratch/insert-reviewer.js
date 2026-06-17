const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase URL or Anon Key. Check .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Inserting reviewer@lumobites.net into emails table...');
  
  const { data, error } = await supabase
    .from('emails')
    .upsert({
      email: 'reviewer@lumobites.net',
      is_pro: true,
      source: 'apple_reviewer',
      created_at: new Date().toISOString()
    }, { onConflict: 'email' })
    .select();

  if (error) {
    console.error('❌ Failed to insert reviewer:', error.message);
    process.exit(1);
  }

  console.log('✅ Success! Reviewer email inserted/updated:', data);
}

run();
