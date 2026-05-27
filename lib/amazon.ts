/**
 * Amazon Creators API v3.x Client
 * - OAuth 2.0 client credentials flow (NA region)
 * - Token cached in-process with expiry
 * - searchItems wraps the PA-API SearchItems operation
 * - All credentials read from env — never exposed to the browser
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
  // Re-use token if it has >60 seconds left
  if (_token && now < _tokenExpiry - 60_000) return _token;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Amazon credentials are not configured (AMAZON_CLIENT_ID / AMAZON_CLIENT_SECRET)');
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'advertising::campaign_management', // PA-API scope for Creators API
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amazon token fetch failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  _token = data.access_token as string;
  // expires_in is in seconds
  _tokenExpiry = now + (data.expires_in || 3600) * 1000;
  return _token;
}

// ── Search ────────────────────────────────────────────────────────────────────
export async function searchAmazonProducts(
  keyword: string,
  limit = 4,
): Promise<AmazonProduct[]> {
  const token = await getToken();

  const body = {
    Keywords: keyword,
    PartnerTag: PARTNER_TAG,
    PartnerType: 'Associates',
    SearchIndex: 'PetSupplies',
    ItemCount: limit,
    Resources: [
      'Images.Primary.Large',
      'ItemInfo.Title',
      'OffersV2.Listings.Price',
      'OffersV2.Listings.DeliveryInfo.IsPrimeEligible',
      'CustomerReviews.StarRating',
      'CustomerReviews.Count',
    ],
  };

  const res = await fetch(SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[Amazon] SearchItems failed: ${res.status} ${text}`);
    return [];
  }

  const data = await res.json();
  const items: any[] = data?.SearchResult?.Items ?? [];

  return items.map((item: any): AmazonProduct => {
    const asin: string = item.ASIN ?? '';
    const title: string = item.ItemInfo?.Title?.DisplayValue ?? 'Unknown Product';

    // Affiliate URL — always append tag
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
    const rating: number =
      Number(item.CustomerReviews?.StarRating?.Value ?? 0);
    const reviewCount: number =
      Number(item.CustomerReviews?.Count ?? 0);

    return { asin, title, url, image, price, priceRaw, rating, reviewCount, isPrime };
  });
}
