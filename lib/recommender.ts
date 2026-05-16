import { Product, PetProfile, ScoredProduct, HealthTag } from './types';
import { deriveLifeStage } from './parser';
import { ingredientDatabase, IngredientInfo } from './ingredients';

function getProductFoodType(product: Product): 'dry' | 'wet' | 'treats' | 'both' {
  // Check the product's own food_type field first (set from Open Pet Food Facts)
  if (product.food_type === 'wet') return 'wet';
  if (product.food_type === 'dry') return 'dry';
  if (product.food_type === 'treats') return 'treats';

  // Fall back to keyword detection from product text
  const text = (
    product.product_name + ' ' +
    (product.categories || '') + ' ' +
    (product.ingredients || '') + ' ' +
    (product.pros || '') + ' ' +
    (product.cons || '')
  ).toLowerCase();

  if (
    text.includes('treat') || text.includes('snack') || text.includes('chew') ||
    text.includes('bone') || text.includes('lickable') || text.includes('biscuit') ||
    text.includes('jerky') || text.includes('marrow') || text.includes('rewards')
  ) return 'treats';

  if (
    text.includes('canned') || text.includes('wet food') || text.includes('stew') ||
    text.includes('pouch') || text.includes('pate') || text.includes('pâté') ||
    text.includes('broth') || text.includes('gravy') || text.includes('moist') ||
    text.includes('shredded') || text.includes('morsel') || text.includes('in jelly') ||
    text.includes('in gravy') || text.includes('loaf') || text.includes('minced') ||
    text.includes('mousse') || text.includes('terrine') || text.includes('chunks in')
  ) return 'wet';

  if (
    text.includes('kibble') || text.includes('dry food') || text.includes('crunchy') ||
    text.includes('baked') || text.includes('mixer') || text.includes('extruded')
  ) return 'dry';

  return 'dry'; // safe default
}


// Score a single product against a pet profile
function calculateMatchScore(product: Product, profile: PetProfile): number {
  let score = 100;

  const ingredientsText = (product.ingredients || '').toLowerCase();
  const ingredientList = ingredientsText.split(',').map(i => i.trim());

  // 1. Deductions for Ingredient Quality
  let questionableCount = 0;
  let dangerousCount = 0;

  ingredientDatabase.forEach(dbItem => {
    const dbName = dbItem.name.toLowerCase();
    const regex = dbName.length <= 3 ? new RegExp(`\\b${dbName}\\b`, 'i') : null;

    const isMatch = regex ? regex.test(ingredientsText) : ingredientsText.includes(dbName);

    if (isMatch) {
      if (dbItem.category === 'dangerous') dangerousCount++;
      if (dbItem.category === 'questionable') questionableCount++;
    }
  });

  // -5% per questionable ingredient, -15% per dangerous ingredient
  score -= (questionableCount * 5);
  score -= (dangerousCount * 15);

  // 2. Named Meat Check (First 3 ingredients)
  // Named meat = whole named meat only (no by-product, no meal)
  const namedMeats = ['chicken', 'beef', 'salmon', 'turkey', 'lamb', 'duck', 'venison', 'pork'];
  const firstThree = ingredientList.slice(0, 3);
  const hasNamedMeatInTopThree = firstThree.some(ing =>
    namedMeats.some(meat => ing.includes(meat) && !ing.includes('by-product') && !ing.includes('meal'))
  );

  if (!hasNamedMeatInTopThree) score -= 10;

  // 3. Senior Dog Logic (7+ years) — high corn/grain content deduction
  if (profile.age_years >= 7 && profile.pet_type === 'dog') {
    const grains = ['corn', 'wheat', 'soy', 'gluten', 'brewers rice'];
    const hasHighGrain = grains.some(g => ingredientList.slice(0, 5).some(ing => ing.includes(g)));
    if (hasHighGrain) score -= 10;

    // Bonus for joint support
    if (ingredientsText.includes('glucosamine') || ingredientsText.includes('chondroitin')) {
      score += 5;
    }
  }

  // 4. Budget vs Premium Pricing
  if (profile.budget_monthly_max < 40 && product.price_monthly_low > 60) {
    score -= 10;
  }

  // 5. Bonuses
  // First ingredient is deboned named meat
  if (ingredientList[0] && ingredientList[0].includes('deboned') && namedMeats.some(meat => ingredientList[0].includes(meat))) {
    score += 5;
  }

  // Grain-free bonus for sensitive pets
  if (profile.health_issues.includes('allergies') || profile.health_issues.includes('sensitive_stomach')) {
    const grains = ['corn', 'wheat', 'soy', 'rice', 'barley', 'oats'];
    const isGrainFree = !grains.some(g => ingredientsText.includes(g));
    if (isGrainFree) score += 5;
  }

  // Health tag match bonus
  for (const tag of profile.health_issues) {
    if (product.health_tags.includes(tag as HealthTag)) score += 5;
  }

  // Cap between 40 and 99
  return Math.max(40, Math.min(99, score));
}

