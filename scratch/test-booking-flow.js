const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const sitterId = 'ff71c6eb-0a72-4d85-ae8c-357a45b96c65'; // Known sitter ID from DB
const ownerEmail = 'testowner@example.com';

async function testDbDirect() {
  console.log('Running direct DB simulation...');
  const { data: req, error: insErr } = await supabase
    .from('sitting_requests')
    .insert({
      sitter_id: sitterId,
      owner_email: ownerEmail,
      owner_name: 'Test Owner',
      pet_name: 'Buddy',
      pet_type: 'dog',
      dates: 'Jun 10, 2026 -> Jun 15, 2026',
      special_notes: 'Likes treats',
      phone_number: '+15551234567',
      status: 'pending',
      booking_number: 'Booking #99999'
    })
    .select('*')
    .single();

  if (insErr) {
    console.error('Insert error:', insErr);
    return;
  }
  console.log('Created test request:', req.booking_number, 'ID:', req.id, 'UUID Token:', req.secure_token);

  // Mock complete process
  const { data: sitterBefore } = await supabase.from('sitters').select('completed_bookings').eq('id', sitterId).single();
  const countBefore = sitterBefore?.completed_bookings || 0;
  console.log('Completed count before:', countBefore);

  await supabase.from('sitting_requests').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', req.id);
  await supabase.from('sitters').update({ completed_bookings: countBefore + 1 }).eq('id', sitterId);

  const { data: sitterAfter } = await supabase.from('sitters').select('completed_bookings').eq('id', sitterId).single();
  console.log('Completed count after:', sitterAfter?.completed_bookings);

  // Clean up
  await supabase.from('sitting_requests').delete().eq('id', req.id);
  // Restore completed count
  await supabase.from('sitters').update({ completed_bookings: countBefore }).eq('id', sitterId);
  console.log('Direct DB simulation completed successfully!');
}

testDbDirect();
