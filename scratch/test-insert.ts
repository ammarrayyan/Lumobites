import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ltruotyzraxrrrtyakmc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cnVvdHl6cmF4cnJydHlha21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MTc4NTUsImV4cCI6MjA5MzQ5Mzg1NX0.PN-PRHiCbEzv_KvZMkPCU9CduN6JaZ-1z-Q2Kc9HX7Y';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('referrers')
    .insert({ name: 'test', code: 'test-123' })
    .select();
    
  console.log('Error:', error);
  console.log('Data:', data);
}

test();
