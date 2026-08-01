import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAllPartnerPricing, updatePartnerPricing } from '@/lib/partner-pricing';

export const dynamic = 'force-dynamic';
const ADMIN_SECRET = process.env.ADMIN_KEY || 'Lumo2026@';

function isAuthorized(request: NextRequest): boolean {
  const adminKey = request.headers.get('x-admin-key');
  return adminKey === ADMIN_SECRET;
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch Pricing Settings
    const pricing = await getAllPartnerPricing();

    // 2. Fetch Vet Clinics
    const { data: vetClinics, error: vetErr } = await supabaseAdmin
      .from('vet_clinics')
      .select('*')
      .order('created_at', { ascending: false });

    // 3. Fetch Pet Daycares
    const { data: petDaycares, error: dayErr } = await supabaseAdmin
      .from('pet_daycares')
      .select('*')
      .order('created_at', { ascending: false });

    // 4. Fetch Shelters
    const { data: shelters, error: shelterErr } = await supabaseAdmin
      .from('shelters')
      .select('*')
      .order('created_at', { ascending: false });

    if (vetErr || dayErr || shelterErr) {
      console.error('[Admin Partner Billing] Error fetching data:', { vetErr, dayErr, shelterErr });
    }

    // Combine into a unified list
    const normalizedVet = (vetClinics || []).map(v => ({
      id: v.id,
      partner_type: 'vet_boarding',
      business_name: v.clinic_name || 'Unnamed Vet Clinic',
      email: v.email,
      status: v.status,
      subscription_status: v.subscription_status || 'trialing',
      is_paused: v.status === 'paused' || v.is_paused === true,
      trial_start: v.trial_start || v.approved_at,
      trial_end: v.trial_end,
      current_period_end: v.current_period_end,
      cancel_at_period_end: v.cancel_at_period_end,
      stripe_subscription_id: v.stripe_subscription_id,
      stripe_customer_id: v.stripe_customer_id,
      created_at: v.created_at,
    }));

    const normalizedDaycare = (petDaycares || []).map(d => ({
      id: d.id,
      partner_type: 'pet_daycare',
      business_name: d.business_name || 'Unnamed Pet Daycare',
      email: d.email,
      status: d.status,
      subscription_status: d.subscription_status || 'trialing',
      is_paused: d.is_paused === true,
      trial_start: d.trial_start || d.approved_at,
      trial_end: d.trial_end,
      current_period_end: d.current_period_end,
      cancel_at_period_end: d.cancel_at_period_end,
      stripe_subscription_id: d.stripe_subscription_id,
      stripe_customer_id: d.stripe_customer_id,
      created_at: d.created_at,
    }));

    const normalizedShelter = (shelters || []).map(s => ({
      id: s.id,
      partner_type: 'shelter',
      business_name: s.name || 'Unnamed Shelter',
      email: s.email,
      status: s.status,
      subscription_status: s.subscription_status || 'trialing',
      is_paused: s.is_paused === true,
      trial_start: s.trial_start || s.approved_at,
      trial_end: s.trial_end,
      current_period_end: s.current_period_end,
      cancel_at_period_end: s.cancel_at_period_end,
      stripe_subscription_id: s.stripe_subscription_id,
      stripe_customer_id: s.stripe_customer_id,
      created_at: s.created_at,
    }));

    const allPartners = [...normalizedVet, ...normalizedDaycare, ...normalizedShelter].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );

    return NextResponse.json({
      pricing,
      partners: allPartners,
    });
  } catch (err: any) {
    console.error('[Admin Partner Billing API] GET Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // ACTION A: Update Pricing Settings
    if (action === 'update_pricing') {
      const { service_type, monthly_price_usd } = body;
      if (!service_type || monthly_price_usd === undefined) {
        return NextResponse.json({ error: 'Missing service_type or monthly_price_usd' }, { status: 400 });
      }
      const updated = await updatePartnerPricing(service_type, Number(monthly_price_usd));
      return NextResponse.json({ success: true, updated });
    }

    // ACTION B: Partner Row Mutation (Extend Trial, Force Expiry, Manual Pause/Unpause)
    const { partner_id, partner_type } = body;
    if (!partner_id || !partner_type) {
      return NextResponse.json({ error: 'Missing partner_id or partner_type' }, { status: 400 });
    }

    const tableMap: Record<string, string> = {
      shelter: 'shelters',
      pet_daycare: 'pet_daycares',
      vet_boarding: 'vet_clinics',
    };
    const tableName = tableMap[partner_type];
    if (!tableName) {
      return NextResponse.json({ error: 'Invalid partner_type' }, { status: 400 });
    }

    if (action === 'extend_trial') {
      const { days_to_add } = body;
      const days = Number(days_to_add) || 7;

      // Fetch current trial_end
      const { data: partner } = await supabaseAdmin.from(tableName).select('trial_end').eq('id', partner_id).single();
      const baseDate = partner?.trial_end && new Date(partner.trial_end) > new Date() ? new Date(partner.trial_end) : new Date();
      const newEnd = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

      const updatePayload: any = {
        trial_end: newEnd,
        subscription_status: 'trialing',
        reminder_7d_sent: false,
        reminder_1d_sent: false,
        reminder_exp_sent: false,
      };
      if (tableName === 'pet_daycares' || tableName === 'shelters') updatePayload.is_paused = false;
      if (tableName === 'vet_clinics') updatePayload.status = 'approved';

      await supabaseAdmin.from(tableName).update(updatePayload).eq('id', partner_id);
      return NextResponse.json({ success: true, new_trial_end: newEnd });
    }

    if (action === 'test_expiry') {
      // Force trial_end to 1 minute ago and mark subscription canceled & listing paused
      const pastEnd = new Date(Date.now() - 60 * 1000).toISOString();
      const updatePayload: any = {
        trial_end: pastEnd,
        subscription_status: 'canceled',
        reminder_exp_sent: true,
      };
      if (tableName === 'pet_daycares' || tableName === 'shelters') updatePayload.is_paused = true;
      if (tableName === 'vet_clinics') updatePayload.status = 'paused';

      await supabaseAdmin.from(tableName).update(updatePayload).eq('id', partner_id);
      return NextResponse.json({ success: true, expired_at: pastEnd });
    }

    if (action === 'toggle_pause') {
      const { is_paused } = body;
      const updatePayload: any = {};
      if (tableName === 'pet_daycares' || tableName === 'shelters') {
        updatePayload.is_paused = is_paused;
      }
      if (tableName === 'vet_clinics') {
        updatePayload.status = is_paused ? 'paused' : 'approved';
        updatePayload.is_paused = is_paused;
      }

      await supabaseAdmin.from(tableName).update(updatePayload).eq('id', partner_id);
      return NextResponse.json({ success: true, is_paused });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('[Admin Partner Billing API] PATCH Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
