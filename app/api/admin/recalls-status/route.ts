import { NextRequest, NextResponse } from 'next/server';

function checkAuth(req: NextRequest) {
  const key = req.headers.get('x-admin-key');
  return key === process.env.NEXT_PUBLIC_ADMIN_BYPASS_KEY;
}

const PET_KEYWORDS = [
  'dog food', 'cat food', 'pet food', 'dog treat', 'cat treat',
  'puppy', 'kitten', 'kibble', 'dog chow', 'cat chow',
  'pedigree', 'purina', 'science diet', 'fancy feast', 'friskies',
  'meow mix', 'alpo', 'beneful', 'iams', 'eukanuba', 'nutro',
  'blue buffalo', 'royal canin', 'hills', 'wellness pet',
  "nature's recipe", 'merrick', 'fromm', 'acana', 'orijen',
  'canine', 'feline', 'dog biscuit', 'dog chew', 'rawhide',
  'animal feed', 'pet treat', 'dog snack', 'cat snack',
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

    // Secondary filter — removes false positives like "hot dog buns" or "PET bottles"
    const petItems = allItems.filter(item => {
      const desc = (item.product_description || '').toLowerCase();
      const reason = (item.reason_for_recall || '').toLowerCase();
      const firm = (item.recalling_firm || '').toLowerCase();
      const combined = desc + ' ' + reason + ' ' + firm;
      return PET_KEYWORDS.some(k => combined.includes(k));
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
