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

export interface ProStatusDetails {
  isPro: boolean;
  proSource: 'unlimited' | 'partner_vet' | 'partner_daycare' | 'partner_shelter' | 'ai_member' | 'none';
  rawSubscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';
  billingHealthLabel: string;
}

export async function getUserProStatusDetails(email?: string | null): Promise<ProStatusDetails> {
  if (!email) return { isPro: false, proSource: 'none', rawSubscriptionStatus: 'none', billingHealthLabel: 'N/A' };
  const cleanEmail = email.toLowerCase().trim();

  // 1. Unlimited Admin
  if (UNLIMITED_EMAILS.includes(cleanEmail)) {
    return { isPro: true, proSource: 'unlimited', rawSubscriptionStatus: 'active', billingHealthLabel: 'Unlimited Admin' };
  }

  const now = new Date();
  const nowIso = now.toISOString();

  const getTrialDays = (trialEnd?: string | null) => {
    if (!trialEnd) return 0;
    const diff = new Date(trialEnd).getTime() - now.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  // 2. Partner Subscriptions (Vet Boarding $40/mo, Daycare $30/mo, Shelter $20/mo)
  const { data: vet } = await supabaseAdmin.from('vet_clinics').select('subscription_status, trial_end').eq('email', cleanEmail);
  if (vet && vet.length > 0) {
    const v = vet[0];
    const status = v.subscription_status || 'trialing';
    if (status === 'active') {
      return { isPro: true, proSource: 'partner_vet', rawSubscriptionStatus: 'active', billingHealthLabel: 'Active ($40/mo)' };
    }
    if (status === 'trialing' && v.trial_end && v.trial_end > nowIso) {
      const days = getTrialDays(v.trial_end);
      return { isPro: true, proSource: 'partner_vet', rawSubscriptionStatus: 'trialing', billingHealthLabel: `Trialing (${days}d left)` };
    }
    if (status === 'past_due') {
      return { isPro: false, proSource: 'partner_vet', rawSubscriptionStatus: 'past_due', billingHealthLabel: '⚠️ Past Due (Card Declined)' };
    }
    if (status === 'canceled') {
      return { isPro: false, proSource: 'partner_vet', rawSubscriptionStatus: 'canceled', billingHealthLabel: 'Canceled' };
    }
  }

  const { data: daycare } = await supabaseAdmin.from('pet_daycares').select('subscription_status, trial_end').eq('email', cleanEmail);
  if (daycare && daycare.length > 0) {
    const d = daycare[0];
    const status = d.subscription_status || 'trialing';
    if (status === 'active') {
      return { isPro: true, proSource: 'partner_daycare', rawSubscriptionStatus: 'active', billingHealthLabel: 'Active ($30/mo)' };
    }
    if (status === 'trialing' && d.trial_end && d.trial_end > nowIso) {
      const days = getTrialDays(d.trial_end);
      return { isPro: true, proSource: 'partner_daycare', rawSubscriptionStatus: 'trialing', billingHealthLabel: `Trialing (${days}d left)` };
    }
    if (status === 'past_due') {
      return { isPro: false, proSource: 'partner_daycare', rawSubscriptionStatus: 'past_due', billingHealthLabel: '⚠️ Past Due (Card Declined)' };
    }
    if (status === 'canceled') {
      return { isPro: false, proSource: 'partner_daycare', rawSubscriptionStatus: 'canceled', billingHealthLabel: 'Canceled' };
    }
  }

  const { data: shelter } = await supabaseAdmin.from('shelters').select('subscription_status, trial_end').eq('email', cleanEmail);
  if (shelter && shelter.length > 0) {
    const s = shelter[0];
    const status = s.subscription_status || 'trialing';
    if (status === 'active') {
      return { isPro: true, proSource: 'partner_shelter', rawSubscriptionStatus: 'active', billingHealthLabel: 'Active ($20/mo)' };
    }
    if (status === 'trialing' && s.trial_end && s.trial_end > nowIso) {
      const days = getTrialDays(s.trial_end);
      return { isPro: true, proSource: 'partner_shelter', rawSubscriptionStatus: 'trialing', billingHealthLabel: `Trialing (${days}d left)` };
    }
    if (status === 'past_due') {
      return { isPro: false, proSource: 'partner_shelter', rawSubscriptionStatus: 'past_due', billingHealthLabel: '⚠️ Past Due (Card Declined)' };
    }
    if (status === 'canceled') {
      return { isPro: false, proSource: 'partner_shelter', rawSubscriptionStatus: 'canceled', billingHealthLabel: 'Canceled' };
    }
  }

  // 3. Direct AI Membership (emails.is_pro === true AND source in verified Stripe list)
  const PAID_STRIPE_SOURCES = ['stripe_membership', 'stripe', 'stripe-webhook-invoice'];
  const { data: emailData } = await supabaseAdmin.from('emails').select('is_pro, source').eq('email', cleanEmail).maybeSingle();
  if (emailData && emailData.is_pro && PAID_STRIPE_SOURCES.includes(emailData.source)) {
    return { isPro: true, proSource: 'ai_member', rawSubscriptionStatus: 'active', billingHealthLabel: 'Active Member ($4.99/mo)' };
  }

  return { isPro: false, proSource: 'none', rawSubscriptionStatus: 'none', billingHealthLabel: 'N/A' };
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
  
  const proDetails = await getUserProStatusDetails(normalizedEmail);
  if (proDetails.proSource === 'unlimited') {
    return { allowed: true, isUnlimited: true, isPro: true };
  }

  const config = AI_LIMIT_CONFIG[feature];
  if (!config) return { allowed: true };

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
