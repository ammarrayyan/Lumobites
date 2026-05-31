import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Fetch affiliate details
    const { data: affiliate, error: affiliateError } = await supabaseAdmin
      .from('affiliates')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (affiliateError) {
      console.error('[Affiliate Stats] Supabase query error:', affiliateError);
      return NextResponse.json({ error: 'Failed to fetch affiliate details.' }, { status: 500 });
    }

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found.' }, { status: 404 });
    }

    if (affiliate.status !== 'approved') {
      return NextResponse.json({ error: 'Affiliate is not active.' }, { status: 400 });
    }

    // 2. Fetch referrer record using the referral_code
    if (!affiliate.referral_code) {
      // Approved but has no code? This shouldn't happen, but let's handle it gracefully.
      return NextResponse.json({
        affiliate,
        stats: {
          clicks: 0,
          totalReferrals: 0,
          activeSubscribers: 0,
          thisMonthEarnings: 0,
          allTimeEarnings: 0,
          unpaidBalance: 0,
          totalPaid: Number(affiliate.total_paid || 0)
        },
        referrals: []
      });
    }

    const { data: referrer, error: referrerError } = await supabaseAdmin
      .from('referrers')
      .select('id')
      .eq('code', affiliate.referral_code)
      .maybeSingle();

    if (referrerError) {
      console.error('[Affiliate Stats] Referrer fetch error:', referrerError);
    }

    let clicks = 0;
    let totalReferrals = 0;
    let activeSubscribers = 0;
    let allTimeEarnings = 0;
    let referredUsersList: any[] = [];

    if (referrer) {
      // 3. Fetch referred users for this referrer ID
      const { data: referredUsers, error: referredError } = await supabaseAdmin
        .from('referred_users')
        .select('*')
        .eq('referrer_id', referrer.id);

      if (referredError) {
        console.error('[Affiliate Stats] Referred users fetch error:', referredError);
      } else if (referredUsers) {
        referredUsersList = referredUsers;
        clicks = referredUsers.length;

        const subscribedUsers = referredUsers.filter((u: any) => u.subscribed);
        totalReferrals = subscribedUsers.length;

        const activeUsers = subscribedUsers.filter((u: any) => !u.cancelled);
        activeSubscribers = activeUsers.length;

        // Calculate all-time earnings ($1 per active month of each referred subscriber)
        subscribedUsers.forEach((u: any) => {
          const months = Number(u.active_months || 1);
          allTimeEarnings += months * 1.0;
        });
      }
    }

    const thisMonthEarnings = activeSubscribers * 1.0;
    const totalPaid = Number(affiliate.total_paid || 0);
    const unpaidBalance = Math.max(0, allTimeEarnings - totalPaid);

    return NextResponse.json({
      affiliate: {
        id: affiliate.id,
        full_name: affiliate.full_name,
        email: affiliate.email,
        paypal_email: affiliate.paypal_email,
        referral_code: affiliate.referral_code,
        status: affiliate.status,
        created_at: affiliate.created_at,
        total_paid: totalPaid,
      },
      stats: {
        clicks,
        totalReferrals,
        activeSubscribers,
        thisMonthEarnings,
        allTimeEarnings,
        unpaidBalance,
        totalPaid
      },
      referrals: referredUsersList.filter((u: any) => u.subscribed)
    });

  } catch (err: any) {
    console.error('[Affiliate Stats] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
