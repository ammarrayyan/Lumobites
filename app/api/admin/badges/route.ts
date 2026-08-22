import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthorizedAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [
      { count: pendingReports },
      { count: pendingSitters },
      { count: pendingShelters },
      { count: pendingVets },
      { count: pendingDaycares },
      { count: pendingRequests },
      { count: activeLostPets },
      { count: pendingReviews },
      { count: pendingAffiliates }
    ] = await Promise.all([
      supabaseAdmin.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('sitters').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
      supabaseAdmin.from('shelters').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('vet_clinics').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('pet_daycares').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('sitting_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('lost_pets').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabaseAdmin.from('reviews').select('*', { count: 'exact', head: true }).eq('approved', false),
      supabaseAdmin.from('affiliates').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    const badges: Record<string, number> = {
      'reports': pendingReports || 0,
      'sitters': pendingSitters || 0,
      'shelters': pendingShelters || 0,
      'vet-clinics': pendingVets || 0,
      'pet-daycares': pendingDaycares || 0,
      'requests': pendingRequests || 0,
      'lost-pets': activeLostPets || 0,
      'reviews': pendingReviews || 0,
      'affiliates': pendingAffiliates || 0,
    };

    return NextResponse.json({ badges }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    console.error('[Admin Badges GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
