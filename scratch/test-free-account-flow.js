const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BASE_URL = 'http://localhost:3000';
const testEmail = 'test-free-account@lumobites.net';

async function runTest() {
  console.log('🏁 Starting Free Account Flow End-To-End Integration Test...');

  // 0. Clean up any existing test records first
  console.log('🧹 Cleaning up any old test data...');
  await supabase.from('verification_codes').delete().eq('email', testEmail);
  await supabase.from('emails').delete().eq('email', testEmail);

  // 1. Send OTP verification code
  console.log(`\n1. Requesting OTP code for ${testEmail}...`);
  const sendRes = await fetch(`${BASE_URL}/api/stripe/send-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail })
  });

  const sendData = await sendRes.json();
  if (!sendRes.ok) {
    throw new Error(`Failed to send OTP: ${JSON.stringify(sendData)}`);
  }
  console.log('✅ OTP code request successful!');

  // 2. Fetch the OTP code directly from the DB
  console.log('\n2. Fetching verification code from DB...');
  const { data: codes, error: codeErr } = await supabase
    .from('verification_codes')
    .select('code')
    .eq('email', testEmail)
    .single();

  if (codeErr || !codes) {
    throw new Error(`Failed to retrieve code from DB: ${codeErr?.message}`);
  }
  const code = codes.code;
  console.log(`✅ Retrieved code: ${code}`);

  // 3. Verify OTP code
  console.log('\n3. Verifying OTP code via API...');
  const verifyRes = await fetch(`${BASE_URL}/api/stripe/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, code })
  });

  const verifyData = await verifyRes.json();
  if (!verifyRes.ok) {
    throw new Error(`Failed to verify OTP: ${JSON.stringify(verifyData)}`);
  }
  console.log('✅ OTP verified successfully! Response:', JSON.stringify(verifyData));

  // 4. Query the emails table from DB and assert defaults
  console.log('\n4. Querying database directly to verify email record...');
  const { data: dbEmail, error: dbEmailErr } = await supabase
    .from('emails')
    .select('*')
    .eq('email', testEmail)
    .single();

  if (dbEmailErr || !dbEmail) {
    throw new Error(`Failed to query database for email: ${dbEmailErr?.message}`);
  }
  console.log(`✅ Direct DB check passed. is_pro is ${dbEmail.is_pro}, source is '${dbEmail.source}'`);
  if (dbEmail.is_pro !== true || dbEmail.source !== 'early_access_free') {
    throw new Error(`Assertion failed: is_pro should be true and source should be early_access_free. Got is_pro: ${dbEmail.is_pro}, source: ${dbEmail.source}`);
  }

  // 5. Fetch subscription details
  console.log('\n5. Fetching subscription details via API...');
  const subRes = await fetch(`${BASE_URL}/api/stripe/subscription-details`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail })
  });
  const subData = await subRes.json();
  if (!subRes.ok) {
    throw new Error(`Failed to fetch subscription details: ${JSON.stringify(subData)}`);
  }
  console.log('✅ Subscription details fetched successfully! Response:', JSON.stringify(subData));
  if (subData.earlyAccessFree !== true || subData.active !== true) {
    throw new Error(`Assertion failed: earlyAccessFree and active should be true. Got: ${JSON.stringify(subData)}`);
  }

  // 6. Clean up
  console.log('\n6. Deleting test email record...');
  const deleteErr = await supabase.from('emails').delete().eq('email', testEmail);
  if (deleteErr.error) {
    throw new Error(`Failed to delete email record: ${deleteErr.error.message}`);
  }
  console.log('✅ Test email record deleted successfully!');

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! Free account registration flow verified.');
}

runTest().catch(err => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});
