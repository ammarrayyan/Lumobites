const fs = require('fs');

async function test() {
  const CLIENT_ID = process.env.AMAZON_CLIENT_ID;
  const CLIENT_SECRET = process.env.AMAZON_CLIENT_SECRET;
  const PARTNER_TAG = process.env.AMAZON_ASSOCIATE_TAG;
  
  if (!CLIENT_ID) {
    console.log("No credentials found in env. Load them from .env.local");
    const env = fs.readFileSync('.env.local', 'utf-8');
    const getVal = (key) => {
      const match = env.match(new RegExp(`${key}=(.*)`));
      return match ? match[1].trim() : '';
    };
    process.env.AMAZON_CLIENT_ID = getVal('AMAZON_CLIENT_ID');
    process.env.AMAZON_CLIENT_SECRET = getVal('AMAZON_CLIENT_SECRET');
    process.env.AMAZON_ASSOCIATE_TAG = getVal('AMAZON_ASSOCIATE_TAG');
    
    // Oh wait, the user said they added them to Vercel. They might not be in .env.local.
    // Let's just use the fact that the next app /api/amazon/debug already has them!
  }
}
test();
