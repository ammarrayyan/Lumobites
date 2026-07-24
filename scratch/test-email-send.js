const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.RESEND_API_KEY;
console.log('RESEND_API_KEY present:', !!apiKey);

if (!apiKey) {
  console.log('No RESEND_API_KEY found in .env.local — Resend email calls are skipped locally.');
  process.exit(0);
}

const resend = new Resend(apiKey);
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';

async function testSend() {
  try {
    console.log(`Sending test email from ${fromEmail}...`);
    const res = await resend.emails.send({
      from: fromEmail,
      to: ['test@lumobites.net'],
      subject: 'Test Application Received Email',
      html: '<h1>Test Email</h1><p>Testing Resend integration.</p>'
    });
    console.log('Resend send response:', res);
  } catch (err) {
    console.error('Resend send error:', err);
  }
}

testSend();
