import { Product } from './types';

// Simple in-process cache keyed by product ID.
// This is populated after each /api/recommend call and 
// lets the /api/products/[id] route look up OPFF products.
const productCache = new Map<string, Product>();

export function cacheProducts(products: Product[]) {
  for (const p of products) {
    productCache.set(p.id, p);
  }
}

export function getCachedProduct(id: string): Product | undefined {
  return productCache.get(id);
}
