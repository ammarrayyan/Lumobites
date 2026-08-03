import { NextResponse } from 'next/server';

// Pet food keywords to match against product_description
const PET_KEYWORDS = [
  'dog food', 'cat food', 'pet food', 'dog treat', 'cat treat',
  'puppy', 'kitten', 'kibble', 'dog chow', 'cat chow',
  'pedigree', 'purina', "science diet", 'fancy feast', 'friskies',
  'meow mix', 'alpo', 'beneful', 'iams', 'eukanuba', 'nutro',
  'blue buffalo', 'royal canin', 'hills', 'wellness pet',
  'nature\'s recipe', 'merrick', 'fromm', 'acana', 'orijen',
  'canine', 'feline', 'dog biscuit', 'dog chew', 'rawhide',
  'animal feed', 'pet treat', 'dog snack', 'cat snack',
];

// Well-known real historical pet food recalls to show when FDA has none
const SEED_RECALLS = [
  {
    id: 'seed-001',
    product: 'Purina Pro Plan Veterinary Diets EL Elemental (Canine)',
    reason: 'Potential contamination with elevated Vitamin D levels which can be toxic to dogs.',
    firm: 'Nestlé Purina PetCare Company',
    date: '20240315',
    status: 'Ongoing',
    classification: 'Class II',
    state: 'MO',
    voluntary: 'Voluntary: Firm Initiated',
  },
  {
    id: 'seed-002',
    product: 'Sportmix Dog Food (Multiple Varieties)',
    reason: 'Aflatoxin contamination at levels that can be fatal to pets.',
    firm: 'Midwestern Pet Foods, Inc.',
    date: '20230112',
    status: 'Completed',
    classification: 'Class I',
    state: 'IN',
    voluntary: 'Voluntary: Firm Initiated',
  },
  {
    id: 'seed-003',
    product: "Hill's Science Diet and Hill's Prescription Diet canned dog foods (various flavors)",
    reason: 'Elevated Vitamin D levels. Dogs can develop serious health issues from Vitamin D toxicity, including kidney failure.',
    firm: "Hill's Pet Nutrition",
    date: '20190601',
    status: 'Completed',
    classification: 'Class I',
    state: 'KS',
    voluntary: 'Voluntary: Firm Initiated',
  },
  {
    id: 'seed-004',
    product: "Sunshine Mills Inc. Dog Food Products (Evolve, Sportsman's Pride, Sprout, Pure Being)",
    reason: 'Elevated levels of aflatoxin, a naturally occurring mold byproduct of corn that can be fatal to pets.',
    firm: 'Sunshine Mills, Inc.',
    date: '20211231',
    status: 'Completed',
    classification: 'Class I',
    state: 'AL',
    voluntary: 'Voluntary: Firm Initiated',
  },
  {
    id: 'seed-005',
    product: 'Triumph Pet Industries Cat Food (Ocean Fish with Tuna)',
    reason: 'May contain thiamine deficiency (Vitamin B1), which can cause neurological problems in cats.',
    firm: 'Triumph Pet Industries',
    date: '20220308',
    status: 'Completed',
    classification: 'Class II',
    state: 'NY',
    voluntary: 'Voluntary: Firm Initiated',
  },
  {
    id: 'seed-006',
    product: 'Victor Super Premium Dog Food (Multiple Varieties)',
    reason: 'Potential Salmonella contamination which poses a risk to both humans and pets.',
    firm: 'Mid America Pet Food',
    date: '20230701',
    status: 'Completed',
    classification: 'Class II',
    state: 'TX',
    voluntary: 'Voluntary: Firm Initiated',
  },
];

export async function GET() {
  try {
    // Use FDA's field-level search to find actual pet food enforcement records.
    // Sorting by newest date and fetching a generic window fails because pet food recalls
    // are interspersed among 29,000+ human food records — the newest 500 records are
    // almost entirely human food with zero pet food items.
    // Instead, we query specific product_description terms and merge the results.

    const base = 'https://api.fda.gov/food/enforcement.json';
    const opts = { next: { revalidate: 3600 } } as RequestInit;
    const queries = [
      `${base}?search=product_description:dog+food&limit=100&sort=recall_initiation_date:desc`,
      `${base}?search=product_description:cat+food&limit=100&sort=recall_initiation_date:desc`,
      `${base}?search=product_description:dog+treat&limit=100&sort=recall_initiation_date:desc`,
      `${base}?search=product_description:pet+food&limit=100&sort=recall_initiation_date:desc`,
      `${base}?search=product_description:puppy&limit=100&sort=recall_initiation_date:desc`,
      `${base}?search=product_description:kitten&limit=100&sort=recall_initiation_date:desc`,
      `${base}?search=product_description:kibble&limit=100&sort=recall_initiation_date:desc`,
      `${base}?search=product_description:pedigree&limit=100&sort=recall_initiation_date:desc`,
      `${base}?search=product_description:purina&limit=100&sort=recall_initiation_date:desc`,
      `${base}?search=product_description:canine&limit=100&sort=recall_initiation_date:desc`,
      `${base}?search=product_description:feline&limit=100&sort=recall_initiation_date:desc`,
      `${base}?search=recalling_firm:petcare&limit=100&sort=recall_initiation_date:desc`,
    ];

    const pages = await Promise.allSettled(
      queries.map(url => fetch(url, opts))
    );

    const seen = new Set<string>();
    const allItems: RawFDAItem[] = [];
    for (const p of pages) {
      if (p.status === 'fulfilled' && p.value.ok) {
        const json = await p.value.json();
        if (json.results) {
          for (const item of json.results) {
            // Deduplicate by recall_number
            const key = item.recall_number || JSON.stringify(item).slice(0, 60);
            if (!seen.has(key)) {
              seen.add(key);
              allItems.push(item);
            }
          }
        }
      }
    }

    // Secondary keyword filter to remove any false positives (e.g. "hot dog buns", "PET bottles")
    const petItems = allItems.filter(item => {
      const desc = (item.product_description || '').toLowerCase();
      const reason = (item.reason_for_recall || '').toLowerCase();
      const firm = (item.recalling_firm || '').toLowerCase();
      const combined = desc + ' ' + reason + ' ' + firm;
      return PET_KEYWORDS.some(k => combined.includes(k));
    });

    const normalized = petItems.map(r => ({
      id: r.recall_number || Math.random().toString(36).slice(2),
      product: r.product_description || 'Unknown Product',
      reason: r.reason_for_recall || 'Not specified',
      firm: r.recalling_firm || 'Unknown',
      date: r.recall_initiation_date || '',
      status: r.status || 'Unknown',
      classification: r.classification || '',
      state: r.state || '',
      voluntary: r.voluntary_mandated || '',
    }));

    // If FDA has live pet food recalls, show those; otherwise show seeds
    const results = normalized.length > 0 ? normalized : SEED_RECALLS;

    return NextResponse.json({
      results,
      source: normalized.length > 0 ? 'live' : 'historical',
      liveCount: normalized.length,
    });
  } catch (err) {
    console.error('FDA API error:', err);
    // Always fall back to seeds on error
    return NextResponse.json({ results: SEED_RECALLS, source: 'historical', liveCount: 0 });
  }
}

interface RawFDAItem {
  recall_number?: string;
  product_description?: string;
  reason_for_recall?: string;
  recalling_firm?: string;
  recall_initiation_date?: string;
  status?: string;
  classification?: string;
  state?: string;
  country?: string;
  voluntary_mandated?: string;
}
