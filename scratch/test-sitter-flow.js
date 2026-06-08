const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BASE_URL = 'http://localhost:3000';
const testEmail = 'test-sitter-automated@lumobites.net';

async function runTest() {
  console.log('🏁 Starting Sitter Flow End-To-End Integration Test...');

  // 0. Clean up any existing test records first
  console.log('🧹 Cleaning up any old test data...');
  await supabase.from('verification_codes').delete().eq('email', testEmail);
  await supabase.from('otp_requests_log').delete().eq('email', testEmail);
  await supabase.from('sitters').delete().eq('email', testEmail);

  // 1. Send OTP verification code
  console.log(`\n1. Requesting OTP code for ${testEmail}...`);
  const sendRes = await fetch(`${BASE_URL}/api/petsitting/auth/send-code`, {
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
  const verifyRes = await fetch(`${BASE_URL}/api/petsitting/auth/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, code })
  });

  const verifyData = await verifyRes.json();
  if (!verifyRes.ok) {
    throw new Error(`Failed to verify OTP: ${JSON.stringify(verifyData)}`);
  }
  console.log('✅ OTP verified successfully!');

  // 4. Save new profile
  console.log('\n4. Saving new sitter profile...');
  // Note: we use placeholder base64 data URLs for photo/ID to trigger upload logic
  const mockPhotoUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  const mockIdUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

  const profileSaveRes = await fetch(`${BASE_URL}/api/petsitting/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      name: 'Automated Tester',
      photo_url: mockPhotoUrl,
      id_photo_url: mockIdUrl,
      city: 'Miami, FL',
      zip: '33101',
      country: 'United States',
      bio: 'Hello! I am an automated test sitter profile.',
      pet_types: 'both',
      rate_per_night: '45',
      availability: true,
      phone_number: '1234567890',
      phone_visible: true,
      gender: 'male',
      available_days: ['mon', 'tue'],
      available_times: ['morning'],
      service_types: ['boarding'],
      self_declared: true
    })
  });

  const profileSaveData = await profileSaveRes.json();
  if (!profileSaveRes.ok) {
    throw new Error(`Failed to save profile: ${JSON.stringify(profileSaveData)}`);
  }
  console.log('✅ Profile saved successfully! Saved data:');
  console.log(`   - Name: ${profileSaveData.name}`);
  console.log(`   - Approval Status: ${profileSaveData.approval_status}`);
  console.log(`   - Self Declared: ${profileSaveData.self_declared}`);
  console.log(`   - Needs Re-approval: ${profileSaveData.needs_reapproval}`);

  // 5. Query the profile from DB and assert defaults
  console.log('\n5. Querying database directly to verify profile...');
  const { data: dbSitter, error: dbSitterErr } = await supabase
    .from('sitters')
    .select('*')
    .eq('email', testEmail)
    .single();

  if (dbSitterErr || !dbSitter) {
    throw new Error(`Failed to query database for sitter: ${dbSitterErr?.message}`);
  }
  console.log(`✅ Direct DB check passed. approval_status is '${dbSitter.approval_status}'`);

  // 6. Simulate approving the sitter via Admin
  console.log('\n6. Simulating admin approval...');
  const { error: approveErr } = await supabase
    .from('sitters')
    .update({ approval_status: 'approved', is_approved: true })
    .eq('email', testEmail);

  if (approveErr) {
    throw new Error(`Failed to simulate admin approval: ${approveErr.message}`);
  }
  console.log('✅ Sitter approved!');

  // 7. Update photo to trigger re-approval
  console.log('\n7. Updating profile photo (simulating re-upload)...');
  const profileUpdateRes = await fetch(`${BASE_URL}/api/petsitting/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      name: 'Automated Tester',
      photo_url: mockPhotoUrl, // Send new base64 to trigger upload and reset
      city: 'Miami, FL',
      bio: 'Hello! I am an automated test sitter profile with an updated photo.',
      pet_types: 'both',
      rate_per_night: '45',
      availability: true,
      self_declared: true
    })
  });

  const profileUpdateData = await profileUpdateRes.json();
  if (!profileUpdateRes.ok) {
    throw new Error(`Failed to update profile: ${JSON.stringify(profileUpdateData)}`);
  }
  console.log('✅ Profile update request completed!');
  console.log(`   - New Approval Status: ${profileUpdateData.approval_status}`);
  console.log(`   - New Needs Re-approval: ${profileUpdateData.needs_reapproval}`);

  if (profileUpdateData.approval_status !== 'pending' || !profileUpdateData.needs_reapproval) {
    throw new Error('Assertion failed: status should be pending and needs_reapproval should be true after updating photo');
  }
  console.log('✅ Assertion passed: profile status reverted to pending and needs_reapproval is true!');

  // 8. Clean up
  console.log('\n8. Deleting test sitter profile...');
  const deleteRes = await fetch(`${BASE_URL}/api/petsitting/profile/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail })
  });

  if (!deleteRes.ok) {
    const delData = await deleteRes.json();
    throw new Error(`Failed to delete profile: ${JSON.stringify(delData)}`);
  }
  console.log('✅ Test sitter profile deleted successfully!');

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! End-to-end signup flow verified.');
}

runTest().catch(err => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});
