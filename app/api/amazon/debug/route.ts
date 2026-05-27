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

  // Test 1: Header marketplace + camelCase searchIndex
  const bodyCamel1 = {
    keywords: 'dog food',
    partnerTag: PARTNER_TAG,
    partnerType: 'Associates',
    searchIndex: 'petSupplies', 
    itemCount: 2,
    resources: ['itemInfo.title', 'offersV2.listings.price'],
  };
  const headers1 = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'x-marketplace': 'www.amazon.com'
  };

  // Test 2: Query marketplace + camelCase searchIndex
  const bodyCamel2 = { ...bodyCamel1 };
  const headers2 = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Test 3: Header marketplace + PascalCase searchIndex (to prove if it's the culprit)
  const bodyCamel3 = { ...bodyCamel1, searchIndex: 'PetSupplies' };

  const results: any = {};
  
  try {
    const r = await fetch('https://creatorsapi.amazon/catalog/v1/items/search', { method: 'POST', headers: headers1, body: JSON.stringify(bodyCamel1) });
    results['test1_header_marketplace_camelCase_index'] = { status: r.status, body: (await r.text()).slice(0, 500) };
  } catch (e: any) { results['test1'] = e.message; }

  try {
    const r = await fetch('https://creatorsapi.amazon/catalog/v1/items/search?marketplace=www.amazon.com', { method: 'POST', headers: headers2, body: JSON.stringify(bodyCamel2) });
    results['test2_query_marketplace_camelCase_index'] = { status: r.status, body: (await r.text()).slice(0, 500) };
  } catch (e: any) { results['test2'] = e.message; }

  try {
    const r = await fetch('https://creatorsapi.amazon/catalog/v1/items/search', { method: 'POST', headers: headers1, body: JSON.stringify(bodyCamel3) });
    results['test3_header_marketplace_PascalCase_index'] = { status: r.status, body: (await r.text()).slice(0, 500) };
  } catch (e: any) { results['test3'] = e.message; }

  return NextResponse.json(results);
}
