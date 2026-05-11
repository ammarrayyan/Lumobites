import { Product, HealthTag, LifeStage, PetType, FoodType } from './types';

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
function buildAmazonLink(productName: string, brand: string, petType: PetType): string {
  const query = encodeURIComponent(`${brand} ${productName} ${petType} food`);
  return `https://www.amazon.com/s?k=${query}&tag=${AFFILIATE_TAG}`;
}

// ─── Infer ingredients from product name if missing ───────────────────────────
function inferIngredientsFromName(name: string, petType: PetType): string {
  const n = name.toLowerCase();
  const meats = [];
  const grains = [];
  
  if (n.includes('chicken')) meats.push('Chicken');
  if (n.includes('beef')) meats.push('Beef');
  if (n.includes('turkey')) meats.push('Turkey');
  if (n.includes('salmon')) meats.push('Salmon');
  if (n.includes('lamb')) meats.push('Lamb');
  if (n.includes('duck')) meats.push('Duck');
  if (n.includes('pork')) meats.push('Pork');
  if (n.includes('ocean fish') || n.includes('whitefish')) meats.push('Whitefish');
  
  if (n.includes('rice')) grains.push('Brown Rice');
  if (n.includes('sweet potato')) grains.push('Sweet Potatoes');
  if (n.includes('pea')) grains.push('Peas');
  if (n.includes('oat')) grains.push('Oatmeal');
  if (n.includes('barley')) grains.push('Barley');
  if (n.includes('corn')) grains.push('Whole Grain Corn');
  
  // If no meats found, default to a generic protein
  if (meats.length === 0) meats.push(petType === 'cat' ? 'Chicken' : 'Beef');
  
  // If no grains found, default to rice or peas
  if (grains.length === 0) grains.push(n.includes('grain free') || n.includes('grain-free') ? 'Peas' : 'Brown Rice');
  
  // Determine if it's wet food from name
  const isWet = n.includes('pouch') || n.includes('canned') || n.includes('stew') || n.includes('pate') || n.includes('wet') || n.includes('broth') || n.includes('gravy');
  
  const base = isWet ? 'Meat Broth' : 'Chicken Meal';
  const fat = isWet ? 'Sunflower Oil' : 'Chicken Fat';
  
  return `${meats.join(', ')}, ${base}, ${grains.join(', ')}, ${fat}, Natural Flavors, Essential Vitamins & Minerals. (Estimated from product name)`;
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

// ─── Language & Region Helpers ───────────────────────────────────────────────
export function isEnglishProduct(name: string): boolean {
  // Reject non-English product names (contain accented/non-Latin characters)
  const nonEnglishPattern = /[\u00C0-\u024F\u0400-\u04FF\u4E00-\u9FFF\u3040-\u30FF\u0600-\u06FF]/;
  if (nonEnglishPattern.test(name)) return false;

  // Reject common non-English pet food terms
  const foreignWordPattern = /\b(pour|chien|chat|chats|chiens|avec|sans|nourriture|adulte|junior|croquettes|pâtée|patée|für|hund|katze|hundefutter|katzenfutter|perro|gato|para|alimento|comida|pienso|hundefoder|kattmat)\b/i;
  if (foreignWordPattern.test(name)) return false;

  return true;
}

// ─── Transform raw API product → our Product interface ────────────────────────
function transformProduct(raw: any, petType: PetType, index: number, isBarcodeLookup = false): Product | null {
  const name = raw.product_name_en || raw.product_name || 'Unknown Product';
  const brand = (raw.brands || '').split(',')[0].trim();

  // Try only English ingredients
  const ingredients: string =
    raw.ingredients_text_en ||
    raw.ingredients_text_with_allergens_en ||
    raw.ingredients_text ||
    raw.ingredients_text_with_allergens ||
    '';

  // Filter out poor quality entries
  if (!name || name.length < 3) return null;
  if (!brand || brand.length < 2) return null;

  // ── US & English filters ────────────────────────────────────────────────────
  if (!isBarcodeLookup) {
    if (!isEnglishProduct(name)) return null;

    // Require product to be sold in the US
    const countries: string[] = raw.countries_tags || [];
    const soldInUS = countries.length === 0 || countries.some((c: string) =>
      c === 'en:united-states' || c === 'en:us' || c === 'united-states'
    );
    if (!soldInUS) return null;
  }

  const nutriments = raw.nutriments || {};
  const proteinVal = nutriments['proteins_100g'] || nutriments['proteins'];
  const fatVal = nutriments['fat_100g'] || nutriments['fat'];
  
  // Stricter requirement: Must have at least protein OR fat to be considered a valid product record
  if (!proteinVal && !fatVal && !isBarcodeLookup) return null;

  const proteinPct = Math.round((parseFloat(proteinVal || '0') || 0) * 10) / 10;
  const fatPct = Math.round((parseFloat(fatVal || '0') || 0) * 10) / 10;
  const fiberPct = Math.round((parseFloat(nutriments['fiber_100g'] || nutriments['fiber'] || '0') || 0) * 10) / 10;

  const price = isBarcodeLookup ? { low: 0, high: 0 } : estimatePrice(brand);
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

  // Fallback for ingredients if empty
  const finalIngredients = ingredients.trim().length > 4 
    ? ingredients.slice(0, 300) 
    : inferIngredientsFromName(name, petType);

  return {
    id: `opff_${petType}_${id.toString().slice(-8)}_${index}`,
    product_name: name.length > 80 ? name.slice(0, 77) + '…' : name,
    brand: brand.length > 40 ? brand.slice(0, 40) : brand,
    pet_type: petType,
    life_stage: lifeStage,
    ingredients: finalIngredients,
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
      amazon: buildAmazonLink(name, brand, petType),
    },
    available_at: ['Amazon'],
    recall_history: false,
    categories: raw.categories || '',
  };
}

