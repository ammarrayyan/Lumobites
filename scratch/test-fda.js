async function test() {
  console.log("Testing FDA endpoints...");
  
  try {
    const res2 = await fetch('https://api.fda.gov/food/enforcement.json?search=product_type:"Animal+%26+Veterinary"&limit=1');
    const json2 = await res2.json();
    console.log("Endpoint 2 (/food/enforcement.json with search):", json2.results ? "Success" : json2);
    if(json2.results) console.log(json2.results[0].product_description);
  } catch(e) {
    console.log("Endpoint 2 failed", e);
  }

  try {
    const res3 = await fetch('https://api.fda.gov/animalandveterinary/enforcement.json?search=product_type:"Animal+%26+Veterinary"&limit=1');
    const json3 = await res3.json();
    console.log("Endpoint 3 (/animalandveterinary/enforcement.json with search):", json3.results ? "Success" : json3);
  } catch(e) {
    console.log("Endpoint 3 failed", e);
  }
}
test();
