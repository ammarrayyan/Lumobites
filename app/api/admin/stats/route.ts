import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserProStatusDetails } from '@/lib/aiLimiter';

import { isAuthorizedAdmin } from '@/lib/adminAuth';

function checkAuth(req: NextRequest) {
  return isAuthorizedAdmin(req);
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Total sitters
    const { count: totalSitters } = await supabaseAdmin
      .from('sitters')
      .select('*', { count: 'exact', head: true });

    // Pending sitters
    const { count: pendingSitters } = await supabaseAdmin
      .from('sitters')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'pending');

    // Approved sitters
    const { count: approvedSitters } = await supabaseAdmin
      .from('sitters')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'approved');

    // Rejected sitters
    const { count: rejectedSitters } = await supabaseAdmin
      .from('sitters')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'rejected');

    // Fetch all email rows to calculate true Pro & Member breakdowns
    const { data: emails } = await supabaseAdmin.from('emails').select('email');
    
    let proMembersCount = 0;
    let partnerVetCount = 0;
    let partnerDaycareCount = 0;
    let partnerShelterCount = 0;
    let unlimitedAdminCount = 0;

    if (emails) {
      await Promise.all(
        emails.map(async (u) => {
          const details = await getUserProStatusDetails(u.email);
          if (details.proSource === 'ai_member') proMembersCount++;
          else if (details.proSource === 'partner_vet') partnerVetCount++;
          else if (details.proSource === 'partner_daycare') partnerDaycareCount++;
          else if (details.proSource === 'partner_shelter') partnerShelterCount++;
          else if (details.proSource === 'unlimited') unlimitedAdminCount++;
        })
      );
    }

    const proOwners = proMembersCount + partnerVetCount + partnerDaycareCount + partnerShelterCount;

    // Check sitters pro status
    const { data: sitters } = await supabaseAdmin.from('sitters').select('email');
    let proSitters = 0;
    if (sitters) {
      await Promise.all(
        sitters.map(async (s) => {
          const details = await getUserProStatusDetails(s.email);
          if (details.isPro) proSitters++;
        })
      );
    }

    // Revenue calculations
    const monthlyAiMemberRevenue = proMembersCount * 4.99;
    const monthlyPartnerRevenue = (partnerVetCount * 40) + (partnerDaycareCount * 30) + (partnerShelterCount * 20);
    const totalMonthlyRevenue = monthlyAiMemberRevenue + monthlyPartnerRevenue;

    // New signups this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const { count: newSignups } = await supabaseAdmin
      .from('emails')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo.toISOString());

    // Lost Pets Stats
    const { count: totalLostPets } = await supabaseAdmin
      .from('lost_pets')
      .select('*', { count: 'exact', head: true });

    const { count: activeLostPets } = await supabaseAdmin
      .from('lost_pets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: resolvedLostPets } = await supabaseAdmin
      .from('lost_pets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved');

    const { count: weeklyLostPets } = await supabaseAdmin
      .from('lost_pets')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo.toISOString());

    return NextResponse.json({
      totalSitters: totalSitters || 0,
      pendingSitters: pendingSitters || 0,
      approvedSitters: approvedSitters || 0,
      rejectedSitters: rejectedSitters || 0,
      proOwners,
      proSitters,
      proMembersCount,
      partnerVetCount,
      partnerDaycareCount,
      partnerShelterCount,
      totalPartnersCount: partnerVetCount + partnerDaycareCount + partnerShelterCount,
      unlimitedAdminCount,
      monthlyAiMemberRevenue,
      monthlyPartnerRevenue,
      totalMonthlyRevenue,
      newSignups: newSignups || 0,
      totalLostPets: totalLostPets || 0,
      activeLostPets: activeLostPets || 0,
      resolvedLostPets: resolvedLostPets || 0,
      weeklyLostPets: weeklyLostPets || 0,
    });
  } catch (err: any) {
    console.error('[Admin Stats]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
