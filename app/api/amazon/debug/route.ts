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

  const bodyCamel = {
    keywords: 'dog food',
    partnerTag: PARTNER_TAG,
    partnerType: 'Associates',
    searchIndex: 'PetSupplies',
    itemCount: 2,
    resources: ['ItemInfo.Title', 'OffersV2.Listings.Price'],
  };

  const results: any = {};
  
  // Base headers with User-Agent added to bypass CloudFront blocks
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'User-Agent': 'LumoBites/1.0 (Node.js)',
    'Accept': 'application/json',
    'x-marketplace': 'www.amazon.com'
  };

  const urls = [
    'https://webservices.amazon.com/paapi5/searchitems',
    'https://api.amazon.com/paapi5/searchitems',
    'https://api.amazon.com/creators/catalog/v1/items/search',
    'https://api.amazon.com/creatorsapi/v1/searchitems'
  ];

  for (const url of urls) {
    try {
      const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(bodyCamel) });
      results[url] = { status: r.status, body: (await r.text()).slice(0, 300) };
    } catch (e: any) { results[url] = e.message; }
  }

  // Also test PA-API endpoint with x-amz-target just in case it works with Bearer + x-amz-target + User-Agent
  try {
    const r = await fetch('https://webservices.amazon.com/paapi5/searchitems', {
      method: 'POST',
      headers: { ...headers, 'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems' },
      body: JSON.stringify(bodyCamel)
    });
    results['webservices_with_target'] = { status: r.status, body: (await r.text()).slice(0, 300) };
  } catch(e:any) { results['webservices_with_target'] = e.message; }

  return NextResponse.json(results);
}
