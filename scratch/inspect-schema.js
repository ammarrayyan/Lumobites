require('dotenv').config({ path: '.env.local' });

async function run() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log('Response content length:', text.length);
    console.log('Response excerpt:', text.substring(0, 500));
    const data = JSON.parse(text);
    console.log('Keys of schema:', Object.keys(data));
    if (data.definitions) {
      console.log('Definitions:', Object.keys(data.definitions));
    }
  } catch (err) {
    console.error('Error fetching PostgREST schema:', err);
  }
}
run();
