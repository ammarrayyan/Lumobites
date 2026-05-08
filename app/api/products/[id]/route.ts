import { NextResponse } from 'next/server';
import { seedProducts } from '@/lib/seed-data';
import { getCachedProduct } from '@/lib/product-cache';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    // 1. Check the in-memory cache (populated by /api/recommend)
    const cached = getCachedProduct(id);
    if (cached) {
      return NextResponse.json({
        ...cached,
        // Map to the shape expected by the product detail page
        name: cached.product_name,
        description: cached.pros,
        amazon_link: cached.buy_links?.amazon,
        chewy_link: cached.buy_links?.chewy,
        petco_link: cached.buy_links?.petco,
        petsmart_link: cached.buy_links?.petsmart,
      });
    }
    
    // 2. Fallback to seed data
    const product = seedProducts.find(p => p.id === id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      ...product,
      name: product.product_name,
      description: product.pros,
      amazon_link: product.buy_links?.amazon,
      chewy_link: product.buy_links?.chewy,
      petco_link: product.buy_links?.petco,
      petsmart_link: product.buy_links?.petsmart,
    });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
