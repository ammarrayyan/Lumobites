import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ltruotyzraxrrrtyakmc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cnVvdHl6cmF4cnJydHlha21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MTc4NTUsImV4cCI6MjA5MzQ5Mzg1NX0.PN-PRHiCbEzv_KvZMkPCU9CduN6JaZ-1z-Q2Kc9HX7Y';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: referrers, error } = await supabase.from('referrers').select('*');
  if (error) {
    console.error('Error fetching referrers:', error);
    return;
  }

  for (const referrer of referrers || []) {
    const baseSlug = referrer.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    let code = baseSlug;
    let counter = 2;
    let isUnique = false;

    // Check if the current code is already clean (e.g. they created it after our fix)
    if (referrer.code === code || referrer.code.match(new RegExp(`^${code}\\d*$`))) {
      // It might already be clean! Let's just make sure it's not the old random format
      // Actually, if it ends with exactly 4 random characters preceded by a dash, it's the old format
      if (!referrer.code.match(/-[a-z0-9]{4}$/)) {
        console.log(`Skipping ${referrer.name}, code ${referrer.code} looks clean.`);
        continue;
      }
    }

    while (!isUnique) {
      const { data: existing } = await supabase
        .from('referrers')
        .select('id')
        .eq('code', code)
        .neq('id', referrer.id) // ignore self
        .maybeSingle();

      if (!existing) {
        isUnique = true;
      } else {
        code = `${baseSlug}${counter}`;
        counter++;
      }
    }

    console.log(`Updating ${referrer.name}: ${referrer.code} -> ${code}`);

    // Update referrers
    const { error: updateError } = await supabase
      .from('referrers')
      .update({ code })
      .eq('id', referrer.id);

    if (updateError) {
      console.error(`Failed to update ${referrer.name}:`, updateError);
      continue;
    }

    // Update referred_users to match
    const { error: updateUsersError } = await supabase
      .from('referred_users')
      .update({ referral_code: code })
      .eq('referrer_id', referrer.id);

    if (updateUsersError) {
      console.error(`Failed to update referred users for ${referrer.name}:`, updateUsersError);
    }
  }
  console.log('Done!');
}

run();
