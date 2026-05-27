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

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'x-marketplace': 'www.amazon.com'
  };

  const results: any = {};
  
  // Test 1: Empty resources array
  const bodyEmptyResources = {
    keywords: 'dog food',
    partnerTag: PARTNER_TAG,
    partnerType: 'Associates',
  };

  // Test 2: PascalCase resources strings
  const bodyPascalResources = {
    ...bodyEmptyResources,
    resources: ['ItemInfo.Title', 'OffersV2.Listings.Price'],
  };

  try {
    const r = await fetch('https://creatorsapi.amazon/catalog/v1/items/search', { method: 'POST', headers, body: JSON.stringify(bodyEmptyResources) });
    results['test1_empty_resources'] = { status: r.status, body: (await r.text()).slice(0, 500) };
  } catch (e: any) { results['test1'] = e.message; }

  try {
    const r = await fetch('https://creatorsapi.amazon/catalog/v1/items/search', { method: 'POST', headers, body: JSON.stringify(bodyPascalResources) });
    results['test2_pascal_resources'] = { status: r.status, body: (await r.text()).slice(0, 500) };
  } catch (e: any) { results['test2'] = e.message; }

  return NextResponse.json(results);
}
