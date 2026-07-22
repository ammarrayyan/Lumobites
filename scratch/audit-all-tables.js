const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES_TO_CHECK = [
  'sitters',
  'sitting_requests',
  'messages',
  'lost_pets',
  'lost_pet_comments',
  'city_board_posts',
  'city_board_replies',
  'pet_twin_matches',
  'affiliates',
  'reports',
  'blocked_users',
  'sms_subscribers',
  'shelters',
  'adoption_pets',
  'adoption_messages'
];

async function checkAllTables() {
  console.log('=== LUMO BITES DATABASE TABLE AUDIT ===');
  const results = {};

  for (const table of TABLES_TO_CHECK) {
    const { data, error } = await supabase.from(table).select('count').limit(1);
    if (error) {
      if (error.code === 'PGRST205') {
        results[table] = 'MISSING (PGRST205 - Table not in schema cache)';
      } else {
        results[table] = `EXISTING (Query Note: ${error.message})`;
      }
    } else {
      results[table] = 'EXISTING & ACTIVE';
    }
  }

  console.log(JSON.stringify(results, null, 2));
}

checkAllTables();
