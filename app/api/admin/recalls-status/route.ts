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
    // Fire a single lightweight FDA request (limit=100, most recent)
    const searchParam = encodeURIComponent('product_type:"Animal & Veterinary"');
    const url = `https://api.fda.gov/food/enforcement.json?search=${searchParam}&limit=100&sort=recall_initiation_date:desc&skip=0`;

    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return NextResponse.json({
        status: 'Error',
        liveCount: 0,
        lastChecked,
        error: `FDA API returned HTTP ${res.status}: ${body.slice(0, 200)}`,
      });
    }

    const json = await res.json();
    const allItems: any[] = json.results ?? [];

    // Filter to pet food items using the same keyword list as /api/recalls
    const petItems = allItems.filter(item => {
      const desc = (item.product_description || '').toLowerCase();
      const reason = (item.reason_for_recall || '').toLowerCase();
      return PET_KEYWORDS.some(k => desc.includes(k) || reason.includes(k));
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
