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
  dailyUserLimit: number;
  estimatedCostPerCall: number; // in USD
}> = {
  ingredient_scanner: { dailyUserLimit: 2, estimatedCostPerCall: 0.003 },
  vision_scanner:     { dailyUserLimit: 2, estimatedCostPerCall: 0.010 },
  pet_twin:           { dailyUserLimit: 2, estimatedCostPerCall: 0.010 },
  pet_search:         { dailyUserLimit: 2, estimatedCostPerCall: 0.005 },
  sitter_search:      { dailyUserLimit: 2, estimatedCostPerCall: 0.003 },
  adoption_matcher:   { dailyUserLimit: 2, estimatedCostPerCall: 0.003 },
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
    // 2. Check per-user 24-hour daily limit (2 total AI uses per 24 hours across ALL features combined)
    const { count: userDailyCount, error: userErr } = await supabaseAdmin
      .from('ai_usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_identifier', userIdentifier)
      .gte('created_at', twentyFourHoursAgo);

    if (!userErr && userDailyCount !== null && userDailyCount >= 2) {
      return {
        allowed: false,
        reason: "You've used your 2 free AI checks for today. Come back tomorrow for more!",
      };
    }

    // 3. Check global monthly $100 cost cap across ALL 6 features combined
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

    // 4. Record usage log
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

  return { allowed: true };
}
