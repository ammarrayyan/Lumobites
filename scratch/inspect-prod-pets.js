async function run() {
  console.log('Fetching live pets from production API to inspect values...');
  try {
    const res = await fetch('https://lumobites.net/api/lost-pets');
    const data = await res.json();
    if (data.pets && data.pets.length > 0) {
      console.log(`Fetched ${data.pets.length} posts from production.`);
      data.pets.slice(0, 5).forEach((pet, i) => {
        console.log(`\n--- Pet ${i + 1} ---`);
        console.log('ID:', pet.id);
        console.log('Name:', pet.pet_name);
        console.log('Type (mapped):', pet.type);
        console.log('Species:', pet.species);
        console.log('Status:', pet.status);
        console.log('Description:', pet.description);
        console.log('AI Features:', pet.ai_features);
      });
    } else {
      console.log('No posts returned from production API.');
    }
  } catch (err) {
    console.error('Error fetching:', err);
  }
}
run();
