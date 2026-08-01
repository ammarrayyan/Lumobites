const { sendPartnerWelcomePaidEmail } = require('../lib/partner-billing-email');
require('dotenv').config({ path: '.env.local' });

async function testEmail() {
  console.log('--- TESTING WELCOME PAID EMAIL FOR "Lumo daycare " ---');
  await sendPartnerWelcomePaidEmail('ammar-rayyan@hotmail.com', 'Lumo daycare', 'pet_daycare', 30);
  console.log('✅ Test welcome email dispatched to ammar-rayyan@hotmail.com!');
}

testEmail();
