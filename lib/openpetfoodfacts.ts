import { Product, HealthTag, LifeStage, PetType } from './types';

const BASE_URL = 'https://world.openpetfoodfacts.org/cgi/search.pl';
const AFFILIATE_TAG = 'lumobites-20';

// ─── Brand tier pricing ───────────────────────────────────────────────────────
const PREMIUM_BRANDS = ['orijen', 'acana', 'zignature', 'nulo', 'instinct', 'tiki', 'stella', 'honest kitchen', 'open farm', 'primal', 'fromm', 'merrick', 'victor'];
const BUDGET_BRANDS = ['pedigree', 'purina dog chow', 'alpo', 'kibbles', 'gravy train', 'beneful', 'friskies', 'meow mix', '9lives', 'fancy feast', 'ol\' roy', 'special kitty'];
const MID_BRANDS = ['purina pro plan', 'purina one', "hill's", "hills", 'royal canin', 'iams', 'eukanuba', 'blue buffalo', 'taste of the wild', 'diamond', 'rachel ray', 'nutro', 'science diet', 'wellness', 'natural balance'];

function estimatePrice(brand: string): { low: number; high: number } {
  const b = brand.toLowerCase();
  if (PREMIUM_BRANDS.some(p => b.includes(p))) return { low: 75, high: 120 };
  if (BUDGET_BRANDS.some(p => b.includes(p))) return { low: 15, high: 30 };
  if (MID_BRANDS.some(p => b.includes(p))) return { low: 40, high: 70 };
  return { low: 35, high: 60 };
}

// ─── Health tag inference from ingredients ────────────────────────────────────
function inferHealthTags(ingredients: string, productName: string): HealthTag[] {
  const text = (ingredients + ' ' + productName).toLowerCase();
  const tags: HealthTag[] = [];

  if (text.includes('probiotic') || text.includes('prebiotic') || text.includes('beet pulp') || text.includes('digestive')) {
    tags.push('sensitive_stomach');
  }
  if (text.includes('limited') || text.includes('hydrolyzed') || text.includes('single') || text.includes('hypoallergen') || text.includes('novel protein')) {
    tags.push('allergies');
  }
  if (text.includes('l-tryptophan') || text.includes('calming') || text.includes('chamomile') || text.includes('hemp')) {
    tags.push('anxiety');
  }
  if (text.includes('glucosamine') || text.includes('chondroitin') || text.includes('joint') || text.includes('omega-3') || text.includes('hip')) {
    tags.push('joint');
  }
  if (text.includes('weight') || text.includes(' light ') || text.includes(' lean ') || text.includes('low fat') || text.includes('reduced calor')) {
    tags.push('weight_control');
  }
  if (text.includes('broth') || text.includes('gravy') || text.includes('picky') || text.includes('palatab')) {
    tags.push('picky_eater');
  }

  return tags;
}

// ─── Life stage inference from product name ───────────────────────────────────
function inferLifeStage(petType: PetType, name: string): LifeStage {
  const n = name.toLowerCase();
  if (n.includes('kitten') || n.includes('puppy') || n.includes('junior') || n.includes('baby') || n.includes('growth') || n.includes('young')) {
    return petType === 'cat' ? 'kitten' : 'puppy';
  }
  if (n.includes('senior') || n.includes('mature') || n.includes('ageing') || n.includes('aging') || n.includes('7+') || n.includes('8+') || n.includes('older')) {
    return 'senior';
  }
  return 'adult';
}

// ─── Build Amazon affiliate buy link ──────────────────────────────────────────
function buildAmazonLink(productName: string, brand: string): string {
  const query = encodeURIComponent(`${brand} ${productName}`);
  return `https://www.amazon.com/s?k=${query}&tag=${AFFILIATE_TAG}`;
}

// ─── Build pros/cons from available data ─────────────────────────────────────
function buildProsCons(raw: any): { pros: string; cons: string } {
  const ingredients = (raw.ingredients_text || raw.ingredients_text_en || '').toLowerCase();
  const name = (raw.product_name || raw.product_name_en || '').toLowerCase();
  const nutriments = raw.nutriments || {};
  const protein = parseFloat(nutriments['proteins_100g'] || nutriments['proteins'] || '0') || 0;
  const fat = parseFloat(nutriments['fat_100g'] || nutriments['fat'] || '0') || 0;

  const pros: string[] = [];
  const cons: string[] = [];

  if (protein > 30) pros.push('High protein formula');
  else if (protein > 20) pros.push('Good protein content');

  if (/chicken|salmon|beef|turkey|lamb|tuna|whitefish|duck/.test(ingredients)) {
    pros.push('Real meat as a key ingredient');
  }
  if (ingredients.includes('probiotic')) pros.push('Contains probiotics for digestion');
  if (ingredients.includes('glucosamine')) pros.push('Supports joint health');
  if (/omega|fish oil|flaxseed/.test(ingredients)) pros.push('Omega fatty acids for coat health');
  if (fat < 8) pros.push('Low fat — good for weight management');
  if (/grain.free|grain free/.test(name)) pros.push('Grain-free formula');

  if (/corn|wheat|soy/.test(ingredients)) cons.push('Contains common allergens (corn/wheat/soy)');
  if (/by.product|bone meal/.test(ingredients)) cons.push('Contains meat by-products');
  if (protein > 0 && protein < 18) cons.push('Lower protein than premium alternatives');
  if (/grain.free|grain free/.test(name) && /pea|lentil|legume/.test(ingredients)) {
    cons.push('Grain-free with legumes (consult vet for cardiac health)');
  }

  return {
    pros: pros.length ? pros.join('. ') + '.' : 'Established brand with quality control.',
    cons: cons.length ? cons.join('. ') + '.' : 'Ingredient quality may vary by batch.',
  };
}

