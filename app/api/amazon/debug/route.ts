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
  if (!token) return NextResponse.json({ error: 'No token' });

  const bodyPascal = {
    Keywords: 'dog food',
    PartnerTag: PARTNER_TAG,
    PartnerType: 'Associates',
    SearchIndex: 'PetSupplies',
    ItemCount: 2,
    Resources: ['ItemInfo.Title', 'OffersV2.Listings.Price'],
  };
  
  const bodyCamel = {
    keywords: 'dog food',
    partnerTag: PARTNER_TAG,
    partnerType: 'Associates',
    searchIndex: 'PetSupplies',
    itemCount: 2,
    resources: ['ItemInfo.Title', 'OffersV2.Listings.Price'],
  };

  const results: any = {};
  const urls = [
    'https://webservices.amazon.com/paapi5/searchitems',
    'https://api.amazon.com/paapi5/searchitems',
    'https://creatorsapi.amazon.com/catalog/v1/items',
    'https://creatorsapi.amazon.com/paapi5/searchitems',
    'https://creatorsapi.amazon.com/api/v1/searchitems',
    'https://api.amazon.com/creators/v1/searchitems'
  ];

  for (const url of urls) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyCamel),
      });
      results[url + '_camel'] = { status: r.status, body: (await r.text()).slice(0, 300) };
    } catch (e: any) { results[url + '_camel'] = e.message; }

    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyPascal),
      });
      results[url + '_pascal'] = { status: r.status, body: (await r.text()).slice(0, 300) };
    } catch (e: any) { results[url + '_pascal'] = e.message; }
  }

  return NextResponse.json(results);
}
