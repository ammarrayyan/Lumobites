import { supabaseAdmin } from '@/lib/supabase';

export type AiFeatureKey =
  | 'ingredient_scanner'
  | 'vision_scanner'
  | 'pet_twin'
  | 'pet_search'
  | 'sitter_search'
  | 'adoption_matcher';

export const SHARED_MONTHLY_GLOBAL_CAP = 100; // USD total per month across all 6 features combined

export const AI_LIMIT_CONFIG: Record<AiFeatureKey, {
  estimatedCostPerCall: number; // in USD
}> = {
  ingredient_scanner: { estimatedCostPerCall: 0.003 },
  vision_scanner:     { estimatedCostPerCall: 0.010 },
  pet_twin:           { estimatedCostPerCall: 0.010 },
  pet_search:         { estimatedCostPerCall: 0.005 },
  sitter_search:      { estimatedCostPerCall: 0.003 },
  adoption_matcher:   { estimatedCostPerCall: 0.003 },
};

const UNLIMITED_EMAILS = [
  'ammar-rayyan@hotmail.com',
  'reviewer@lumobites.net',
  'premierpetnutritionllc@gmail.com',
];

export async function getUserProStatusDetails(email?: string | null): Promise<{
  isPro: boolean;
  proSource: 'unlimited' | 'partner_vet' | 'partner_daycare' | 'partner_shelter' | 'ai_member' | 'none';
}> {
  if (!email) return { isPro: false, proSource: 'none' };
  const cleanEmail = email.toLowerCase().trim();

  // 1. Unlimited Admin
  if (UNLIMITED_EMAILS.includes(cleanEmail)) {
    return { isPro: true, proSource: 'unlimited' };
  }

  const nowIso = new Date().toISOString();

  // 2. Active Partner Subscriptions (Vet Boarding $40/mo, Daycare $30/mo, Shelter $20/mo)
  const { data: vet } = await supabaseAdmin.from('vet_clinics').select('subscription_status, trial_end').eq('email', cleanEmail);
  if (vet && vet.some(v => v.subscription_status === 'active' || (v.subscription_status === 'trialing' && v.trial_end && v.trial_end > nowIso))) {
    return { isPro: true, proSource: 'partner_vet' };
  }

  const { data: daycare } = await supabaseAdmin.from('pet_daycares').select('subscription_status, trial_end').eq('email', cleanEmail);
  if (daycare && daycare.some(d => d.subscription_status === 'active' || (d.subscription_status === 'trialing' && d.trial_end && d.trial_end > nowIso))) {
    return { isPro: true, proSource: 'partner_daycare' };
  }

  const { data: shelter } = await supabaseAdmin.from('shelters').select('subscription_status, trial_end').eq('email', cleanEmail);
  if (shelter && shelter.some(s => s.subscription_status === 'active' || (s.subscription_status === 'trialing' && s.trial_end && s.trial_end > nowIso))) {
    return { isPro: true, proSource: 'partner_shelter' };
  }

  // 3. Direct AI Membership (emails.is_pro === true AND source in verified Stripe list)
  const PAID_STRIPE_SOURCES = ['stripe_membership', 'stripe', 'stripe-webhook-invoice'];
  const { data: emailData } = await supabaseAdmin.from('emails').select('is_pro, source').eq('email', cleanEmail).maybeSingle();
  if (emailData && emailData.is_pro && PAID_STRIPE_SOURCES.includes(emailData.source)) {
    return { isPro: true, proSource: 'ai_member' };
  }

  return { isPro: false, proSource: 'none' };
}

export async function checkAndTrackAiUsage({
  feature,
  userEmail,
  request,
}: {
  feature: AiFeatureKey;
  userEmail?: string | null;
  request?: Request;
}): Promise<{ allowed: boolean; reason?: string; isUnlimited?: boolean; isPro?: boolean }> {
  const normalizedEmail = (userEmail || '').trim().toLowerCase();
  
  // Resolve Pro status
  const proDetails = await getUserProStatusDetails(normalizedEmail);
  if (proDetails.proSource === 'unlimited') {
    return { allowed: true, isUnlimited: true, isPro: true };
  }

  const config = AI_LIMIT_CONFIG[feature];
  if (!config) return { allowed: true };

  // Determine user identifier (email if logged in, or client IP from headers)
  let userIdentifier = normalizedEmail;
  if (!userIdentifier && request) {
    userIdentifier =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'anonymous';
  }
  if (!userIdentifier) userIdentifier = 'anonymous';

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  try {
    if (proDetails.isPro) {
      // PRO / MEMBER TIER: 5 uses per 24-hour rolling window across ALL 6 features combined
      const { count: userDailyCount, error: userErr } = await supabaseAdmin
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_identifier', userIdentifier)
        .gte('created_at', twentyFourHoursAgo);

      if (!userErr && userDailyCount !== null && userDailyCount >= 5) {
        return {
          allowed: false,
          reason: "You've used your 5 Pro AI checks for today. Come back tomorrow for more!",
          isPro: true,
        };
      }
    } else {
      // FREE TIER: 2 LIFETIME total uses across ALL 6 features combined (no 24h reset)
      const { count: lifetimeCount, error: lifeErr } = await supabaseAdmin
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_identifier', userIdentifier);

      if (!lifeErr && lifetimeCount !== null && lifetimeCount >= 2) {
        return {
          allowed: false,
          reason: "You've used both of your free AI checks. Upgrade to Membership for 5 checks a day!",
          isPro: false,
        };
      }
    }

    // Check global monthly $100 cost cap across ALL 6 features combined
    const { data: monthLogs, error: globalErr } = await supabaseAdmin
      .from('ai_usage_logs')
      .select('estimated_cost')
      .gte('created_at', startOfMonth);

    if (!globalErr && monthLogs) {
      const totalMonthCost = monthLogs.reduce((sum, log) => sum + (Number(log.estimated_cost) || 0.005), 0);
      if (totalMonthCost >= SHARED_MONTHLY_GLOBAL_CAP) {
        return {
          allowed: false,
          reason: 'This feature is experiencing high demand right now. Please check back soon.',
        };
      }
    }

    // Record usage log
    const { error: insertErr } = await supabaseAdmin.from('ai_usage_logs').insert({
      feature,
      user_identifier: userIdentifier,
      estimated_cost: config.estimatedCostPerCall,
      created_at: now.toISOString(),
    });
    if (insertErr) {
      console.error('[AI Limiter] Failed to record usage log:', insertErr);
    }
  } catch (err) {
    console.error(`[AI Limiter] Error checking usage for ${feature}:`, err);
  }

  return { allowed: true, isPro: proDetails.isPro };
}
