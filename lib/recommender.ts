import { Product, PetProfile, ScoredProduct, HealthTag } from './types';
import { deriveLifeStage } from './parser';

function getProductFoodType(product: Product): 'dry' | 'wet' | 'both' {
  const text = (product.product_name + ' ' + product.pros + ' ' + product.cons).toLowerCase();
  if (text.includes('canned') || text.includes('wet')) return 'wet';
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

  // Step 1: Filter by pet type
  let filtered = products.filter(p => p.pet_type === profile.pet_type);

  // Step 2: Filter by life stage
  filtered = filtered.filter(p => p.life_stage === lifeStage);

  // Step 3: Filter by budget
  let budgetFiltered = filtered.filter(p => p.price_monthly_low <= budget);

  // Step 4: Filter out avoided ingredients
  budgetFiltered = budgetFiltered.filter(p => !hasAvoidedIngredients(p, profile.avoid_ingredients));

  // Step 5: Score remaining
  const scored: ScoredProduct[] = budgetFiltered.map(p => {
    const score = scoreProduct(p, profile);
    let maxScore = profile.health_issues.length * 20 + 20; // max possible
    if (profile.food_type && profile.food_type !== 'both') maxScore += 30;
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
