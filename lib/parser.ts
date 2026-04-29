import { ParsedPetInfo, PetType, ActivityLevel, HealthTag } from './types';

// ─── Pet Type Detection ───────────────────────────────────────────────────────
const DOG_KEYWORDS = ['dog', 'pup', 'puppy', 'canine', 'hound', 'pooch', 'doggo', 'golden', 'labrador', 'retriever', 'shepherd', 'bulldog', 'poodle', 'beagle', 'husky', 'dachshund', 'chihuahua', 'rottweiler', 'yorkshire'];
const CAT_KEYWORDS = ['cat', 'kitten', 'kitty', 'feline', 'tabby', 'calico', 'siamese', 'persian', 'bengal', 'maine coon', 'ragdoll', 'sphynx', 'abyssinian'];

// ─── Health Issue Keywords ────────────────────────────────────────────────────
export const HEALTH_KEYWORD_MAP: Record<HealthTag, string[]> = {
  sensitive_stomach: ['sensitive stomach', 'upset stomach', 'digestive', 'digestion', 'vomit', 'diarrhea', 'gastrointestinal', 'gi issue', 'tummy', 'stomach issue', 'sensitive tummy'],
  anxiety: ['anxious', 'anxiety', 'stressed', 'stress', 'nervous', 'fearful', 'fear', 'separation', 'scared'],
  allergies: ['allerg', 'itchy', 'itching', 'skin issue', 'rash', 'food intolerance', 'intolerant', 'reaction'],
  weight_control: ['overweight', 'obese', 'weight', 'fat', 'chunky', 'chubby', 'diet', 'lose weight', 'weight loss', 'light'],
  picky_eater: ['picky', 'finicky', 'won\'t eat', 'refuses to eat', 'selective', 'choosy', 'fussy'],
  kidney: ['kidney', 'renal', 'urinary', 'bladder', 'ckd', 'chronic kidney'],
  joint: ['joint', 'arthritis', 'hip', 'mobility', 'limping', 'stiff', 'senior', 'older'],
};

// ─── Word to Number Helper ──────────────────────────────────────────────────────
export function wordToNumber(text: string): string {
  const words: Record<string, string> = {
    'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
    'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
    'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14',
    'fifteen': '15', 'sixteen': '16', 'seventeen': '17', 'eighteen': '18',
    'nineteen': '19', 'twenty': '20', 'thirty': '30', 'forty': '40', 'fifty': '50',
    'sixty': '60', 'seventy': '70', 'eighty': '80', 'ninety': '90', 'hundred': '100'
  };
  let processed = text.toLowerCase();
  for (const [word, num] of Object.entries(words)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    processed = processed.replace(regex, num);
  }
  return processed;
}

// ─── Activity Level Keywords ──────────────────────────────────────────────────
const ACTIVITY_HIGH = ['very active', 'high energy', 'athletic', 'runs', 'working dog', 'agility', 'hyperactive', 'energetic', 'active'];
const ACTIVITY_LOW = ['lazy', 'couch', 'sedentary', 'low energy', 'calm', 'indoor', 'laid back', 'not active', 'sleeps a lot'];

// ─── Budget Extraction ────────────────────────────────────────────────────────
export function extractBudget(text: string): number | undefined {
  const processed = wordToNumber(text);
  // Match patterns like "$40", "40 dollars", "40/mo", "40 a month", "budget of 40", "under 40"
  const patterns = [
    /\$\s*(\d+)\s*(?:\/mo|per month|a month|monthly)?/i,
    /(\d+)\s*(?:dollars?|bucks?)\s*(?:\/mo|per month|a month|monthly)?/i,
    /budget\s*(?:of|is|around|about|under)?\s*\$?\s*(\d+)/i,
    /under\s*\$?\s*(\d+)/i,
    /about\s*\$?\s*(\d+)\s*(?:\/mo|per month|a month|monthly)?/i,
    /spend\s*(?:about|around|up to|under)?\s*\$?\s*(\d+)/i,
    /(\d+)\s*(?:\/mo|per month|a month|monthly)/i,
    /^\s*\$?\s*(\d+)\s*$/i, // Catch exact numbers like "40" or "$40"
  ];

  for (const pattern of patterns) {
    const match = processed.match(pattern);
    if (match) {
      const val = parseInt(match[1]);
      if (val >= 5 && val <= 500) return val;
    }
  }
  return undefined;
}

