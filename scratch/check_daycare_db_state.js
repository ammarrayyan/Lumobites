const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/"/g, '');

const supabase = createClient(url, anonKey);

async function checkState() {
  const { data: daycares } = await supabase.from('pet_daycares').select('*');
  console.log('--- CURRENT PET DAYCARE DB STATE ---');
  if (daycares && daycares.length) {
    daycares.forEach(d => {
      console.log({
        id: d.id,
        business_name: d.business_name,
        status: d.status,
        subscription_status: d.subscription_status,
        is_paused: d.is_paused,
        trial_start: d.trial_start,
        trial_end: d.trial_end,
      });
    });
  }
}

checkState();
