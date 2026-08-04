import { supabaseAdmin } from '@/lib/supabase';

export type AiFeatureKey =
  | 'ingredient_scanner'
  | 'vision_scanner'
  | 'pet_twin'
  | 'pet_search'
  | 'sitter_search'
  | 'adoption_matcher';

export const AI_LIMIT_CONFIG: Record<AiFeatureKey, {
  dailyUserLimit: number;
  monthlyGlobalCostCap: number; // in USD
  estimatedCostPerCall: number; // in USD
}> = {
  ingredient_scanner: { dailyUserLimit: 2, monthlyGlobalCostCap: 50, estimatedCostPerCall: 0.003 },
  vision_scanner:     { dailyUserLimit: 2, monthlyGlobalCostCap: 50, estimatedCostPerCall: 0.010 },
  pet_twin:           { dailyUserLimit: 2, monthlyGlobalCostCap: 50, estimatedCostPerCall: 0.010 },
  pet_search:         { dailyUserLimit: 2, monthlyGlobalCostCap: 50, estimatedCostPerCall: 0.005 },
  sitter_search:      { dailyUserLimit: 2, monthlyGlobalCostCap: 50, estimatedCostPerCall: 0.003 },
  adoption_matcher:   { dailyUserLimit: 2, monthlyGlobalCostCap: 50, estimatedCostPerCall: 0.003 },
};

const UNLIMITED_EMAILS = [
  'ammar-rayyan@hotmail.com',
];

export async function checkAndTrackAiUsage({
  feature,
  userEmail,
  request,
}: {
  feature: AiFeatureKey;
  userEmail?: string | null;
  request?: Request;
}): Promise<{ allowed: boolean; reason?: string; isUnlimited?: boolean }> {
  // 1. Unlimited testing account check
  const normalizedEmail = (userEmail || '').trim().toLowerCase();
  if (normalizedEmail && UNLIMITED_EMAILS.includes(normalizedEmail)) {
    return { allowed: true, isUnlimited: true };
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
    // 2. Check per-user 24-hour daily limit (2 uses/day)
    const { count: userDailyCount, error: userErr } = await supabaseAdmin
      .from('ai_usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('feature', feature)
      .eq('user_identifier', userIdentifier)
      .neq('status', 'blocked_daily')
      .neq('status', 'blocked_global')
      .gte('created_at', twentyFourHoursAgo);

    if (!userErr && userDailyCount !== null && userDailyCount >= config.dailyUserLimit) {
      await supabaseAdmin.from('ai_usage_logs').insert({
        feature,
        user_identifier: userIdentifier,
        estimated_cost: 0,
        status: 'blocked_daily',
        created_at: now.toISOString(),
      }).catch(e => console.error('[AI Limiter] Failed to log blocked daily:', e));

      return {
        allowed: false,
        reason: 'Daily limit reached (2 uses per 24 hours). Please try again tomorrow or upgrade your account.',
      };
    }

    // 3. Check global monthly $50 cost cap
    const { data: monthLogs, error: globalErr } = await supabaseAdmin
      .from('ai_usage_logs')
      .select('estimated_cost')
      .eq('feature', feature)
      .neq('status', 'blocked_daily')
      .neq('status', 'blocked_global')
      .gte('created_at', startOfMonth);

    if (!globalErr && monthLogs) {
      const totalMonthCost = monthLogs.reduce((sum, log) => sum + (Number(log.estimated_cost) || config.estimatedCostPerCall), 0);
      if (totalMonthCost >= config.monthlyGlobalCostCap) {
        await supabaseAdmin.from('ai_usage_logs').insert({
          feature,
          user_identifier: userIdentifier,
          estimated_cost: 0,
          status: 'blocked_global',
          created_at: now.toISOString(),
        }).catch(e => console.error('[AI Limiter] Failed to log blocked global:', e));

        return {
          allowed: false,
          reason: 'This feature is currently experiencing high demand. Please try again next month.',
        };
      }
    }

    // 4. Record usage log
    await supabaseAdmin.from('ai_usage_logs').insert({
      feature,
      user_identifier: userIdentifier,
      estimated_cost: config.estimatedCostPerCall,
      status: 'allowed',
      created_at: now.toISOString(),
    });
  } catch (err) {
    console.error(`[AI Limiter] Error checking usage for ${feature}:`, err);
    // Fail open if table does not exist yet or DB error occurs so feature doesn't break
  }

  return { allowed: true };
}
