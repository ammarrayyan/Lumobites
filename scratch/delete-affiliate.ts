import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function test() {
  const { data, error } = await supabase.from('affiliates').delete().eq('email', 'jane@example.com');
  if (error) {
    console.error('Error deleting test affiliate:', error);
  } else {
    console.log('Successfully cleaned up test affiliate');
  }
}

test();
