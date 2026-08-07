import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserProStatusDetails } from '@/lib/aiLimiter';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

function checkAuth(req: NextRequest) {
  const key = req.headers.get('x-admin-key');
  return key === process.env.NEXT_PUBLIC_ADMIN_BYPASS_KEY;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: rawUsers, error } = await supabaseAdmin
      .from('emails')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const usersWithPro = await Promise.all(
      (rawUsers || []).map(async (u) => {
        const proDetails = await getUserProStatusDetails(u.email);
        
        return {
          ...u,
          is_pro: proDetails.isPro,
          proSource: proDetails.proSource,
          subStatus: proDetails.billingHealthLabel,
          rawSubscriptionStatus: proDetails.rawSubscriptionStatus,
        };
      })
    );

    return NextResponse.json({ users: usersWithPro });
  } catch (err: any) {
    console.error('[Admin Users GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');

    if (!id || !email) {
      return NextResponse.json({ error: 'Missing id or email' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    let canceledStripeSubs = 0;

    // Check & cancel active Stripe subscriptions BEFORE deleting database rows
    if (stripeSecretKey) {
      try {
        const stripe = new Stripe(stripeSecretKey);

        // 1. Search for customer subscriptions in Stripe
        const customers = await stripe.customers.list({ email: cleanEmail, limit: 10 });
        for (const cust of customers.data) {
          const subs = await stripe.subscriptions.list({ customer: cust.id, status: 'active' });
          for (const sub of subs.data) {
            console.log(`[Admin Users DELETE] Canceling active Stripe subscription ${sub.id} for ${cleanEmail}`);
            await stripe.subscriptions.cancel(sub.id);
            canceledStripeSubs++;
          }
        }

        // 2. Check partner tables (vet_clinics, pet_daycares, shelters) for active stripe_subscription_id
        const { data: vet } = await supabaseAdmin.from('vet_clinics').select('stripe_subscription_id').eq('email', cleanEmail);
        const { data: daycare } = await supabaseAdmin.from('pet_daycares').select('stripe_subscription_id').eq('email', cleanEmail);
        const { data: shelter } = await supabaseAdmin.from('shelters').select('stripe_subscription_id').eq('email', cleanEmail);

        const partnerSubIds = [
          ...(vet || []).map(v => v.stripe_subscription_id),
          ...(daycare || []).map(d => d.stripe_subscription_id),
          ...(shelter || []).map(s => s.stripe_subscription_id),
        ].filter(Boolean);

        for (const subId of partnerSubIds) {
          try {
            console.log(`[Admin Users DELETE] Canceling partner Stripe subscription ${subId} for ${cleanEmail}`);
            await stripe.subscriptions.cancel(subId);
            canceledStripeSubs++;
          } catch (subCancelErr: any) {
            console.error(`[Admin Users DELETE] Partner sub ${subId} cancel error:`, subCancelErr.message);
          }
        }
      } catch (stripeErr: any) {
        console.error('[Admin Users DELETE] Stripe error during cancellation check:', stripeErr);
      }
    }

    // Now safely delete database rows
    const { error: emailsErr } = await supabaseAdmin
      .from('emails')
      .delete()
      .eq('id', id);

    if (emailsErr) throw emailsErr;

    await supabaseAdmin
      .from('sitters')
      .delete()
      .eq('email', cleanEmail);

    return NextResponse.json({ success: true, canceledStripeSubs });
  } catch (err: any) {
    console.error('[Admin Users DELETE]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email, status } = body;

    if (!email || !status) {
      return NextResponse.json({ error: 'Email and status are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    const { error: emailsErr } = await supabaseAdmin
      .from('emails')
      .update({ account_status: status })
      .eq('email', cleanEmail);

    if (emailsErr) throw emailsErr;

    await supabaseAdmin
      .from('sitters')
      .update({ account_status: status })
      .eq('email', cleanEmail);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Admin Users PUT]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
