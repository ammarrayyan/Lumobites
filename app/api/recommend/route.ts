import { NextResponse } from 'next/server';
import { recommendProducts } from '@/lib/recommender';
import { PetProfile, Product } from '@/lib/types';
import { seedProducts } from '@/lib/seed-data';
import { fetchPetFoodProducts } from '@/lib/openpetfoodfacts';
import { cacheProducts } from '@/lib/product-cache';

export async function POST(request: Request) {
  try {
    const profile: PetProfile = await request.json();
    
    let products: Product[] = [];
    let usedFallback = false;

    // Try to fetch from Open Pet Food Facts API
    try {
      products = await fetchPetFoodProducts(profile.pet_type, 80);
      if (products.length < 5) {
        // Not enough results from API — blend with seed data
        const seedForPetType = seedProducts.filter(p => p.pet_type === profile.pet_type);
        products = [...products, ...seedForPetType];
      }
    } catch (apiErr) {
      console.warn('Open Pet Food Facts API unavailable, falling back to seed data:', apiErr);
      products = seedProducts;
      usedFallback = true;
    }

    // Cache products so /api/products/[id] can look them up
    cacheProducts(products);
    
    const recommendations = recommendProducts(products, profile);
    
    return NextResponse.json({ ...recommendations, usedFallback });
  } catch (error) {
    console.error('Recommendation error:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