// Build "why recommended" tag
function buildWhyTag(product: Product, profile: PetProfile): string {
  const name = profile.pet_name || (profile.pet_type === 'dog' ? 'your pup' : 'your cat');
  const benefit = product.pros?.split('.')[0] || (product.protein_pct > 32 ? 'High protein' : 'Balanced nutrition');
  return `${product.brand} ${product.product_name} - ${benefit.toLowerCase()} for ${name}`;
}

// Check if product has avoided ingredients
function hasAvoidedIngredients(product: Product, avoidText?: string): boolean {
  if (!avoidText) return false;
  const lower = avoidText.toLowerCase();
  const productIngredients = product.ingredients.toLowerCase();
  const avoidWords = lower.match(/\b(chicken|beef|fish|grain|corn|wheat|soy|dairy|egg|pork|lamb|turkey|potato|gluten|rice)\b/g) || [];
  return avoidWords.some(word => productIngredients.includes(word));
}

// Main recommendation engine
export function recommendProducts(
  products: Product[],
  profile: PetProfile
): { results: ScoredProduct[]; budgetRelaxed: boolean; fallback: boolean } {
  const lifeStage = deriveLifeStage(profile.pet_type, profile.age_years);
  const budget = profile.budget_monthly_max;

  // Base pool: pet type + life stage
  let basePool = products.filter(p => p.pet_type === profile.pet_type && p.life_stage === lifeStage);
  if (basePool.length < 10 && lifeStage !== 'adult') {
    basePool = [...basePool, ...products.filter(p => p.pet_type === profile.pet_type && p.life_stage === 'adult')];
  }
  basePool = basePool.filter(p => !hasAvoidedIngredients(p, profile.avoid_ingredients));

  const getResults = (pool: Product[], currentBudget: number, strictHealth: boolean, strictFoodType: boolean) => {
    let filtered = pool;

    if (strictFoodType && profile.food_type && profile.food_type !== 'both') {
      filtered = filtered.filter(p => getProductFoodType(p) === profile.food_type);
    }

    if (strictHealth && profile.health_issues.length > 0) {
      filtered = filtered.filter(p => profile.health_issues.some(tag => p.health_tags.includes(tag as HealthTag)));
    }

    const scored: ScoredProduct[] = filtered
      .map(p => {
        const match_pct = calculateMatchScore(p, profile);
        return {
          ...p,
          score: match_pct,
          match_pct,
          why_recommended: buildWhyTag(p, profile),
          budget_relaxed: p.price_monthly_low > budget,
        };
      })
      .filter(p => p.match_pct >= 40);

    return scored
      .filter(p => p.price_monthly_low <= currentBudget)
      .sort((a, b) => b.score - a.score);
  };

  const selected: ScoredProduct[] = [];
  const brandCounts: Record<string, number> = {};

  function tryAddFrom(pool: ScoredProduct[]) {
    for (const p of pool) {
      if (selected.find(s => s.id === p.id)) continue;
      const brand = (p.brand || 'unknown').toLowerCase().trim();
      if ((brandCounts[brand] || 0) < 2) {
        selected.push(p);
        brandCounts[brand] = (brandCounts[brand] || 0) + 1;
        if (selected.length >= 5) return true;
      }
    }
    return false;
  }

  // If user explicitly chose a food type (not 'both'), food type is a HARD constraint — never relax it.
  const foodTypeIsHard = profile.food_type && profile.food_type !== 'both';

  // TIER 1: Exact match (pet type + food type + budget + health issues)
  tryAddFrom(getResults(basePool, budget, true, true));

  // TIER 2: Relax budget by 20%
  if (selected.length < 5) {
    tryAddFrom(getResults(basePool, budget * 1.2, true, true));
  }

  // TIER 3: Relax health issues filter
  if (selected.length < 5) {
    tryAddFrom(getResults(basePool, budget * 1.2, false, true));
  }

  // TIER 4: Relax budget completely — keep food type if hard constraint
  if (selected.length < 5) {
    tryAddFrom(getResults(basePool, 9999, false, true));
  }

  // TIER 5: Ignore food type ONLY if user said 'both' or didn't specify
  if (selected.length < 5 && !foodTypeIsHard) {
    tryAddFrom(getResults(basePool, 9999, false, false));
  }

  // TIER 6: Full pet-type pool, ignore life stage — still respect food type if hard constraint
  if (selected.length < 5) {
    const fullPool = products.filter(p => p.pet_type === profile.pet_type);
    tryAddFrom(getResults(fullPool, 9999, false, foodTypeIsHard ? true : false));
  }

  // TIER 7: Absolute last resort — full pool, ignore everything (only if food type is NOT hard)
  if (selected.length < 5 && !foodTypeIsHard) {
    const fullPool = products.filter(p => p.pet_type === profile.pet_type);
    tryAddFrom(getResults(fullPool, 9999, false, false));
  }

  const anyRelaxed = selected.some(p => p.price_monthly_low > budget);
  const anyFallback = selected.some(p => p.price_monthly_low > budget * 1.2);

  return {
    results: selected.slice(0, 5),
    budgetRelaxed: anyRelaxed,
    fallback: anyFallback,
  };
}

