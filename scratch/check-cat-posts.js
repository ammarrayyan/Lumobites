const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  // Check all found pets
  console.log('--- ALL found pets (pet_type = found) ---');
  const { data: foundPets, error: e1 } = await supabase
    .from('lost_pets')
    .select('id, pet_name, description, pet_type, status, ai_features, created_at')
    .eq('pet_type', 'found')
    .order('created_at', { ascending: false })
    .limit(10);
  if (e1) console.error('Error:', e1);
  else console.log(JSON.stringify(foundPets, null, 2));

  // Check cat-related posts
  console.log('\n--- Posts mentioning "cat" (any pet_type) ---');
  const { data: catPets, error: e2 } = await supabase
    .from('lost_pets')
    .select('id, pet_name, description, pet_type, status, species, ai_features, created_at')
    .or('pet_name.ilike.%cat%,description.ilike.%cat%')
    .order('created_at', { ascending: false })
    .limit(10);
  if (e2) console.error('Error:', e2);
  else console.log(JSON.stringify(catPets, null, 2));
}
run();
