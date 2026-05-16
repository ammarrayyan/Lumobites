import { NextResponse } from 'next/server';
import { recommendProducts } from '@/lib/recommender';
import { PetProfile, Product } from '@/lib/types';
import { seedProducts } from '@/lib/seed-data';
import { fetchPetFoodProducts } from '@/lib/openpetfoodfacts';
import { cacheProducts } from '@/lib/product-cache';

export async function POST(request: Request) {
  try {
    const profile: PetProfile = await request.json();
    console.log('Generating recommendations for:', { pet: profile.pet_type, food: profile.food_type, budget: profile.budget_monthly_max });
    
    let products: Product[] = [];
    let usedFallback = false;

    // Try to fetch from Open Pet Food Facts API
    try {
      products = await fetchPetFoodProducts(profile.pet_type, 300, profile.food_type, profile.brand);
      
      // Fallback ONLY if OPFF returns exactly 0 results
      if (products.length === 0) {
        console.warn('OPFF returned 0 results, using fallback seed data.');
        products = seedProducts.filter(p => p.pet_type === profile.pet_type);
        usedFallback = true;
      } else {
        // Always augment with seed data so wet/dry/treats seed products are in the pool.
        // This ensures the food_type filter always has guaranteed options to pull from.
        const seedPool = seedProducts.filter(p => p.pet_type === profile.pet_type);
        const opffIds = new Set(products.map(p => p.id));
        const extraSeeds = seedPool.filter(p => !opffIds.has(p.id));
        products = [...products, ...extraSeeds];
        console.log(`OPFF returned ${products.length - extraSeeds.length} products, augmented with ${extraSeeds.length} seed products.`);
      }
    } catch (apiErr) {
      console.warn('Open Pet Food Facts API unavailable, falling back to seed data:', apiErr);
      products = seedProducts.filter(p => p.pet_type === profile.pet_type);
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
