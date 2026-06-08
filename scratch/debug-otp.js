const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable() {
  console.log('Fetching database schema info for verification_codes...');
  
  // Try inserting a test code and reading it back to see how the timestamp is saved
  const testEmail = 'debug-otp-timezone@lumobites.net';
  const testCode = '999999';
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  
  console.log(`Inserting code: ${testCode} with expires_at: ${expiresAt}`);
  
  // Clean up first
  await supabase.from('verification_codes').delete().eq('email', testEmail);
  
  const { data: insertData, error: insertError } = await supabase
    .from('verification_codes')
    .insert({
      email: testEmail,
      code: testCode,
      expires_at: expiresAt
    })
    .select('*');
    
  if (insertError) {
    console.error('Insert error:', insertError);
    return;
  }
  
  console.log('Inserted data returned:', insertData);
  
  // Let's do a select query to see what the database returned
  const { data: selectData, error: selectError } = await supabase
    .from('verification_codes')
    .select('*')
    .eq('email', testEmail)
    .single();
    
  if (selectError) {
    console.error('Select error:', selectError);
    return;
  }
  
  console.log('Selected data from DB:', selectData);
  console.log('DB expires_at type / string:', typeof selectData.expires_at, selectData.expires_at);
  console.log('JS parsing date:', new Date(selectData.expires_at).toISOString());
  console.log('Current system time (JS):', new Date().toISOString());
  console.log('Is expired?', new Date(selectData.expires_at) < new Date());
  
  // Clean up
  await supabase.from('verification_codes').delete().eq('email', testEmail);
}

checkTable();
