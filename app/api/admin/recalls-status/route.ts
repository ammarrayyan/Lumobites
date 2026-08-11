import { NextRequest, NextResponse } from 'next/server';

import { isAuthorizedAdmin } from '@/lib/adminAuth';

function checkAuth(req: NextRequest) {
  return isAuthorizedAdmin(req);
}

const PET_KEYWORDS = [
  // Generic pet food terms (all multi-word — safe)
  'dog food', 'cat food', 'pet food', 'dog treat', 'cat treat',
  'dog chow', 'cat chow', 'dog snack', 'cat snack',
  'dog biscuit', 'dog chew', 'animal feed', 'pet treat',
  // Puppy/kitten — multi-word only (bare 'puppy' false‑positives on "Hush Puppy" mix)
  'puppy food', 'puppy treat', 'puppy formula', 'puppy chow', 'puppy chew',
  'kitten food', 'kitten treat', 'kitten formula',
  // Kibble — specific enough on its own
  'kibble',
  // Pet food brands (all sufficiently specific)
  'pedigree', 'purina', 'science diet', 'fancy feast', 'friskies',
  'meow mix', 'alpo', 'beneful', 'iams', 'eukanuba', 'nutro',
  'blue buffalo', 'royal canin', 'wellness pet',
  // 'hills' replaced with specific phrases
  "hill's pet", "hills pet", "hill's science", "hills science",
  "nature's recipe", 'merrick', 'fromm', 'acana', 'orijen',
  // Scientific terms
  'canine', 'feline',
  // 'rawhide' replaced with compound forms
  'rawhide chew', 'rawhide treat', 'rawhide dog',
  // Recalling firm terms
  'petcare', 'pet care',
];

// Explicit false‑positive phrase exclusions – applied after keyword matching
const FALSE_POSITIVE_PHRASES = [
  'hush puppy',   // fried batter mix (human food)
  'hot dog bun',  // human food
  'hot dog roll', // human food
  'corn dog',     // human food
  'ample hills',  // ice‑cream brand
  'pet bottle',   // PET plastic packaging
  'pet plastic',
];


export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const lastChecked = new Date().toISOString();

  try {
    // Use FDA field-level searches so we find pet food records across the full 29k+ dataset,
    // not just the most recent 100 records (which are almost entirely human food).
    const base = 'https://api.fda.gov/food/enforcement.json';
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
      queries.map(url => fetch(url, { signal: AbortSignal.timeout(10000) }))
    );

    const seen = new Set<string>();
    const allItems: any[] = [];
    for (const p of pages) {
      if (p.status === 'fulfilled' && p.value.ok) {
        const json = await p.value.json();
        if (json.results) {
          for (const item of json.results) {
            const key = item.recall_number || JSON.stringify(item).slice(0, 60);
            if (!seen.has(key)) { seen.add(key); allItems.push(item); }
          }
        }
      }
    }

    // Secondary filter: keyword match AND no known false-positive phrase
    const petItems = allItems.filter(item => {
      const desc = (item.product_description || '').toLowerCase();
      const reason = (item.reason_for_recall || '').toLowerCase();
      const firm = (item.recalling_firm || '').toLowerCase();
      const combined = desc + ' ' + reason + ' ' + firm;
      // Must match at least one pet keyword
      if (!PET_KEYWORDS.some(k => combined.includes(k))) return false;
      // Must NOT match any known false-positive phrase
      if (FALSE_POSITIVE_PHRASES.some(fp => combined.includes(fp))) return false;
      return true;
    });


    return NextResponse.json({
      status: 'Connected',
      liveCount: petItems.length,
      totalAnimalVet: allItems.length,
      lastChecked,
    });
  } catch (err: any) {
    const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    return NextResponse.json({
      status: 'Error',
      liveCount: 0,
      lastChecked,
      error: isTimeout
        ? 'FDA API timed out after 10 seconds'
        : err?.message || String(err),
    });
  }
}
