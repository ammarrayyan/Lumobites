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
    
    // 2. If it's an OPFF product, fetch it directly from their API
    if (id.startsWith('opff_')) {
      const code = id.split('_')[2]; // e.g., opff_dog_12345678_0 -> 12345678
      if (code) {
        try {
          const apiRes = await fetch(`https://world.openpetfoodfacts.org/api/v0/product/${code}.json`);
          if (apiRes.ok) {
            const data = await apiRes.json();
            if (data.product) {
              const raw = data.product;
              const name = raw.product_name_en || raw.product_name || 'Unknown Product';
              const brand = (raw.brands || '').split(',')[0].trim() || 'Unknown Brand';
              const ingredients = raw.ingredients_text_en || raw.ingredients_text || 'Ingredients not listed.';
              
              // We do a minimal transform just for the detail page
              return NextResponse.json({
                id,
                name,
                brand,
                description: 'A quality product from ' + brand,
                ingredients,
                image_url: raw.image_front_url || raw.image_url || '/images/placeholder.svg',
                amazon_link: `https://www.amazon.com/s?k=${encodeURIComponent(brand + ' ' + name)}`,
              });
            }
          }
        } catch (e) {
          console.error('Failed to fetch from OPFF directly', e);
        }
      }
    }
    
    // 3. Fallback to seed data (only for the new 12 real fallbacks)
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
