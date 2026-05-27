/**
 * Amazon Creators API v3.x Client
 * - OAuth 2.0 client credentials (Login with Amazon / LwA)
 * - Token request: form-encoded, scope = creatorsapi::default
 * - Search endpoint: https://creatorsapi.amazon/catalog/v1/items/search?marketplace=www.amazon.com
 * - Token cached in-process with 5-min safety margin
 * - All credentials server-side only — never exposed to the browser
 */

const TOKEN_URL = 'https://api.amazon.com/auth/o2/token';
const SEARCH_URL = 'https://creatorsapi.amazon/catalog/v1/items/search?marketplace=www.amazon.com';
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
  if (_token && now < _tokenExpiry - 5 * 60_000) {
    console.log('[Amazon] Reusing cached token');
    return _token;
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Amazon credentials not configured.');
  }

  console.log('[Amazon] Fetching new access token...');

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
    throw new Error(`Amazon token missing access_token: ${JSON.stringify(data)}`);
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

  // Creators API SearchItems uses fully lowerCamelCase payload
  const body = {
    keywords: keyword,
    partnerTag: PARTNER_TAG,
    partnerType: 'Associates',
    searchIndex: 'petSupplies', // or "all", but let's stick to petSupplies
    itemCount: Math.min(limit, 10),
    resources: [
      'images.primary.large',
      'images.primary.medium',
      'itemInfo.title',
      'offersV2.listings.price',
      'offersV2.listings.deliveryInfo.isPrimeEligible',
      'customerReviews.starRating',
      'customerReviews.count',
    ],
  };

  console.log(`[Amazon] SearchItems: "${keyword}" limit=${limit}`);

  const res = await fetch(SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'User-Agent': 'LumoBites/1.0 (Node.js)'
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[Amazon] SearchItems failed (${res.status}): ${text}`);
    if (res.status === 401 || res.status === 403) {
      _token = null;
      _tokenExpiry = 0;
    }
    throw new Error(`Amazon API returned ${res.status}: ${text}`);
  }

  const data = await res.json();

  if (data?.errors) {
    console.error('[Amazon] SearchItems API errors:', JSON.stringify(data.errors));
    throw new Error(`Amazon API errors: ${JSON.stringify(data.errors)}`);
  }

  const items: any[] = data?.searchResult?.items ?? [];
  console.log(`[Amazon] SearchItems returned ${items.length} items`);

  return items.map((item: any): AmazonProduct => {
    const asin: string = item.asin ?? '';
    const title: string = item.itemInfo?.title?.displayValue ?? 'Unknown Product';

    // Affiliate URL
    const detailUrl: string =
      item.detailPageURL ??
      `https://www.amazon.com/dp/${asin}?tag=${PARTNER_TAG}`;
    const url = detailUrl.includes('tag=')
      ? detailUrl
      : `${detailUrl}${detailUrl.includes('?') ? '&' : '?'}tag=${PARTNER_TAG}`;

    // Image
    const image: string =
      item.images?.primary?.large?.url ??
      item.images?.primary?.medium?.url ??
      '';

    // Price
    const listings: any[] = item.offersV2?.listings ?? [];
    const priceRaw: number =
      listings[0]?.price?.amount != null
        ? Math.round(Number(listings[0].price.amount) * 100)
        : 0;
    const price = priceRaw ? `$${(priceRaw / 100).toFixed(2)}` : '';

    // Prime
    const isPrime: boolean =
      listings[0]?.deliveryInfo?.isPrimeEligible === true;

    // Reviews
    const rating: number = Number(item.customerReviews?.starRating?.value ?? 0);
    const reviewCount: number = Number(item.customerReviews?.count ?? 0);

    return { asin, title, url, image, price, priceRaw, rating, reviewCount, isPrime };
  });
}
