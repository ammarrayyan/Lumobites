const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  console.log('Querying sitters...');
  const { data: sitters, error: sittersErr } = await supabase
    .from('sitters')
    .select('*')
    .limit(1);
  if (sittersErr) {
    console.error('sitters error:', sittersErr);
  } else {
    console.log('sitters row keys:', Object.keys(sitters[0] || {}));
  }

  console.log('Querying sitting_requests...');
  const { data: requests, error: requestsErr } = await supabase
    .from('sitting_requests')
    .select('*')
    .limit(1);
  if (requestsErr) {
    console.error('sitting_requests error:', requestsErr);
  } else {
    console.log('sitting_requests row keys:', Object.keys(requests[0] || {}));
  }
}
check();
