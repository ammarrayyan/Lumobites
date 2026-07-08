async function test() {
  console.log("Fetching FDA animal and veterinary enforcement endpoint...");
  try {
    const res = await fetch('https://api.fda.gov/animalandveterinary/enforcement.json?limit=1');
    console.log("Status:", res.status, res.statusText);
    const text = await res.text();
    console.log("Body length:", text.length);
    console.log("Body preview:", text.slice(0, 200));
  } catch(e) {
    console.log("Failed", e);
  }
}
test();
