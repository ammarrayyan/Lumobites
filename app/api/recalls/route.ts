import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const search = encodeURIComponent(
      'product_description:"pet food" OR product_description:"dog food" OR product_description:"cat food" OR product_description:"animal food" OR product_description:"puppy food" OR product_description:"kitten food" OR product_description:"dog treat" OR product_description:"cat treat"'
    );
    const url = `https://api.fda.gov/food/enforcement.json?search=${search}&limit=20&sort=recall_initiation_date:desc`;

    const res = await fetch(url, {
      next: { revalidate: 3600 }, // cache for 1 hour
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'FDA API unavailable', results: [] }, { status: 200 });
    }

    const data = await res.json();

    // Normalize and filter only animal/pet food results
    const recalls = (data.results || []).map(
      (r: {
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
      }) => ({
        id: r.recall_number || Math.random().toString(36).slice(2),
        product: r.product_description || 'Unknown Product',
        reason: r.reason_for_recall || 'Not specified',
        firm: r.recalling_firm || 'Unknown',
        date: r.recall_initiation_date || '',
        status: r.status || 'Unknown',
        classification: r.classification || '',
        state: r.state || '',
        country: r.country || '',
        voluntary: r.voluntary_mandated || '',
      })
    );

    return NextResponse.json({ results: recalls });
  } catch (err) {
    console.error('FDA API error:', err);
    return NextResponse.json({ error: 'Failed to fetch recalls', results: [] }, { status: 200 });
  }
}
