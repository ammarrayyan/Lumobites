import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendPartnerTrialReminderEmail, sendPartnerSubscriptionExpiredEmail } from '@/lib/partner-billing-email';
import { getAllPartnerPricing } from '@/lib/partner-pricing';

export async function GET(request: NextRequest) {
  try {
    // Optional Vercel Cron authentication guard
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn('[Cron Partner Billing] Unauthorized cron request attempt');
    }

    console.log('[Cron Partner Billing] Running daily trial expiry and reminder check...');

    const pricing = await getAllPartnerPricing();
    const now = new Date();
    let reminder7dCount = 0;
    let reminder1dCount = 0;
    let expiredCount = 0;

    const partnerConfigs = [
      { type: 'vet_boarding', table: 'vet_clinics', defaultPrice: 40 },
      { type: 'pet_daycare', table: 'pet_daycares', defaultPrice: 30 },
      { type: 'shelter', table: 'shelters', defaultPrice: 20 },
    ];

    for (const config of partnerConfigs) {
      const price = pricing[config.type]?.monthly_price_usd || config.defaultPrice;

      // 1. Fetch trialing partners
      const { data: partners, error } = await supabaseAdmin
        .from(config.table)
        .select('*')
        .or('subscription_status.eq.trialing,subscription_status.is.null');

      if (error || !partners) continue;

      for (const partner of partners) {
        if (!partner.email || partner.status === 'rejected' || partner.subscription_status === 'active') {
          continue;
        }

        // Calculate trial end
        let trialEnd = partner.trial_end ? new Date(partner.trial_end) : null;
        if (!trialEnd && partner.approved_at) {
          trialEnd = new Date(new Date(partner.approved_at).getTime() + 30 * 24 * 60 * 60 * 1000);
        }

        if (!trialEnd) continue;

        const diffMs = trialEnd.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const bName = partner.business_name || partner.clinic_name || partner.name || 'Partner Account';

        // CASE A: Trial Expired (daysLeft <= 0)
        if (daysLeft <= 0) {
          if (!partner.is_paused && partner.status !== 'paused') {
            console.log(`[Cron Partner Billing] Pausing expired trial for ${config.type} ID ${partner.id} (${bName})`);
            
            const updatePayload: any = {
              subscription_status: 'canceled',
              reminder_exp_sent: true,
            };
            if (config.table === 'pet_daycares' || config.table === 'shelters') updatePayload.is_paused = true;
            if (config.table === 'vet_clinics') updatePayload.status = 'paused';

            await supabaseAdmin.from(config.table).update(updatePayload).eq('id', partner.id);
            await sendPartnerSubscriptionExpiredEmail(partner.email, bName, price);
            expiredCount++;
          }
        }
        // CASE B: 1 Day Reminder
        else if (daysLeft <= 1 && !partner.reminder_1d_sent) {
          console.log(`[Cron Partner Billing] Sending 1-day reminder email to ${config.type} ID ${partner.id} (${bName})`);
          await sendPartnerTrialReminderEmail(partner.email, bName, 1, price);
          await supabaseAdmin.from(config.table).update({ reminder_1d_sent: true }).eq('id', partner.id);
          reminder1dCount++;
        }
        // CASE C: 7 Days Reminder
        else if (daysLeft <= 7 && !partner.reminder_7d_sent) {
          console.log(`[Cron Partner Billing] Sending 7-day reminder email to ${config.type} ID ${partner.id} (${bName})`);
          await sendPartnerTrialReminderEmail(partner.email, bName, daysLeft, price);
          await supabaseAdmin.from(config.table).update({ reminder_7d_sent: true }).eq('id', partner.id);
          reminder7dCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      summary: {
        reminder7dCount,
        reminder1dCount,
        expiredCount,
      },
    });
  } catch (err: any) {
    console.error('[Cron Partner Billing] Error executing daily cron:', err);
    return NextResponse.json({ error: err.message || 'Cron execution failed' }, { status: 500 });
  }
}
