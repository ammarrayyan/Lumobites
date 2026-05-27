import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug endpoint — test different search endpoint + header combinations.
 * Remove once issue is resolved.
 */
export async function POST(req: NextRequest) {
  const CLIENT_ID = process.env.AMAZON_CLIENT_ID || '';
  const CLIENT_SECRET = process.env.AMAZON_CLIENT_SECRET || '';
  const PARTNER_TAG = process.env.AMAZON_ASSOCIATE_TAG || 'lumobites-20';
  const TOKEN_URL = 'https://api.amazon.com/auth/o2/token';

  // Step 1: get token (we know this works)
  const tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'creatorsapi::default',
    }).toString(),
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;

  if (!token) {
    return NextResponse.json({ error: 'Token failed', tokenData });
  }

  const body = {
    Keywords: 'dog food',
    PartnerTag: PARTNER_TAG,
    PartnerType: 'Associates',
    SearchIndex: 'PetSupplies',
    ItemCount: 2,
    Resources: ['ItemInfo.Title', 'OffersV2.Listings.Price'],
  };

  const results: Record<string, any> = { tokenOk: true };

  // ── Test A: PA-API v5 endpoint WITH x-amz-target + content-encoding ─────
  try {
    const rA = await fetch('https://webservices.amazon.com/paapi5/searchitems', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Encoding': 'amz-1.0',
        'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    results.testA_paapi_with_amz_headers = { status: rA.status, body: (await rA.text()).slice(0, 600) };
  } catch (e: any) { results.testA_paapi_with_amz_headers = { error: e.message }; }

  // ── Test B: PA-API v5 endpoint with only content-encoding ───────────────
  try {
    const rB = await fetch('https://webservices.amazon.com/paapi5/searchitems', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Encoding': 'amz-1.0',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    results.testB_paapi_content_encoding_only = { status: rB.status, body: (await rB.text()).slice(0, 600) };
  } catch (e: any) { results.testB_paapi_content_encoding_only = { error: e.message }; }

  // ── Test C: Creators API v3.1 endpoint (if different URL) ────────────────
  try {
    const rC = await fetch('https://webservices.amazon.com/creatorsapi/v3.1/searchitems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    results.testC_creators_v31_url = { status: rC.status, body: (await rC.text()).slice(0, 600) };
  } catch (e: any) { results.testC_creators_v31_url = { error: e.message }; }

  // ── Test D: US marketplace endpoint ─────────────────────────────────────
  try {
    const rD = await fetch('https://webservices.amazon.com/paapi5/searchitems', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Encoding': 'amz-1.0',
        'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
        'Authorization': `Bearer ${token}`,
        'Host': 'webservices.amazon.com',
      },
      body: JSON.stringify({ ...body, Marketplace: 'www.amazon.com' }),
    });
    results.testD_with_marketplace_field = { status: rD.status, body: (await rD.text()).slice(0, 600) };
  } catch (e: any) { results.testD_with_marketplace_field = { error: e.message }; }

  // ── Test E: lowercase camelCase body (Creators API v3.1 style) ───────────
  try {
    const bodyCC = {
      keywords: 'dog food',
      partnerTag: PARTNER_TAG,
      partnerType: 'Associates',
      searchIndex: 'PetSupplies',
      itemCount: 2,
      resources: ['ItemInfo.Title', 'OffersV2.Listings.Price'],
    };
    const rE = await fetch('https://webservices.amazon.com/paapi5/searchitems', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Encoding': 'amz-1.0',
        'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(bodyCC),
    });
    results.testE_camelCase_body = { status: rE.status, body: (await rE.text()).slice(0, 600) };
  } catch (e: any) { results.testE_camelCase_body = { error: e.message }; }

  return NextResponse.json(results, { status: 200 });
}
