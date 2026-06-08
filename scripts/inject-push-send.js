const fs = require('fs');

function addPush(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');
  if (code.includes('sendPushNotification')) return;

  // Add import
  code = code.replace(/import \{ supabase(Admin)? \} from '@\/lib\/supabase';/, `import { supabase$1 } from '@/lib/supabase';\nimport { sendPushNotification } from '@/lib/push';`);

  // Replace insert
  // This is a bit tricky with regex for multi-line.
  // I will just look for `await supabaseAdmin.from('notifications').insert({` or `await supabase.from('notifications').insert({`
  
  const regex = /await supabase(Admin)?\.from\('notifications'\)\.insert\(\{\s*recipient_email:\s*([^,]+),\s*type:\s*'([^']+)',\s*title:\s*([^,]+),\s*message:\s*([^,]+),\s*link:\s*([^}\n]+)\s*\}\);/g;
  
  code = code.replace(regex, (match, adminToken, email, type, title, message, link) => {
    return match + `\n        await sendPushNotification(${email}, ${title}, ${message}, ${link});`;
  });

  fs.writeFileSync(filePath, code);
  console.log('Updated ' + filePath);
}

['request', 'request/accept', 'request/decline', 'request/complete', 'request/cancel', 'messages'].forEach(dir => {
  addPush(`app/api/petsitting/${dir}/route.ts`);
});
