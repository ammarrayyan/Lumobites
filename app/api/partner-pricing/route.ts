import { NextRequest, NextResponse } from 'next/server';
import { getPartnerPricing, getAllPartnerPricing } from '@/lib/partner-pricing';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type && ['shelter', 'pet_daycare', 'vet_boarding'].includes(type)) {
      const pricing = await getPartnerPricing(type as any);
      return NextResponse.json({ pricing });
    }

    const allPricing = await getAllPartnerPricing();
    return NextResponse.json({ pricing: allPricing });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch pricing' }, { status: 500 });
  }
}
