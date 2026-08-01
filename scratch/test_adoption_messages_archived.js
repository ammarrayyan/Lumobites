const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/"/g, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const validKey = serviceKey && serviceKey.startsWith('ey') ? serviceKey : anonKey;

const supabaseAdmin = createClient(url, validKey);

async function checkAdoptionMessages() {
  console.log('--- INSPECTING ADOPTION MESSAGES IN DB ---');
  const { data: msgs, error } = await supabaseAdmin.from('adoption_messages').select('*');
  console.log('Messages count:', msgs?.length, 'Error:', error?.message);
  if (msgs && msgs.length) {
    msgs.forEach(m => {
      console.log('ADOPTION MSG RECORD:', {
        id: m.id,
        pet_id: m.pet_id,
        sender_email: m.sender_email,
        receiver_email: m.receiver_email,
        archived: m.archived,
        created_at: m.created_at,
      });
    });
  }
}

checkAdoptionMessages();
