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

  const bodyCamel = {
    keywords: 'dog food',
    partnerTag: PARTNER_TAG,
    partnerType: 'Associates',
    searchIndex: 'PetSupplies',
    itemCount: 2,
    resources: ['ItemInfo.Title', 'OffersV2.Listings.Price'],
  };

  const results: any = {};

  try {
    const r = await fetch('https://webservices.amazon.com/paapi5/searchitems', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-marketplace': 'www.amazon.com'
      },
      body: JSON.stringify(bodyCamel),
    });
    results['test_webservices_paapi5'] = { status: r.status, body: (await r.text()).slice(0, 300) };
  } catch (e: any) { results['test_webservices_paapi5'] = e.message; }

  try {
    const r = await fetch('https://api.amazon.com/creators/catalog/v1/items/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-marketplace': 'www.amazon.com'
      },
      body: JSON.stringify(bodyCamel),
    });
    results['test_creators_catalog_search'] = { status: r.status, body: (await r.text()).slice(0, 300) };
  } catch (e: any) { results['test_creators_catalog_search'] = e.message; }

  try {
    const r = await fetch('https://api.amazon.com/creatorsapi/v1/searchitems', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-marketplace': 'www.amazon.com'
      },
      body: JSON.stringify(bodyCamel),
    });
    results['test_api_creatorsapi_searchitems'] = { status: r.status, body: (await r.text()).slice(0, 300) };
  } catch (e: any) { results['test_api_creatorsapi_searchitems'] = e.message; }

  try {
    const r = await fetch('https://webservices.amazon.com/paapi5/searchitems', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ...bodyCamel, marketplace: 'www.amazon.com' }),
    });
    results['test_webservices_marketplace_body'] = { status: r.status, body: (await r.text()).slice(0, 300) };
  } catch (e: any) { results['test_webservices_marketplace_body'] = e.message; }

  return NextResponse.json(results);
}
