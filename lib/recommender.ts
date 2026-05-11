import { Product, PetProfile, ScoredProduct, HealthTag } from './types';
import { deriveLifeStage } from './parser';

function getProductFoodType(product: Product): 'dry' | 'wet' | 'treats' | 'both' {
  const text = (product.product_name + ' ' + (product.categories || '') + ' ' + (product.ingredients || '') + ' ' + product.pros + ' ' + product.cons).toLowerCase();
  
  if (text.includes('treat') || text.includes('snack') || text.includes('chew') || text.includes('bone') || text.includes('lickable') || text.includes('biscuit') || text.includes('jerky')) return 'treats';
  
  if (text.includes('canned') || text.includes('wet') || text.includes('stew') || text.includes('pouch') || text.includes('pate') || text.includes('pâté') || text.includes('broth') || text.includes('gravy') || text.includes('moist') || text.includes('shredded') || text.includes('morsel')) return 'wet';
  
  if (text.includes('kibble') || text.includes('dry') || text.includes('crunchy') || text.includes('baked')) return 'dry';
  
  return 'dry'; // default
}

// ─── Score a single product against a pet profile ─────────────────────────────
function scoreProduct(product: Product, profile: PetProfile): number {
  let score = 0;

  // +20 per matching health tag
  for (const tag of profile.health_issues) {
    if (product.health_tags.includes(tag as HealthTag)) score += 20;
  }

  // +30 if food type matches (or if user selected both)
  if (profile.food_type && profile.food_type !== 'both') {
    const productFoodType = getProductFoodType(product);
    if (productFoodType === profile.food_type) {
      score += 30;
    }
  }

  // +10 if protein > 28%
  if (product.protein_pct > 28) score += 10;

  // +10 if no recall history
  if (!product.recall_history) score += 10;

  // Budget-based Quality Boost: Prioritize premium items if user has a high budget
  if (profile.budget_monthly_max >= 80) {
    if (product.price_monthly_low >= 70) score += 20;
    else if (product.price_monthly_low >= 40) score += 10;
  } else if (profile.budget_monthly_max >= 50) {
    if (product.price_monthly_low >= 40) score += 15;
  }

  return score;
}

// ─── Build "why recommended" tag ─────────────────────────────────────────────
function buildWhyTag(product: Product, profile: PetProfile): string {
  const name = profile.pet_name || (profile.pet_type === 'dog' ? 'your pup' : 'your cat');
  const matchingTags = profile.health_issues.filter(t => product.health_tags.includes(t as HealthTag));
  const benefit = product.pros?.split('.')[0] || (product.protein_pct > 32 ? 'High protein' : 'Balanced nutrition');

  if (matchingTags.length > 0) {
    const tagLabel = matchingTags[0].replace('_', ' ');
    return `${product.brand} ${product.product_name} — ${benefit.toLowerCase()}, great for ${tagLabel}`;
  }
  
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

  // Step 1: Filter by pet type and life stage (include adult if senior/puppy/kitten pool is small)
  let filtered = products.filter(p => p.pet_type === profile.pet_type && p.life_stage === lifeStage);
  if (filtered.length < 10 && lifeStage !== 'adult') {
    const adultFoods = products.filter(p => p.pet_type === profile.pet_type && p.life_stage === 'adult');
    filtered = [...filtered, ...adultFoods];
  }

  // Step 2: Filter out avoided ingredients
  filtered = filtered.filter(p => !hasAvoidedIngredients(p, profile.avoid_ingredients));

  // Step 3: Filter by food type if requested (STRICT)
  let pool = filtered;
  if (profile.food_type && profile.food_type !== 'both') {
    pool = filtered.filter(p => getProductFoodType(p) === profile.food_type);
  }

  // Step 4: Score all products in the pool
  const allScored: ScoredProduct[] = pool.map(p => {
    const score = scoreProduct(p, profile);
    let maxScoreCalc = profile.health_issues.length * 20 + 20;
    if (profile.food_type && profile.food_type !== 'both') maxScoreCalc += 30;
    if (profile.budget_monthly_max >= 80) maxScoreCalc += 20;
    else if (profile.budget_monthly_max >= 50) maxScoreCalc += 15;

    const maxScore = Math.max(maxScoreCalc, 30);
    const match_pct = Math.min(99, Math.round(50 + (score / maxScore) * 49));
    return {
      ...p,
      score,
      match_pct,
      why_recommended: buildWhyTag(p, profile),
      budget_relaxed: p.price_monthly_low > budget,
    };
  });

  // Sort by score descending
  allScored.sort((a, b) => b.score - a.score);

  // Step 5: Selection with Budget Priority and Diversity
  const selected: ScoredProduct[] = [];
  const brandCounts: Record<string, number> = {};

  function tryAdd(p: ScoredProduct) {
    const brand = (p.brand || 'unknown').toLowerCase().trim();
    if ((brandCounts[brand] || 0) < 2) {
      selected.push(p);
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;
      return true;
    }
    return false;
  }

  // 5a. Within budget (strict)
  const withinBudget = allScored.filter(p => p.price_monthly_low <= budget);
  for (const p of withinBudget) {
    if (tryAdd(p)) {
      if (selected.length >= 5) break;
    }
  }

  // 5b. Slightly over budget (up to 20%)
  if (selected.length < 5) {
    const slightlyOver = allScored.filter(p => p.price_monthly_low > budget && p.price_monthly_low <= budget * 1.2);
    for (const p of slightlyOver) {
      if (!selected.find(s => s.id === p.id)) {
        if (tryAdd(p)) {
          if (selected.length >= 5) break;
        }
      }
    }
  }

  // 5c. Anything else (fallback) if we still don't have 5
  if (selected.length < 5) {
    for (const p of allScored) {
      if (!selected.find(s => s.id === p.id)) {
        if (tryAdd(p)) {
          if (selected.length >= 5) break;
        }
      }
    }
  }

  // Final check: if still under 5, just add whatever is left ignoring diversity
  if (selected.length < 5) {
    for (const p of allScored) {
      if (!selected.find(s => s.id === p.id)) {
        selected.push(p);
        if (selected.length >= 5) break;
      }
    }
  }

  const anyRelaxed = selected.some(p => p.price_monthly_low > budget);
  const anyFallback = selected.some(p => p.price_monthly_low > budget * 1.2);

  return {
    results: selected.slice(0, 5),
    budgetRelaxed: anyRelaxed,
    fallback: anyFallback,
  };
}
