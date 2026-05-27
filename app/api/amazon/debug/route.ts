import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug endpoint — never deploy permanently to production.
 * Exposes raw Amazon API error messages to help diagnose connection issues.
 * Only readable server-side; credentials are never sent to the browser.
 */
export async function GET(req: NextRequest) {
  const CLIENT_ID = process.env.AMAZON_CLIENT_ID || '';
  const CLIENT_SECRET = process.env.AMAZON_CLIENT_SECRET || '';
  const PARTNER_TAG = process.env.AMAZON_ASSOCIATE_TAG || 'lumobites-20';
  const TOKEN_URL = 'https://api.amazon.com/auth/o2/token';
  const SEARCH_URL = 'https://webservices.amazon.com/paapi5/searchitems';

  const results: Record<string, any> = {
    env: {
      hasClientId: !!CLIENT_ID,
      clientIdLength: CLIENT_ID.length,
      hasClientSecret: !!CLIENT_SECRET,
      clientSecretLength: CLIENT_SECRET.length,
      partnerTag: PARTNER_TAG,
      apiVersion: process.env.AMAZON_API_VERSION,
      marketplace: process.env.AMAZON_MARKETPLACE,
    },
  };

  // ── Test 1: form-encoded with scope ──────────────────────────────────────
  try {
    const body1 = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'creatorsapi::default',
    });
    const r1 = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body1.toString(),
    });
    const t1 = await r1.text();
    results.test1_form_encoded_with_scope = { status: r1.status, body: t1.slice(0, 500) };
  } catch (e: any) { results.test1_form_encoded_with_scope = { error: e.message }; }

  // ── Test 2: form-encoded WITHOUT scope ───────────────────────────────────
  try {
    const body2 = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });
    const r2 = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body2.toString(),
    });
    const t2 = await r2.text();
    results.test2_form_encoded_no_scope = { status: r2.status, body: t2.slice(0, 500) };
  } catch (e: any) { results.test2_form_encoded_no_scope = { error: e.message }; }

  // ── Test 3: JSON body with creatorsapi::default scope ─────────────────────
  try {
    const r3 = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: 'creatorsapi::default',
      }),
    });
    const t3 = await r3.text();
    results.test3_json_with_scope = { status: r3.status, body: t3.slice(0, 500) };
  } catch (e: any) { results.test3_json_with_scope = { error: e.message }; }

  // ── Test 4: if test1 succeeded, try a real SearchItems call ──────────────
  const test1Body = results.test1_form_encoded_with_scope?.body;
  if (test1Body) {
    try {
      const parsed = JSON.parse(test1Body);
      if (parsed?.access_token) {
        const token = parsed.access_token;
        const searchBody = {
          Keywords: 'dog food',
          PartnerTag: PARTNER_TAG,
          PartnerType: 'Associates',
          SearchIndex: 'PetSupplies',
          ItemCount: 2,
          Resources: ['ItemInfo.Title', 'OffersV2.Listings.Price'],
        };
        const rs = await fetch(SEARCH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(searchBody),
        });
        const ts = await rs.text();
        results.test4_search_with_test1_token = { status: rs.status, body: ts.slice(0, 800) };
      }
    } catch (e: any) { results.test4_search_with_test1_token = { error: e.message }; }
  }

  return NextResponse.json(results);
}
