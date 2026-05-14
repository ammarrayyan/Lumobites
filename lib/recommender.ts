import { Product, PetProfile, ScoredProduct, HealthTag } from './types';
import { deriveLifeStage } from './parser';
import { ingredientDatabase, IngredientInfo } from './ingredients';

function getProductFoodType(product: Product): 'dry' | 'wet' | 'treats' | 'both' {
  const text = (product.product_name + ' ' + (product.categories || '') + ' ' + (product.ingredients || '') + ' ' + product.pros + ' ' + product.cons).toLowerCase();
  
  if (text.includes('treat') || text.includes('snack') || text.includes('chew') || text.includes('bone') || text.includes('lickable') || text.includes('biscuit') || text.includes('jerky') || text.includes('marrow') || text.includes('rewards')) return 'treats';
  
  if (text.includes('canned') || text.includes('wet') || text.includes('stew') || text.includes('pouch') || text.includes('pate') || text.includes('pâté') || text.includes('broth') || text.includes('gravy') || text.includes('moist') || text.includes('shredded') || text.includes('morsel') || text.includes('can ')) return 'wet';
  
  if (text.includes('kibble') || text.includes('dry') || text.includes('crunchy') || text.includes('baked') || text.includes('mixer')) return 'dry';
  
  return 'dry'; // default
}

// ─── Score a single product against a pet profile ─────────────────────────────
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

  score -= (questionableCount * 5);
  score -= (dangerousCount * 15);

  // 2. Named Meat Check (First 3 ingredients)
  const namedMeats = ['chicken', 'beef', 'salmon', 'turkey', 'lamb', 'duck', 'venison', 'pork'];
  const firstThree = ingredientList.slice(0, 3);
  const hasNamedMeatInTopThree = firstThree.some(ing => namedMeats.some(meat => ing.includes(meat) && !ing.includes('by-product') && !ing.includes('meal')));
  
  if (!hasNamedMeatInTopThree) score -= 10;

  // 3. Senior Dog Logic (7+ years)
  if (profile.age_years >= 7 && profile.pet_type === 'dog') {
    const grains = ['corn', 'wheat', 'soy', 'gluten', 'brewers rice'];
    const hasHighGrain = grains.some(g => ingredientList.slice(0, 5).some(ing => ing.includes(g)));
    if (hasHighGrain) score -= 10;
    
    // Bonus for Glucosamine/Chondroitin
    if (ingredientsText.includes('glucosamine') || ingredientsText.includes('chondroitin')) {
      score += 5;
    }
  }

  // 4. Budget vs Premium Pricing
  if (profile.budget_monthly_max < 40 && product.price_monthly_low > 60) {
    score -= 10;
  }

  // 5. Bonuses
  // First ingredient deboned named meat
  if (ingredientList[0] && ingredientList[0].includes('deboned') && namedMeats.some(meat => ingredientList[0].includes(meat))) {
    score += 5;
  }

  // Grain-free bonus for sensitive pets
  if (profile.health_issues.includes('allergies') || profile.health_issues.includes('sensitive_stomach')) {
    const grains = ['corn', 'wheat', 'soy', 'rice', 'barley', 'oats'];
    const isGrainFree = !grains.some(g => ingredientsText.includes(g));
    if (isGrainFree) score += 5;
  }

  // Matching health tags bonus (original logic kept but balanced)
  for (const tag of profile.health_issues) {
    if (product.health_tags.includes(tag as HealthTag)) score += 5;
  }

  return Math.max(40, Math.min(99, score));
}

// ─── Build "why recommended" tag ─────────────────────────────────────────────
function buildWhyTag(product: Product, profile: PetProfile): string {
  const name = profile.pet_name || (profile.pet_type === 'dog' ? 'your pup' : 'your cat');
  const benefit = product.pros?.split('.')[0] || (product.protein_pct > 32 ? 'High protein' : 'Balanced nutrition');

  return `${product.brand} ${product.product_name} — ${benefit.toLowerCase()} for ${name}`;
}

// ─── Check if product has avoided ingredients ────────────────────────────────
function hasAvoidedIngredients(product: Product, avoidText?: string): boolean {
  if (!avoidText) return false;
  const lower = avoidText.toLowerCase();
  const productIngredients = product.ingredients.toLowerCase();

  const avoidWords = lower.match(/\b(chicken|beef|fish|grain|corn|wheat|soy|dairy|egg|pork|lamb|turkey|potato|gluten|rice)\b/g) || [];
  return avoidWords.some(word => productIngredients.includes(word));
}

// ─── Main recommendation engine ───────────────────────────────────────────────
export function recommendProducts(
  products: Product[],
  profile: PetProfile
): { results: ScoredProduct[]; budgetRelaxed: boolean; fallback: boolean } {
  const lifeStage = deriveLifeStage(profile.pet_type, profile.age_years);
  const budget = profile.budget_monthly_max;

  // Base Pet Type and Life Stage pool
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
          score: match_pct, // Use match_pct as the sortable score
          match_pct,
          why_recommended: buildWhyTag(p, profile),
          budget_relaxed: p.price_monthly_low > budget,
        };
      })
      .filter(p => p.match_pct >= 40); // Cap minimum score at 40%

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
  
  // TIER 4: Keep pet type and food type only
  if (selected.length < 5) {
    tryAddFrom(getResults(basePool, 9999, false, true));
  }

  // TIER 5: Final fallback - ignore food type if needed
  if (selected.length < 5) {
    tryAddFrom(getResults(basePool, 9999, false, false));
  }

  const anyRelaxed = selected.some(p => p.price_monthly_low > budget);
  const anyFallback = selected.some(p => p.price_monthly_low > budget * 1.2);

  return {
    results: selected.slice(0, 5),
    budgetRelaxed: anyRelaxed,
    fallback: anyFallback,
  };
}
