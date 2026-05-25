const fs = require('fs');

async function main() {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  let resendKey = '';
  envFile.split('\n').forEach(line => {
    if (line.startsWith('RESEND_API_KEY=')) {
      resendKey = line.split('=')[1].trim();
    }
  });

  if (!resendKey) {
    console.log('No RESEND_API_KEY found');
    return;
  }

  try {
    console.log('--- FETCHING DOMAINS ---');
    const domRes = await fetch('https://api.resend.com/domains', {
      headers: { 'Authorization': `Bearer ${resendKey}` }
    });
    const domData = await domRes.json();
    console.log(JSON.stringify(domData, null, 2));

    if (domData.data && domData.data.length > 0) {
      const domainId = domData.data.find(d => d.name === 'lumobites.net')?.id || domData.data[0].id;
      console.log(`\n--- FETCHING DETAILS FOR DOMAIN ${domainId} ---`);
      const detRes = await fetch(`https://api.resend.com/domains/${domainId}`, {
        headers: { 'Authorization': `Bearer ${resendKey}` }
      });
      const detData = await detRes.json();
      console.log(JSON.stringify(detData, null, 2));
    }

    console.log('\n--- FETCHING RECENT EMAILS ---');
    const emailsRes = await fetch('https://api.resend.com/emails', {
      headers: { 'Authorization': `Bearer ${resendKey}` }
    });
    const emailsData = await emailsRes.json();
    if (emailsData.data) {
      const hotmailEmails = emailsData.data.filter(e => e.to.some(t => t.includes('hotmail') || t.includes('outlook')));
      console.log(`Found ${hotmailEmails.length} recent hotmail/outlook emails.`);
      hotmailEmails.slice(0, 3).forEach(e => {
        console.log(`- To: ${e.to.join(', ')} | Subject: ${e.subject} | Status: ${e.status}`);
      });
    }

  } catch (err) {
    console.error(err);
  }
}

main();
