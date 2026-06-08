import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function test() {
  const { data, error } = await supabase.from('affiliates').insert({
    full_name: 'Jane Doe',
    email: 'jane@example.com',
    paypal_email: 'paypal@example.com',
    status: 'pending',
    referral_code: 'pending-' + Math.floor(100000 + Math.random() * 900000).toString(),
  }).select();
  if (error) {
    console.error('Error inserting affiliate:', error);
  } else {
    console.log('Successfully inserted affiliate:', data);
  }
}

test();
