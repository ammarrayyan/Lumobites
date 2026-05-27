const token = process.env.AMAZON_TOKEN;

async function test() {
  const url = 'https://creatorsapi.amazon/catalog/v1/items/search';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'x-marketplace': 'www.amazon.com'
  };

  const payloads = [
    // 1: camelCase
    { keywords: "dog food", partnerTag: "lumobites-20", partnerType: "Associates" },
    // 2: PascalCase
    { Keywords: "dog food", PartnerTag: "lumobites-20", PartnerType: "Associates" },
    // 3: Missing x-marketplace
    { keywords: "dog food", partnerTag: "lumobites-20" },
  ];

  for (const p of payloads) {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(p) });
    console.log(await res.text());
  }
}
test();
