const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("URL:", supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase
    .from('notifications')
    .select('type, message');
    
  if (error) {
    console.error("Error querying notifications:", error);
    return;
  }
  
  // Get distinct type and sample message
  const distinct = {};
  data.forEach(row => {
    if (!distinct[row.type]) {
      distinct[row.type] = [];
    }
    // Collect a couple of sample messages
    if (distinct[row.type].indexOf(row.message) === -1 && distinct[row.type].length < 3) {
      distinct[row.type].push(row.message);
    }
  });
  
  console.log("DISTINCT_TYPES_START");
  console.log(JSON.stringify(distinct, null, 2));
  console.log("DISTINCT_TYPES_END");
}

run();
