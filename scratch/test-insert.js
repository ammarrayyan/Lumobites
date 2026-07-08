const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Testing insert into notifications with booking_id and sitter_id...");
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      recipient_email: 'test@lumobites.net',
      type: 'test_insert',
      title: 'Test',
      message: 'Test message',
      link: '/test',
      booking_id: 'd9b736b0-466f-431f-9988-bbccdd112233',
      sitter_id: 'e8c847c1-577f-542f-0099-ccaadd223344'
    })
    .select();

  if (error) {
    console.log("Insert failed. Error detail:", error);
  } else {
    console.log("Insert succeeded! Data:", data);
    // Delete the test notification
    const { error: delError } = await supabase
      .from('notifications')
      .delete()
      .eq('type', 'test_insert');
    console.log("Cleaned up test notification. Error if any:", delError);
  }
}

run();
