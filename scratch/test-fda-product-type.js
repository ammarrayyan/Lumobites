async function test() {
  console.log("Testing FDA product_type...");
  
  try {
    const res = await fetch('https://api.fda.gov/food/enforcement.json?search=product_type:Animal&limit=1');
    const json = await res.json();
    console.log("product_type:Animal ->", json.results ? "Success" : json);
  } catch(e) {}
  
  try {
    const res = await fetch('https://api.fda.gov/food/enforcement.json?search=product_type:Veterinary&limit=1');
    const json = await res.json();
    console.log("product_type:Veterinary ->", json.results ? "Success" : json);
  } catch(e) {}
  
  try {
    // Just fetch 10 items from food enforcement and print their product_type
    const res = await fetch('https://api.fda.gov/food/enforcement.json?limit=10');
    const json = await res.json();
    console.log("Sample product_types:");
    if(json.results) {
      json.results.forEach(r => console.log("-", r.product_type));
    }
  } catch(e) {}
}
test();
