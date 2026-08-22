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
    let unlimitedAdminCount = 0;

    if (emails) {
      await Promise.all(
        emails.map(async (u) => {
          const details = await getUserProStatusDetails(u.email);
          if (details.proSource === 'ai_member') proMembersCount++;
          else if (details.proSource === 'unlimited') unlimitedAdminCount++;
        })
      );
    }

    // Fetch all partner tables directly to calculate accurate paying vs trialing stats
    const [vetsRes, daycaresRes, sheltersRes] = await Promise.all([
      supabaseAdmin.from('vet_clinics').select('id, email, status, subscription_status, stripe_subscription_id'),
      supabaseAdmin.from('pet_daycares').select('id, email, status, subscription_status, stripe_subscription_id'),
      supabaseAdmin.from('shelters').select('id, email, status, subscription_status, stripe_subscription_id'),
    ]);

    const vets = vetsRes.data || [];
    const daycares = daycaresRes.data || [];
    const shelters = sheltersRes.data || [];

    // Breakdown for Vets ($40/mo)
    const payingVetCount = vets.filter(v => v.status === 'approved' && v.subscription_status === 'active').length;
    const trialVetCount = vets.filter(v => v.status === 'approved' && v.subscription_status === 'trialing').length;

    // Breakdown for Daycares ($30/mo)
    const payingDaycareCount = daycares.filter(d => d.status === 'approved' && d.subscription_status === 'active').length;
    const trialDaycareCount = daycares.filter(d => d.status === 'approved' && d.subscription_status === 'trialing').length;

    // Breakdown for Shelters ($20/mo)
    const payingShelterCount = shelters.filter(s => s.status === 'approved' && s.subscription_status === 'active').length;
    const trialShelterCount = shelters.filter(s => s.status === 'approved' && s.subscription_status === 'trialing').length;

    const totalPayingPartners = payingVetCount + payingDaycareCount + payingShelterCount;
    const totalTrialPartners = trialVetCount + trialDaycareCount + trialShelterCount;
    const totalPartnersCount = totalPayingPartners + totalTrialPartners;

    const partnerVetCount = payingVetCount + trialVetCount;
    const partnerDaycareCount = payingDaycareCount + trialDaycareCount;
    const partnerShelterCount = payingShelterCount + trialShelterCount;

    const proOwners = proMembersCount + totalPartnersCount;

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

    // Revenue calculations (GENUINE paying revenue only — trials are $0)
    const monthlyAiMemberRevenue = proMembersCount * 4.99;
    const monthlyPartnerRevenue = (payingVetCount * 40) + (payingDaycareCount * 30) + (payingShelterCount * 20);
    const potentialTrialPartnerRevenue = (trialVetCount * 40) + (trialDaycareCount * 30) + (trialShelterCount * 20);
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
      payingVetCount,
      trialVetCount,
      payingDaycareCount,
      trialDaycareCount,
      payingShelterCount,
      trialShelterCount,
      totalPayingPartners,
      totalTrialPartners,
      partnerVetCount,
      partnerDaycareCount,
      partnerShelterCount,
      totalPartnersCount,
      unlimitedAdminCount,
      monthlyAiMemberRevenue,
      monthlyPartnerRevenue,
      potentialTrialPartnerRevenue,
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