// ─── Age Extraction ────────────────────────────────────────────────────────────
export function extractAge(text: string): { value: number, unit: 'years' | 'months' | 'unknown' } | undefined {
  const processed = wordToNumber(text);
  const patterns = [
    { regex: /(\d+(?:\.\d+)?)\s*(?:-\s*)?year(?:s)?(?:\s*old)?/i, unit: 'years' as const },
    { regex: /(\d+)\s*(?:-\s*)?yr(?:s)?(?:\s*old)?/i, unit: 'years' as const },
    { regex: /(\d+)\s*months?(?:\s*old)?/i, unit: 'months' as const },
    { regex: /age(?:d)?\s*(?:of|:)?\s*(\d+)/i, unit: 'years' as const },
    { regex: /^\s*(\d+(?:\.\d+)?)\s*$/i, unit: 'unknown' as const }, // standalone number
  ];

  for (const pattern of patterns) {
    const match = processed.match(pattern.regex);
    if (match) {
      let age = parseFloat(match[1]);
      return { value: age, unit: pattern.unit };
    }
  }
  return undefined;
}

// ─── Weight Extraction ────────────────────────────────────────────────────────
export function extractWeight(text: string): number | undefined {
  const processed = wordToNumber(text);
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?)/i,
    /(\d+(?:\.\d+)?)\s*(?:kgs?|kilograms?)/i,
    /weigh(?:s|t)?\s*(?:about|around|roughly)?\s*(\d+)/i,
    /^\s*(\d+(?:\.\d+)?)\s*$/i, // standalone number
  ];
  for (const pattern of patterns) {
    const match = processed.match(pattern);
    if (match) {
      let weight = parseFloat(match[1]);
      if (pattern.source.includes('kg')) weight = weight * 2.205;
      if (weight > 0 && weight < 300) return Math.round(weight);
    }
  }
  return undefined;
}

// ─── Pet Name Extraction ──────────────────────────────────────────────────────
export function extractPetName(text: string): string | undefined {
  const patterns = [
    /(?:my\s+(?:dog|cat|pet|pup|puppy|kitten|kitty)\s+is\s+named?|named?\s+|called\s+|name(?:\'s|\s+is)\s+)([A-Z][a-z]+)/,
    /([A-Z][a-z]+)\s+is\s+(?:my\s+)?(?:a\s+)?(?:\d+[\s-]year|the)/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1] && match[1].length > 1 && match[1].length < 20) {
      const name = match[1];
      // Filter out common non-name words
      const excluded = ['My', 'She', 'He', 'It', 'We', 'They', 'The', 'This', 'That', 'His', 'Her'];
      if (!excluded.includes(name)) return name;
    }
  }
  return undefined;
}

// ─── Avoid Ingredients Extraction ────────────────────────────────────────────
export function extractAvoidIngredients(text: string): string | undefined {
  const patterns = [
    /avoid(?:ing|s)?\s+([^.!?\n]+)/i,
    /no\s+(grain|chicken|beef|fish|corn|wheat|soy|dairy|egg|pork|lamb|turkey|potato|gluten)[^.!?\n]*/i,
    /(?:grain|chicken|beef|fish|corn|wheat|soy)\s*free/i,
    /allergic\s+to\s+([^.!?\n]+)/i,
    /can(?:\'t|not)\s+(?:have|eat|tolerate)\s+([^.!?\n]+)/i,
    /intolerant\s+to\s+([^.!?\n]+)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0].trim();
  }
  return undefined;
}

// ─── Main Parser ──────────────────────────────────────────────────────────────
export function parsePetInfo(text: string): ParsedPetInfo {
  const lower = text.toLowerCase();
  const result: ParsedPetInfo = {};

  // Pet type
  if (DOG_KEYWORDS.some(k => lower.includes(k))) result.pet_type = 'dog';
  else if (CAT_KEYWORDS.some(k => lower.includes(k))) result.pet_type = 'cat';

  // Age
  const ageRes = extractAge(text);
  if (ageRes !== undefined) {
    result.age_years = ageRes.unit === 'months' ? ageRes.value / 12 : ageRes.value;
  }

  // Weight
  const weight = extractWeight(text);
  if (weight !== undefined) result.weight_lbs = weight;

  // Pet name
  const name = extractPetName(text);
  if (name) result.pet_name = name;

  // Health issues
  const healthIssues: HealthTag[] = [];
  for (const [tag, keywords] of Object.entries(HEALTH_KEYWORD_MAP)) {
    if (keywords.some(k => lower.includes(k))) {
      healthIssues.push(tag as HealthTag);
    }
  }
  if (healthIssues.length > 0) result.health_issues = healthIssues;

  // Activity level
  if (ACTIVITY_HIGH.some(k => lower.includes(k))) result.activity_level = 'high';
  else if (ACTIVITY_LOW.some(k => lower.includes(k))) result.activity_level = 'low';
  else if (lower.includes('medium') || lower.includes('moderate')) result.activity_level = 'medium';

  // Budget
  const budget = extractBudget(text);
  if (budget !== undefined) result.budget_monthly_max = budget;

  // Avoid ingredients
  const avoid = extractAvoidIngredients(text);
  if (avoid) result.avoid_ingredients = avoid;

  return result;
}