// ─── Transform raw API product → our Product interface ────────────────────────
function transformProduct(raw: any, petType: PetType, index: number): Product | null {
  const name = raw.product_name_en || raw.product_name || '';
  const brand = (raw.brands || '').split(',')[0].trim();

  // Try every possible ingredient field — some products only have regional language versions
  const ingredients: string =
    raw.ingredients_text_en ||
    raw.ingredients_text_with_allergens_en ||
    raw.ingredients_text ||
    raw.ingredients_text_with_allergens ||
    // Try language-specific fallbacks from the ingredients object
    (raw.ingredients_text_fr && raw.ingredients_text_fr.length > 0
      ? `(Translated from French) ${raw.ingredients_text_fr}`
      : '') ||
    '';

  // Filter out poor quality entries
  if (!name || name.length < 3) return null;
  if (!brand || brand.length < 2) return null;
  // Skip products with zero ingredients — they'd show 'Ingredients not listed'
  if (!ingredients || ingredients.trim().length < 5) return null;

  const nutriments = raw.nutriments || {};
  const proteinPct = Math.round((parseFloat(nutriments['proteins_100g'] || nutriments['proteins'] || '0') || 0) * 10) / 10;
  const fatPct = Math.round((parseFloat(nutriments['fat_100g'] || nutriments['fat'] || '0') || 0) * 10) / 10;
  const fiberPct = Math.round((parseFloat(nutriments['fiber_100g'] || nutriments['fiber'] || '0') || 0) * 10) / 10;

  const price = estimatePrice(brand);
  const lifeStage = inferLifeStage(petType, name);
  const healthTags = inferHealthTags(ingredients, name);
  const { pros, cons } = buildProsCons(raw);

  const imageUrl =
    raw.image_front_url ||
    raw.image_url ||
    (raw.selected_images?.front?.display as any)?.en ||
    (raw.selected_images?.front?.small as any)?.en ||
    '/images/placeholder.svg';

  const id = raw.id || raw.code || String(index);

  return {
    id: `opff_${petType}_${id.toString().slice(-8)}_${index}`,
    product_name: name.length > 80 ? name.slice(0, 77) + '…' : name,
    brand: brand.length > 40 ? brand.slice(0, 40) : brand,
    pet_type: petType,
    life_stage: lifeStage,
    ingredients: ingredients.slice(0, 300),
    protein_pct: proteinPct,
    fat_pct: fatPct,
    fiber_pct: fiberPct,
    health_tags: healthTags,
    pros,
    cons,
    price_monthly_low: price.low,
    price_monthly_high: price.high,
    image_url: imageUrl,
    buy_links: {
      amazon: buildAmazonLink(name, brand),
    },
    available_at: ['Amazon'],
    recall_history: false,
  };
}

// ─── Fetch from multiple search terms for better coverage ─────────────────────
async function fetchPage(searchTerm: string, pageSize: number): Promise<any[]> {
  const fields = 'id,code,product_name,product_name_en,brands,ingredients_text,ingredients_text_en,ingredients_text_with_allergens,ingredients_text_with_allergens_en,ingredients_text_fr,nutriments,image_front_url,image_url,selected_images';
  const url = `${BASE_URL}?search_terms=${encodeURIComponent(searchTerm)}&search_simple=1&action=process&json=1&page_size=${pageSize}&fields=${fields}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'LumoBites/1.0 (https://lumobites.vercel.app; contact@lumobites.com)',
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) throw new Error(`Open Pet Food Facts API error: ${res.status}`);
  const data = await res.json();
  return data.products || [];
}

// ─── Main fetch function ───────────────────────────────────────────────────────
export async function fetchPetFoodProducts(petType: PetType, pageSize = 50): Promise<Product[]> {
  // Use multiple search terms to maximize data richness
  const queries = petType === 'cat'
    ? ['cat food chicken', 'cat food salmon', 'kitten food', 'cat treats', 'wet cat food']
    : ['dog food chicken', 'dog food beef', 'puppy food', 'senior dog food', 'dog treats'];

  const perQuery = Math.ceil(pageSize / queries.length);

  // Fetch all queries in parallel
  const rawArrays = await Promise.allSettled(
    queries.map(q => fetchPage(q, perQuery))
  );

  const allRaw: any[] = [];
  const seenIds = new Set<string>();

  for (const result of rawArrays) {
    if (result.status === 'fulfilled') {
      for (const r of result.value) {
        const id = r.id || r.code;
        if (id && !seenIds.has(id)) {
          seenIds.add(id);
          allRaw.push(r);
        }
      }
    }
  }

  const products: Product[] = allRaw
    .map((raw, i) => transformProduct(raw, petType, i))
    .filter((p): p is Product => p !== null);

  return products;
}
