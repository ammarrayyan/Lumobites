// scratch/add-ai-features-column.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is not defined in .env.local. The migration might fail if anonymous RPC is blocked.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Running SQL migration to add ai_features column to lost_pets...');
supabase.rpc('exec_sql', { 
  sql: 'ALTER TABLE lost_pets ADD COLUMN IF NOT EXISTS ai_features jsonb;' 
})
.then(response => {
  console.log('Migration Response:', response);
})
.catch(err => {
  console.error('Migration threw an error:', err);
});