// ─── Merge parsed info into existing state ────────────────────────────────────
export function mergeParsedInfo(existing: ParsedPetInfo, newInfo: ParsedPetInfo): ParsedPetInfo {
  const merged = { ...existing };
  if (newInfo.pet_name && !merged.pet_name) merged.pet_name = newInfo.pet_name;
  if (newInfo.pet_type && !merged.pet_type) merged.pet_type = newInfo.pet_type;
  if (newInfo.age_years !== undefined && merged.age_years === undefined) merged.age_years = newInfo.age_years;
  if (newInfo.weight_lbs !== undefined && merged.weight_lbs === undefined) merged.weight_lbs = newInfo.weight_lbs;
  if (newInfo.breed && !merged.breed) merged.breed = newInfo.breed;
  if (newInfo.health_issues?.length) {
    const combined = [...(merged.health_issues || []), ...newInfo.health_issues];
    merged.health_issues = [...new Set(combined)] as HealthTag[];
  }
  if (newInfo.activity_level && !merged.activity_level) merged.activity_level = newInfo.activity_level;
  if (newInfo.budget_monthly_max !== undefined && merged.budget_monthly_max === undefined) merged.budget_monthly_max = newInfo.budget_monthly_max;
  if (newInfo.avoid_ingredients && !merged.avoid_ingredients) merged.avoid_ingredients = newInfo.avoid_ingredients;
  return merged;
}

// ─── Determine what's still missing ──────────────────────────────────────────
export function getMissingFields(info: ParsedPetInfo): string[] {
  const missing: string[] = [];
  if (!info.pet_type) missing.push('pet_type');
  if (info.age_years === undefined) missing.push('age_years');
  if (info.budget_monthly_max === undefined) missing.push('budget_monthly_max');
  return missing;
}

// ─── Generate follow-up question ─────────────────────────────────────────────
export function getNextQuestion(info: ParsedPetInfo, petName?: string): string | null {
  const name = petName || info.pet_name || 'your pet';

  if (!info.pet_type) {
    return `What kind of pet do you have — a dog or a cat? 🐾`;
  }
  if (info.age_years === undefined) {
    const petWord = info.pet_type === 'dog' ? 'pup' : 'kitty';
    return `How old is ${name}? (e.g. "3 years old" or "8 months")`;
  }
  if (info.budget_monthly_max === undefined) {
    return `What's your monthly budget for ${name}'s food? (e.g. "$40/mo" or "around $60")`;
  }
  return null;
}

// ─── Generate completion message ─────────────────────────────────────────────
export function buildCompletionMessage(info: ParsedPetInfo): string {
  const name = info.pet_name || (info.pet_type === 'dog' ? 'your pup' : 'your cat');
  const petWord = info.pet_type === 'dog' ? 'dog' : 'cat';
  const ageStr = info.age_years !== undefined
    ? (info.age_years < 1 ? `${Math.round(info.age_years * 12)}-month-old` : `${info.age_years}-year-old`)
    : '';
  const healthStr = info.health_issues?.length
    ? ` with ${info.health_issues.map(h => h.replace('_', ' ')).join(' and ')}`
    : '';

  return `Got it! I'm finding the best food for ${name} — a ${ageStr} ${petWord}${healthStr}, with a budget of $${info.budget_monthly_max}/mo. Finding your top matches now... 🐾`;
}

// ─── Derive life stage ────────────────────────────────────────────────────────
export function deriveLifeStage(petType: PetType, ageYears: number): 'kitten' | 'puppy' | 'adult' | 'senior' {
  if (ageYears < 1) return petType === 'dog' ? 'puppy' : 'kitten';
  if (ageYears >= 7) return 'senior';
  return 'adult';
}
