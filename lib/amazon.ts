/**
 * Amazon Creators API v3.x Client
 * - OAuth 2.0 client credentials (Login with Amazon / LwA)
 * - Token request: form-encoded, scope = creatorsapi::default
 * - Search endpoint: webservices.amazon.com/paapi5/searchitems (PascalCase body, Bearer auth)
 * - Token cached in-process with 5-min safety margin
 * - All credentials server-side only — never exposed to the browser
 */

const TOKEN_URL = 'https://api.amazon.com/auth/o2/token';
const SEARCH_URL = 'https://webservices.amazon.com/paapi5/searchitems';
const PARTNER_TAG = process.env.AMAZON_ASSOCIATE_TAG || 'lumobites-20';
const CLIENT_ID = process.env.AMAZON_CLIENT_ID || '';
const CLIENT_SECRET = process.env.AMAZON_CLIENT_SECRET || '';

export interface AmazonProduct {
  asin: string;
  title: string;
  url: string;          // Always includes lumobites-20 affiliate tag
  image: string;
  price: string;        // e.g. "$24.99"
  priceRaw: number;     // cents, 0 if unavailable
  rating: number;       // 0–5, 0 if unavailable
  reviewCount: number;
  isPrime: boolean;
}

// ── Token cache ───────────────────────────────────────────────────────────────
let _token: string | null = null;
let _tokenExpiry = 0; // Unix ms

async function getToken(): Promise<string> {
  const now = Date.now();
  // Re-use token if it has >5 minutes left
  if (_token && now < _tokenExpiry - 5 * 60_000) {
    console.log('[Amazon] Reusing cached token');
    return _token;
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Amazon credentials not configured. Ensure AMAZON_CLIENT_ID and AMAZON_CLIENT_SECRET are set in Vercel environment variables.');
  }

  console.log('[Amazon] Fetching new access token...');

  // Login with Amazon (LwA) requires form-encoded body (not JSON)
  // Scope: creatorsapi::default for the Creators API v3.x
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: 'creatorsapi::default',
  });

  let res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  // Fallback: try without scope (some credential sets don't need it)
  if (!res.ok) {
    const errText = await res.text();
    console.warn(`[Amazon] Token with scope failed (${res.status}): ${errText}. Retrying without scope...`);

    const paramsNoScope = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });
    res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: paramsNoScope.toString(),
    });

    if (!res.ok) {
      const err2 = await res.text();
      throw new Error(`Amazon token fetch failed (${res.status}): ${err2}`);
    }
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`Amazon token response missing access_token: ${JSON.stringify(data)}`);
  }

  _token = data.access_token as string;
  _tokenExpiry = now + (data.expires_in || 3600) * 1000;
  console.log(`[Amazon] Token acquired. Expires in ${data.expires_in}s`);
  return _token;
}

// ── Search ────────────────────────────────────────────────────────────────────
export async function searchAmazonProducts(
  keyword: string,
  limit = 4,
): Promise<AmazonProduct[]> {
  const token = await getToken();

  // Creators API SearchItems — PascalCase body, Bearer auth
  const body = {
    Keywords: keyword,
    PartnerTag: PARTNER_TAG,
    PartnerType: 'Associates',
    SearchIndex: 'PetSupplies',
    ItemCount: Math.min(limit, 10),
    Resources: [
      'Images.Primary.Large',
      'Images.Primary.Medium',
      'ItemInfo.Title',
      'OffersV2.Listings.Price',
      'OffersV2.Listings.DeliveryInfo.IsPrimeEligible',
      'CustomerReviews.StarRating',
      'CustomerReviews.Count',
    ],
  };

  console.log(`[Amazon] SearchItems: "${keyword}" limit=${limit}`);

  const res = await fetch(SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[Amazon] SearchItems failed (${res.status}): ${text}`);
    // Invalidate token on 401/403 so next call re-fetches
    if (res.status === 401 || res.status === 403) {
      _token = null;
      _tokenExpiry = 0;
    }
    return [];
  }

  const data = await res.json();

  if (data?.Errors) {
    console.error('[Amazon] SearchItems API errors:', JSON.stringify(data.Errors));
    return [];
  }

  const items: any[] = data?.SearchResult?.Items ?? [];
  console.log(`[Amazon] SearchItems returned ${items.length} items`);

  return items.map((item: any): AmazonProduct => {
    const asin: string = item.ASIN ?? '';
    const title: string = item.ItemInfo?.Title?.DisplayValue ?? 'Unknown Product';

    // Affiliate URL — always ensure tag is present
    const detailUrl: string =
      item.DetailPageURL ??
      `https://www.amazon.com/dp/${asin}?tag=${PARTNER_TAG}`;
    const url = detailUrl.includes('tag=')
      ? detailUrl
      : `${detailUrl}${detailUrl.includes('?') ? '&' : '?'}tag=${PARTNER_TAG}`;

    // Image
    const image: string =
      item.Images?.Primary?.Large?.URL ??
      item.Images?.Primary?.Medium?.URL ??
      '';

    // Price (OffersV2)
    const listings: any[] = item.OffersV2?.Listings ?? [];
    const priceRaw: number =
      listings[0]?.Price?.Amount != null
        ? Math.round(Number(listings[0].Price.Amount) * 100)
        : 0;
    const price = priceRaw ? `$${(priceRaw / 100).toFixed(2)}` : '';

    // Prime
    const isPrime: boolean =
      listings[0]?.DeliveryInfo?.IsPrimeEligible === true;

    // Reviews
    const rating: number = Number(item.CustomerReviews?.StarRating?.Value ?? 0);
    const reviewCount: number = Number(item.CustomerReviews?.Count ?? 0);

    return { asin, title, url, image, price, priceRaw, rating, reviewCount, isPrime };
  });
}
