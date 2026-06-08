import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function test() {
  const { data, error } = await supabase.from('affiliates').select('*').limit(1);
  if (error) {
    console.error('Error querying affiliates table:', error);
  } else {
    console.log('Successfully queried affiliates table. Data:', data);
  }
}

test();
