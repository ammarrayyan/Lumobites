import { NextRequest, NextResponse } from 'next/server';
import { getPartnerPricing, getAllPartnerPricing } from '@/lib/partner-pricing';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const noCacheHeaders = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };

    if (type && ['shelter', 'pet_daycare', 'vet_boarding'].includes(type)) {
      const pricing = await getPartnerPricing(type as any);
      return NextResponse.json({ pricing }, { headers: noCacheHeaders });
    }

    const allPricing = await getAllPartnerPricing();
    return NextResponse.json({ pricing: allPricing }, { headers: noCacheHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch pricing' }, { status: 500 });
  }
}
