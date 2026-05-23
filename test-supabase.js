const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpsert() {
  const { data, error } = await supabase
    .from('sitters')
    .upsert({
      email: 'test@example.com',
      name: 'Test Sitter',
      photo_url: 'data:image/jpeg;base64,12345',
      city: 'Test City',
      zip: '12345',
      bio: 'Test bio',
      pet_types: 'both',
      rate_per_night: 25,
      availability: true,
    }, { onConflict: 'email', ignoreDuplicates: false })
    .select()
    .single();
    
  if (error) {
    console.error('SUPABASE ERROR:', error);
  } else {
    console.log('SUCCESS:', data);
  }
}
testUpsert();
