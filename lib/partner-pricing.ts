import { supabaseAdmin } from '@/lib/supabase';

export interface PricingSetting {
  service_type: 'shelter' | 'pet_daycare' | 'vet_boarding';
  monthly_price_usd: number;
  stripe_price_id?: string;
  trial_days_default: number;
  updated_at?: string;
}

export const DEFAULT_PRICING: Record<string, PricingSetting> = {
  shelter: {
    service_type: 'shelter',
    monthly_price_usd: 20,
    trial_days_default: 30,
  },
  pet_daycare: {
    service_type: 'pet_daycare',
    monthly_price_usd: 30,
    trial_days_default: 30,
  },
  vet_boarding: {
    service_type: 'vet_boarding',
    monthly_price_usd: 40,
    trial_days_default: 30,
  },
};

/**
 * Fetch active pricing settings for a partner service type.
 * Falls back gracefully to default prices ($20 shelter, $30 daycare, $40 vet boarding) if DB is unseeded.
 */
export async function getPartnerPricing(serviceType: 'shelter' | 'pet_daycare' | 'vet_boarding'): Promise<PricingSetting> {
  try {
    const { data, error } = await supabaseAdmin
      .from('partner_pricing_settings')
      .select('*')
      .eq('service_type', serviceType)
      .maybeSingle();

    if (!error && data) {
      return {
        service_type: data.service_type,
        monthly_price_usd: Number(data.monthly_price_usd) || DEFAULT_PRICING[serviceType].monthly_price_usd,
        stripe_price_id: data.stripe_price_id || undefined,
        trial_days_default: Number(data.trial_days_default) || 30,
        updated_at: data.updated_at,
      };
    }
  } catch (err) {
    console.warn(`[getPartnerPricing] Failed to fetch pricing for ${serviceType}, using defaults:`, err);
  }

  return DEFAULT_PRICING[serviceType];
}

/**
 * Fetch all partner pricing settings.
 */
export async function getAllPartnerPricing(): Promise<Record<string, PricingSetting>> {
  const result: Record<string, PricingSetting> = { ...DEFAULT_PRICING };

  try {
    const { data, error } = await supabaseAdmin
      .from('partner_pricing_settings')
      .select('*');

    if (!error && data && data.length > 0) {
      data.forEach((row: any) => {
        if (row.service_type && result[row.service_type]) {
          result[row.service_type] = {
            service_type: row.service_type,
            monthly_price_usd: Number(row.monthly_price_usd) || DEFAULT_PRICING[row.service_type].monthly_price_usd,
            stripe_price_id: row.stripe_price_id || undefined,
            trial_days_default: Number(row.trial_days_default) || 30,
            updated_at: row.updated_at,
          };
        }
      });
    }
  } catch (err) {
    console.warn('[getAllPartnerPricing] Error reading pricing settings:', err);
  }

  return result;
}

/**
 * Update pricing for a partner service type.
 */
export async function updatePartnerPricing(
  serviceType: 'shelter' | 'pet_daycare' | 'vet_boarding',
  monthlyPriceUsd: number,
  stripePriceId?: string,
  trialDaysDefault: number = 30
): Promise<{ success: boolean; data?: PricingSetting; error?: string }> {
  try {
    const payload = {
      service_type: serviceType,
      monthly_price_usd: monthlyPriceUsd,
      stripe_price_id: stripePriceId || null,
      trial_days_default: trialDaysDefault,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('partner_pricing_settings')
      .upsert(payload, { onConflict: 'service_type' })
      .select('*')
      .single();

    if (error) throw error;

    return {
      success: true,
      data: {
        service_type: data.service_type,
        monthly_price_usd: Number(data.monthly_price_usd),
        stripe_price_id: data.stripe_price_id || undefined,
        trial_days_default: Number(data.trial_days_default),
        updated_at: data.updated_at,
      },
    };
  } catch (err: any) {
    console.error('[updatePartnerPricing] Failed to update pricing:', err);
    return { success: false, error: err.message || 'Failed to update pricing settings' };
  }
}
