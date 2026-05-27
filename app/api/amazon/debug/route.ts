import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const CLIENT_ID = process.env.AMAZON_CLIENT_ID || '';
  const CLIENT_SECRET = process.env.AMAZON_CLIENT_SECRET || '';
  const PARTNER_TAG = process.env.AMAZON_ASSOCIATE_TAG || 'lumobites-20';
  
  const tokenRes = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'creatorsapi::default',
    }).toString(),
  });
  const token = (await tokenRes.json()).access_token;

  // Fully lowerCamelCase body, including array values
  const bodyCamel = {
    keywords: 'dog food',
    partnerTag: PARTNER_TAG,
    partnerType: 'Associates',
    marketplace: 'www.amazon.com',
    searchIndex: 'petSupplies', // Or petSupplies?
    itemCount: 2,
    resources: ['itemInfo.title', 'offersV2.listings.price'],
  };
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const results: any = {};
  
  // Test .amazon TLD endpoints
  const urls = [
    'https://creatorsapi.amazon/catalog/v1/items/search',
    'https://creatorsapi.amazon/catalog/v1/items',
    'https://creatorsapi.amazon/api/v1/searchItems'
  ];

  for (const url of urls) {
    try {
      const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(bodyCamel) });
      results[url] = { status: r.status, body: (await r.text()).slice(0, 300) };
    } catch (e: any) { results[url] = e.message; }
  }

  return NextResponse.json(results);
}
