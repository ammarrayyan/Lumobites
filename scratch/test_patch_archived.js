const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/"/g, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const validKey = serviceKey && serviceKey.startsWith('ey') ? serviceKey : anonKey;

const supabaseAdmin = createClient(url, validKey);

async function testArchivedPatch() {
  console.log('--- TESTING ADOPTION MESSAGES ARCHIVE PATCH ---');
  const pet_id = 'dc2cbcab-c329-485d-bb67-6f65002db1be';
  const cleanAdopter = 'ammar.rayyan12@gmail.com';

  const { data: updated, error } = await supabaseAdmin
    .from('adoption_messages')
    .update({ archived: true })
    .eq('pet_id', pet_id)
    .or(`sender_email.eq.${cleanAdopter},receiver_email.eq.${cleanAdopter}`)
    .select('*');

  console.log('Updated rows:', updated?.length, 'Error:', error?.message);

  const { data: verify } = await supabaseAdmin
    .from('adoption_messages')
    .select('id, pet_id, archived')
    .eq('pet_id', pet_id);

  console.log('Verification check (archived status):', verify);
}

testArchivedPatch();
