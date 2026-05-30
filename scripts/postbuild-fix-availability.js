const bypassKey = process.env.NEXT_PUBLIC_ADMIN_BYPASS_KEY || 'Lumo2026@';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ltruotyzraxrrrtyakmc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  console.log('🚀 Running postbuild tasks for Lumo Bites...');
  
  // 1. First attempt: call the production POST API endpoint
  const prodUrl = 'https://lumobites.net/api/admin/fix-availability';
  console.log(`📡 Sending POST request to production endpoint: ${prodUrl}`);
  try {
    const response = await fetch(prodUrl, {
      method: 'POST',
      headers: {
        'x-admin-key': bypassKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Production endpoint response:', data);
    } else {
      console.log(`⚠️ Production endpoint returned status ${response.status}`);
    }
  } catch (error) {
    console.log('⚠️ Could not connect to production endpoint (might be offline or DNS resolving):', error.message);
  }

  // 2. Second attempt: if service role key is available, run direct DB fix as well to guarantee success
  if (supabaseServiceKey) {
    console.log('📦 SUPABASE_SERVICE_ROLE_KEY detected. Running direct database fix for availability...');
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: allSitters, error: fetchError } = await supabase
        .from('sitters')
        .select('id, email, availability');
        
      if (fetchError) throw fetchError;
      
      const badSitters = (allSitters || []).filter(s => s.availability !== true);
      if (badSitters.length === 0) {
        console.log('✅ Direct DB check: All sitters already have correct availability values.');
      } else {
        console.log(`🔄 Found ${badSitters.length} sitters with non-boolean availability. Patching...`);
        for (const sitter of badSitters) {
          const { error: updateError } = await supabase
            .from('sitters')
            .update({ availability: true })
            .eq('id', sitter.id);
            
          if (updateError) {
            console.error(`❌ Failed to update sitter ${sitter.email}:`, updateError.message);
          } else {
            console.log(`✅ Patched sitter: ${sitter.email}`);
          }
        }
      }
    } catch (dbError) {
      console.error('❌ Direct DB update failed:', dbError.message);
    }
  } else {
    console.log('ℹ️ SUPABASE_SERVICE_ROLE_KEY is not defined in this build environment. Skipping direct DB patch.');
  }
}

run().catch(err => {
  console.error('❌ Unexpected error in postbuild script:', err);
});
