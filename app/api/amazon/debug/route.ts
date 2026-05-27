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

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'x-marketplace': 'www.amazon.com',
    'Accept': 'application/json',
    'User-Agent': 'LumoBites/1.0 (Node.js)'
  };

  const bodyCamel = {
    keywords: 'dog food',
    partnerTag: PARTNER_TAG,
    searchIndex: 'petSupplies',
    itemCount: 2,
    resources: [
      'images.primary.large',
      'itemInfo.title',
      'offersV2.listings.price'
    ],
  };

  try {
    const r = await fetch('https://creatorsapi.amazon/catalog/v1/searchItems', { method: 'POST', headers, body: JSON.stringify(bodyCamel) });
    const rawText = await r.text();
    return NextResponse.json({
      status: r.status,
      bodyString: rawText,
      parsed: JSON.parse(rawText || '{}')
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
export const GET = POST;