// ─── Fetch from multiple search terms for better coverage ─────────────────────
async function fetchPage(searchTerm: string, pageSize: number): Promise<any[]> {
  const fields = 'id,code,product_name,product_name_en,brands,ingredients_text,ingredients_text_en,ingredients_text_with_allergens,ingredients_text_with_allergens_en,countries_tags,nutriments,image_front_url,image_url,selected_images';
  // Filter to US products with English language
  const url = `${BASE_URL}?search_terms=${encodeURIComponent(searchTerm)}&search_simple=1&action=process&json=1&page_size=${pageSize}&fields=${fields}&countries_tags=en:united-states&lc=en`;

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
export async function fetchPetFoodProducts(petType: PetType, pageSize = 50, foodType?: FoodType): Promise<Product[]> {
  // We use specific, diverse brand searches instead of generic "dog food chicken" to guarantee variety
  const topDogBrands = ['Purina', "Hill's", 'Blue Buffalo', 'Wellness', 'Orijen', 'Taste of the Wild', 'Merrick', 'Canidae', 'Nutro', 'Iams', 'Pedigree', 'Victor', 'Diamond'];
  const topCatBrands = ['Purina', "Hill's", 'Fancy Feast', 'Friskies', 'Wellness', 'Tiki Cat', 'Orijen', 'Weruva', 'Blue Buffalo', 'Iams', 'Meow Mix', '9Lives'];
  
  const pool = petType === 'cat' ? topCatBrands : topDogBrands;
  
  // Randomly pick 4-5 brands to fetch for this specific request to ensure varied results every time
  const shuffled = pool.sort(() => 0.5 - Math.random());
  const selectedBrands = shuffled.slice(0, 5);
  
  // Refine query based on food type
  const typeStr = foodType === 'treats' ? 'treats' : 
                 foodType === 'wet' ? 'wet food' :
                 foodType === 'dry' ? 'dry food' : 'food';

  const queries = selectedBrands.map(brand => `${brand} ${petType} ${typeStr}`);

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

// ─── Fetch by Barcode ──────────────────────────────────────────────────────────
export async function fetchProductByBarcode(barcode: string): Promise<Product | null> {
  try {
    const res = await fetch(`https://world.openpetfoodfacts.org/api/v0/product/${barcode}.json`);
    if (!res.ok) return null;
    
    const data = await res.json();
    if (!data.product) return null;

    // Infer pet type from product data
    const raw = data.product;
    const searchStr = (raw.product_name + ' ' + (raw.categories || '')).toLowerCase();
    const petType: PetType = searchStr.includes('cat') ? 'cat' : 'dog';
    
    return transformProduct(raw, petType, 0, true);
  } catch (err) {
    console.error('Barcode fetch error:', err);
    return null;
  }
}
