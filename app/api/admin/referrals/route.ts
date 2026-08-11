import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthorizedAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

function checkAuth(req: NextRequest) {
  return isAuthorizedAdmin(req);
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    // 1. Fetch referrers
    const { data: referrers, error: referrersError } = await supabaseAdmin
      .from('referrers')
      .select('*')
      .order('created_at', { ascending: false });

    if (referrersError) throw referrersError;

    // 2. Fetch referred users
    const { data: referredUsers, error: referredUsersError } = await supabaseAdmin
      .from('referred_users')
      .select('*');

    if (referredUsersError) throw referredUsersError;

    // 3. Process Data
    let totalClicks = 0;
    let totalSubscribers = 0;
    let totalActive = 0;
    let totalCancelled = 0;
    let totalMonthlyRevenue = 0;

    const enrichedReferrers = referrers.map((referrer: any) => {
      const users = referredUsers.filter((u: any) => u.referrer_id === referrer.id);
      
      const clicks = users.length;
      totalClicks += clicks;

      const subscribedUsers = users.filter((u: any) => u.subscribed);
      const subscribersCount = subscribedUsers.length;
      totalSubscribers += subscribersCount;

      const activeUsers = subscribedUsers.filter((u: any) => !u.cancelled);
      const activeCount = activeUsers.length;
      totalActive += activeCount;

      const cancelledUsers = subscribedUsers.filter((u: any) => u.cancelled);
      totalCancelled += cancelledUsers.length;

      // Revenue Calculation
      let proOwnersCount = 0;
      let proOwnersValue = 0;
      let sitterProCount = 0;
      let sitterProValue = 0;
      let totalValue = 0;

      activeUsers.forEach((u: any) => {
        const val = Number(u.monthly_value || 0);
        totalValue += val;
        totalMonthlyRevenue += val;

        if (u.subscription_type === 'pro_owner') {
          proOwnersCount++;
          proOwnersValue += val;
        } else if (u.subscription_type === 'pro_sitter') {
          sitterProCount++;
          sitterProValue += val;
        }
      });

      return {
        ...referrer,
        stats: {
          clicks,
          subscribersCount,
          activeCount,
          cancelledCount: cancelledUsers.length,
          totalValue,
          breakdown: {
            proOwners: { count: proOwnersCount, value: proOwnersValue },
            sitterPro: { count: sitterProCount, value: sitterProValue }
          }
        },
        users: users // The detailed list for the modal
      };
    });

    const overallStats = {
      totalClicks,
      totalSubscribers,
      totalActive,
      totalCancelled,
      totalMonthlyRevenue
    };

    return NextResponse.json({
      referrers: enrichedReferrers,
      stats: overallStats
    });

  } catch (error: any) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
