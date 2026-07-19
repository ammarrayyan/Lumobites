// scratch/create-sms-subscribers-table.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is not defined. The migration might fail if anonymous RPC is blocked.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
CREATE TABLE IF NOT EXISTS sms_subscribers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text UNIQUE NOT NULL,
  opted_in boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
`;

console.log('Running SQL migration to create sms_subscribers table...');
supabase.rpc('exec_sql', { sql })
.then(response => {
  console.log('Migration Response:', response);
  if (response.error) {
    console.error('Error during migration:', response.error);
  } else {
    console.log('Migration succeeded!');
  }
})
.catch(err => {
  console.error('Migration threw an error:', err);
});
