async function run() {
  console.log('Fetching live pets from production...');
  try {
    const res = await fetch('https://lumobites.net/api/lost-pets');
    const data = await res.json();
    console.log('Production response success:', !!data.pets);
    if (data.pets) {
      console.log(`Found ${data.pets.length} pets in production.`);
      if (data.pets.length > 0) {
        console.log('Production pet keys:', Object.keys(data.pets[0]));
        console.log('First 3 pets:', data.pets.slice(0, 3).map(p => ({
          id: p.id,
          pet_name: p.pet_name,
          type: p.type,
          species: p.species,
          city: p.city,
          created_at: p.created_at,
          ai_features: p.ai_features
        })));
      }
    } else {
      console.log('No pets list returned. Response:', data);
    }
  } catch (err) {
    console.error('Error fetching from prod:', err);
  }
}
run();
