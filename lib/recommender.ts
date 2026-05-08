import { Product, PetProfile, ScoredProduct, HealthTag } from './types';
import { deriveLifeStage } from './parser';

function getProductFoodType(product: Product): 'dry' | 'wet' | 'treats' | 'both' {
  const text = (product.product_name + ' ' + product.pros + ' ' + product.cons).toLowerCase();
  if (text.includes('treat') || text.includes('snack') || text.includes('chew') || text.includes('bone') || text.includes('lickable')) return 'treats';
  if (text.includes('canned') || text.includes('wet') || text.includes('stew') || text.includes('pouch') || text.includes('pate') || text.includes('pâté') || text.includes('broth') || text.includes('gravy')) return 'wet';
  if (text.includes('kibble') || text.includes('dry')) return 'dry';
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

  if (matchingTags.length > 0) {
    const tagLabel = matchingTags[0].replace('_', ' ');
    return `Great for ${tagLabel} under $${product.price_monthly_high}/mo`;
  }
  if (product.protein_pct > 32) {
    return `High protein formula for ${name}`;
  }
  if (product.price_monthly_low <= 30) {
    return `Budget-friendly pick under $${product.price_monthly_high}/mo`;
  }
  return `Well-rounded nutrition for ${name}`;
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
  profile: PetProfile,
  relaxBudget = false
): { results: ScoredProduct[]; budgetRelaxed: boolean; fallback: boolean } {
  const lifeStage = deriveLifeStage(profile.pet_type, profile.age_years);
  const budget = relaxBudget
    ? Math.round(profile.budget_monthly_max * 1.2)
    : profile.budget_monthly_max;

  // Step 1 & 2: Filter by pet type and life stage
  let filtered = products.filter(p => p.pet_type === profile.pet_type && p.life_stage === lifeStage);
  
  // If we have very few results for a specific life stage (like senior), include 'adult' foods as a fallback
  if (filtered.length < 5 && lifeStage !== 'adult') {
    const adultFoods = products.filter(p => p.pet_type === profile.pet_type && p.life_stage === 'adult');
    filtered = [...filtered, ...adultFoods];
  }

  // Step 2.5: Strictly filter by food type if requested
  if (profile.food_type && profile.food_type !== 'both') {
    const typeFiltered = filtered.filter(p => getProductFoodType(p) === profile.food_type);
    // Only apply strict filter if it leaves us with at least 3 products to show
    if (typeFiltered.length >= 3) {
      filtered = typeFiltered;
    }
  }

  // Step 3: Filter by budget
  let budgetFiltered = filtered.filter(p => p.price_monthly_low <= budget);

  // Step 4: Filter out avoided ingredients
  budgetFiltered = budgetFiltered.filter(p => !hasAvoidedIngredients(p, profile.avoid_ingredients));

  // Step 5: Score remaining
  const scored: ScoredProduct[] = budgetFiltered.map(p => {
    const score = scoreProduct(p, profile);
    let maxScore = profile.health_issues.length * 20 + 20; // base max
    if (profile.food_type && profile.food_type !== 'both') maxScore += 30;
    if (profile.budget_monthly_max >= 80) maxScore += 20;
    else if (profile.budget_monthly_max >= 50) maxScore += 15;
    
    const normalizedMax = Math.max(maxScore, 30);
    const match_pct = Math.min(99, Math.round(50 + (score / normalizedMax) * 49));
    return {
      ...p,
      score,
      match_pct,
      why_recommended: buildWhyTag(p, profile),
      budget_relaxed: relaxBudget,
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Return top 5
  if (scored.length >= 3) {
    return { results: scored.slice(0, 5), budgetRelaxed: relaxBudget, fallback: false };
  }

  // Step 7: Fewer than 3 — relax budget by 20% and retry
  if (!relaxBudget) {
    return recommendProducts(products, profile, true);
  }

  // Step 8: Still 0 — return top 3 highest scored ignoring budget
  const allScored: ScoredProduct[] = filtered
    .filter(p => !hasAvoidedIngredients(p, profile.avoid_ingredients))
    .map(p => {
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
        budget_relaxed: true,
      };
    });

  allScored.sort((a, b) => b.score - a.score);

  return {
    results: allScored.slice(0, 3),
    budgetRelaxed: true,
    fallback: true,
  };
}
