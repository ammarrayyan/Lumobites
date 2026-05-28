import { NextRequest, NextResponse } from 'next/server';

export async function test() {
  const req = new NextRequest('http://localhost/api/amazon/search?q=dog+food&limit=2');
  
  // mock searchAmazonProducts
  async function searchAmazonProducts(q: string, limit: number) {
    const text = '{"message":"Your account does not currently meet the eligibility requirements.","reason":"AssociateNotEligible","type":"AccessDeniedException"}';
    console.error(`[Amazon] SearchItems failed (403): ${text}`);
    throw new Error(`Amazon API returned 403: ${text}`);
  }

  // mock getMockProducts
  function getMockProducts(q: string, limit: number) {
    return [{ title: 'mock' }];
  }

  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const limit = Math.min(Number(searchParams.get('limit') || 4), 10);

    const products = await searchAmazonProducts(q, limit);
    return NextResponse.json({ products, source: 'amazon' });
  } catch (err: any) {
    const message = err?.message ?? String(err);
    console.error('[/api/amazon/search] Error:', message);
    if (message.includes('AssociateNotEligible') || message.includes('AccessDeniedException')) {
      console.log('[/api/amazon/search] Using mock fallback due to AssociateNotEligible.');
      const mockProducts = getMockProducts(q, limit); // q and limit might be out of scope?
      return NextResponse.json({ products: mockProducts, source: 'mock_fallback' });
    }

    return NextResponse.json(
      { products: [], error: message, source: 'error' },
      { status: 200 }
    );
  }
}

test().then(res => res.json()).then(console.log).catch(console.error);
