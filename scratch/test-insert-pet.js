const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Inserting a temporary test pet...');
  const { data, error } = await supabase
    .from('lost_pets')
    .insert({
      pet_type: 'found',
      pet_name: 'Testy',
      species: 'dog',
      photo_url: 'https://example.com/photo.jpg',
      description: 'Test post to check columns',
      city: 'Testville',
      zip_code: '12345',
      contact_email: 'test@example.com',
      date_lost_found: new Date().toISOString(),
      status: 'active',
      edit_token: '00000000-0000-0000-0000-000000000000'
    })
    .select()
    .single();

  if (error) {
    console.error('Insert error:', error);
  } else {
    console.log('Successfully inserted row! Columns returned:');
    console.log(Object.keys(data));
    console.log('Row values:', data);

    // Clean up
    console.log('Cleaning up test row...');
    const { error: delError } = await supabase
      .from('lost_pets')
      .delete()
      .eq('id', data.id);
    if (delError) console.error('Delete error:', delError);
    else console.log('Cleanup complete!');
  }
}

test();
