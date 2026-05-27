async function test() {
  try {
    const email = 'ammar.rayyan12@gmail.com';
    const url = `https://lumobites.net/api/petsitting/profile?email=${encodeURIComponent(email)}`;
    console.log('Fetching:', url);
    const res = await fetch(url);
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response body:', text);
  } catch (e) {
    console.error('Error fetching:', e);
  }
}
test();
