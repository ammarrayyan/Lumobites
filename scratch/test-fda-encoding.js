async function test() {
  console.log("Testing exact URL encoding for FDA API...");
  
  try {
    const url = 'https://api.fda.gov/food/enforcement.json?search=product_type:%22Animal%20%26%20Veterinary%22&limit=5';
    console.log("Fetching:", url);
    const res = await fetch(url);
    const json = await res.json();
    console.log("Result:", json.results ? "Success: " + json.results.length + " items" : json);
  } catch(e) {
    console.log("Failed", e);
  }
}
test();
