import { NextRequest, NextResponse } from 'next/server';
import { searchAmazonProducts, AmazonProduct } from '@/lib/amazon';

// ── Server-side 1-hour result cache ──────────────────────────────────────────
interface CacheEntry {
  data: AmazonProduct[];
  expiresAt: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCached(key: string): AmazonProduct[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: AmazonProduct[]) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const limit = Math.min(Number(searchParams.get('limit') || 4), 10);

    if (!q) {
      return NextResponse.json({ error: 'Missing query parameter q' }, { status: 400 });
    }

    const cacheKey = `${q}::${limit}`;
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`[/api/amazon/search] Cache hit: "${q}"`);
      return NextResponse.json({ products: cached, source: 'cache' });
    }

    console.log(`[/api/amazon/search] Fetching: "${q}" limit=${limit}`);
    const products = await searchAmazonProducts(q, limit);
    
    if (products.length > 0) {
      setCache(cacheKey, products);
    }

    return NextResponse.json({ products, source: 'amazon' });
  } catch (err: any) {
    const message = err?.message ?? String(err);
    console.error('[/api/amazon/search] Error:', message);
    return NextResponse.json(
      { products: [], error: message, source: 'error' },
      { status: 200 }, // Return 200 with empty array so frontend degrades gracefully
    );
  }
}
