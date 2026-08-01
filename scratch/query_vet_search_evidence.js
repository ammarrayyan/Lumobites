const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/"/g, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const validKey = serviceKey && serviceKey.startsWith('ey') ? serviceKey : anonKey;

const supabaseAdmin = createClient(url, validKey);

async function checkVetSearch() {
  console.log('=== EMPIRICAL EVIDENCE: VET CLINIC RECORD & SEARCH API TRACE ===');

  const { data: rawClinics, error: queryErr } = await supabaseAdmin
    .from('vet_clinics')
    .select('id, clinic_name, email, city, state, org_photo_url, description, services, website, lat, lng, status, subscription_status, trial_end')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  console.log('Query Error:', queryErr?.message || 'NONE (SUCCESS)');
  console.log('Query .eq("status", "approved") returned count:', rawClinics?.length);
  const foundInRaw = rawClinics?.find((c) => c.clinic_name === 'Lumo bites vet');
  console.log('Found "Lumo bites vet" in raw approved query?:', !!foundInRaw);

  const now = new Date();
  const filteredClinics = (rawClinics || []).filter((c) => {
    if (c.status === 'paused') return false;
    if (c.subscription_status === 'active') return true;
    if (c.subscription_status === 'canceled') return false;
    if (c.trial_end && new Date(c.trial_end) < now) return false;
    return true;
  });

  console.log('Filtered clinics count:', filteredClinics.length);
  console.log('Found "Lumo bites vet" in final search results?:', !!filteredClinics.find((c) => c.clinic_name === 'Lumo bites vet'));
}

checkVetSearch();
