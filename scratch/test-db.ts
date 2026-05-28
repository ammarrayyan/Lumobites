import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ltruotyzraxrrrtyakmc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cnVvdHl6cmF4cnJydHlha21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MTc4NTUsImV4cCI6MjA5MzQ5Mzg1NX0.PN-PRHiCbEzv_KvZMkPCU9CduN6JaZ-1z-Q2Kc9HX7Y'
);

async function test() {
  const { data, error } = await supabase.from('referrals').select('*').limit(1);
  if (error) {
    console.error('Error querying referrals table:', error);
  } else {
    console.log('Successfully queried referrals table. Data:', data);
  }
}

test();
