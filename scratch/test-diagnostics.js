const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function runDiagnostics() {
  console.log("--- 1. API Status Check ---");
  try {
    const res = await fetch('https://lumobites.net/api/stripe/status?email=ammar.rayyan12@gmail.com');
    const data = await res.json();
    console.log(data);
  } catch(e) {
    console.log("API Fetch failed:", e);
  }

  console.log("\n--- 2. Emails Table Check ---");
  const { data: emailData, error: emailError } = await supabase
    .from('emails')
    .select('email, is_pro, phone_verified, verified_phone, source')
    .eq('email', 'ammar.rayyan12@gmail.com');
  console.log(emailError || emailData);

  console.log("\n--- 3. Sitters Table Check ---");
  const { data: sitterData, error: sitterError } = await supabase
    .from('sitters')
    .select('email, is_approved, account_status')
    .eq('email', 'ammar.rayyan12@gmail.com');
  console.log(sitterError || sitterData);
}

runDiagnostics();
