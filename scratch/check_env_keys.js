const fs = require('fs');
const envText = fs.readFileSync('.env.local', 'utf8');
envText.split('\n').forEach(line => {
  if (line.includes('SUPABASE')) {
    const parts = line.split('=');
    console.log(parts[0], '=> length:', parts[1] ? parts[1].trim().length : 0, 'val preview:', parts[1] ? parts[1].trim().slice(0, 15) : '');
  }
});
