const fs = require('fs');

async function testApi() {
  try {
    const res = await fetch('http://localhost:3000/api/petsitting/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'Test',
        photo_url: 'data:image/jpeg;base64,' + 'a'.repeat(3000000), // 3MB payload
        city: 'City',
        zip: '12345',
        bio: 'Bio',
        pet_types: 'both',
        rate_per_night: 25,
        availability: true,
      })
    });
    const data = await res.json();
    console.log('API RESPONSE:', res.status, data);
  } catch (err) {
    console.error('API ERROR:', err);
  }
}
testApi();
