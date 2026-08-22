import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { sendDaycareApprovalEmail, sendDaycareRejectionEmail, sendPartnerAccountDeletionEmail } from '@/lib/adoption-email';
import { isAuthorizedAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
const ADMIN_SECRET = process.env.ADMIN_API_KEY;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// ─── GET /api/admin/daycares — Fetch all daycare applications ───────────────
export async function GET(request: NextRequest) {
  try {
    if (!isAuthorizedAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: daycares, error } = await supabaseAdmin
      .from('pet_daycares')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ daycares: daycares || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── PATCH /api/admin/daycares — Update daycare application status ──────────
export async function PATCH(request: NextRequest) {
  try {
    if (!isAuthorizedAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, rejection_reason } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const updatePayload: any = { status };

    if (status === 'approved') {
      updatePayload.approved_at = now.toISOString();
      updatePayload.subscription_status = 'trialing';
      updatePayload.trial_start = now.toISOString();
      updatePayload.trial_end = trialEnd.toISOString();
    } else if (status === 'rejected') {
      if (rejection_reason !== undefined) {
        updatePayload.rejection_reason = rejection_reason;
      }
    }

    let { data: daycare, error } = await supabaseAdmin
      .from('pet_daycares')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    // Fallback if rejection_reason column does not exist on DB table yet
    if (error && error.code === 'PGRST204' && updatePayload.rejection_reason !== undefined) {
      delete updatePayload.rejection_reason;
      const fallback = await supabaseAdmin
        .from('pet_daycares')
        .update(updatePayload)
        .eq('id', id)
        .select('*')
        .single();
      daycare = fallback.data;
      error = fallback.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (daycare?.email) {
      if (status === 'approved') {
        sendDaycareApprovalEmail(daycare.email, daycare.business_name);
      } else if (status === 'rejected') {
        sendDaycareRejectionEmail(daycare.email, daycare.business_name, rejection_reason);
      }
    }

    return NextResponse.json({ daycare });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isAuthorizedAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing daycare id' }, { status: 400 });
    }

    // 1. Fetch daycare details
    const { data: daycare } = await supabaseAdmin.from('pet_daycares').select('*').eq('id', id).single();
    if (!daycare) {
      return NextResponse.json({ error: 'Pet daycare not found' }, { status: 404 });
    }

    // 2. Check & cancel active Stripe subscriptions FIRST
    let canceledStripeSubs = 0;
    if (stripeSecretKey) {
      try {
        const stripe = new Stripe(stripeSecretKey);
        if (daycare.stripe_subscription_id) {
          try {
            await stripe.subscriptions.cancel(daycare.stripe_subscription_id);
            canceledStripeSubs++;
          } catch (e: any) {
            console.error('[Daycare DELETE] Error canceling sub ID:', e.message);
          }
        }
        if (daycare.email) {
          const customers = await stripe.customers.list({ email: daycare.email.toLowerCase().trim(), limit: 100 });
          for (const cust of customers.data) {
            const subs = await stripe.subscriptions.list({ customer: cust.id, status: 'all' });
            for (const sub of subs.data) {
              if ((sub.status === 'active' || sub.status === 'trialing') && sub.id !== daycare.stripe_subscription_id) {
                await stripe.subscriptions.cancel(sub.id);
                canceledStripeSubs++;
              }
            }
          }
        }
      } catch (stripeErr: any) {
        console.error('[Daycare DELETE] Stripe check error:', stripeErr);
      }
    }

    // 3. Cascade cleanup: delete messages, inquiries & availability
    const { data: inqs } = await supabaseAdmin.from('daycare_inquiries').select('id').eq('daycare_id', id);
    if (inqs && inqs.length > 0) {
      const inqIds = inqs.map(i => i.id);
      await supabaseAdmin.from('messages').delete().in('booking_id', inqIds);
    }
    await supabaseAdmin.from('daycare_availability').delete().eq('daycare_id', id);
    await supabaseAdmin.from('daycare_inquiries').delete().eq('daycare_id', id);

    // 4. Delete daycare record
    const { error: deleteErr } = await supabaseAdmin.from('pet_daycares').delete().eq('id', id);
    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    // 5. Send confirmation email
    if (daycare.email) {
      sendPartnerAccountDeletionEmail(daycare.email, daycare.business_name, 'Pet Daycare');
    }

    return NextResponse.json({
      success: true,
      canceledStripeSubs,
      message: 'Pet daycare account and associated data deleted successfully.'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
