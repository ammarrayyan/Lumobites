import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';
import {
  sendVetClinicApprovalEmail,
  sendVetClinicRejectionEmail,
  sendPartnerAccountDeletionEmail,
} from '@/lib/adoption-email';
import { isAuthorizedAdmin } from '@/lib/adminAuth';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// ─── GET /api/admin/vet-clinics — List all clinics ────────────────────────────
export async function GET(request: NextRequest) {
  try {
    if (!isAuthorizedAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: clinics, error } = await supabaseAdmin
      .from('vet_clinics')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ clinics: clinics || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST /api/admin/vet-clinics — Approve / reject / pause a clinic ─────────
export async function POST(request: NextRequest) {
  try {
    if (!isAuthorizedAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status, rejection_reason } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const allowedStatuses = ['pending', 'approved', 'rejected', 'paused'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const updatePayload: any = { status };

    if (status === 'rejected') {
      updatePayload.rejection_reason =
        rejection_reason || 'Application did not meet verification criteria.';
    } else if (status === 'approved') {
      updatePayload.rejection_reason = null;
      updatePayload.approved_at = now.toISOString();
      updatePayload.subscription_status = 'trialing';
      updatePayload.trial_start = now.toISOString();
      updatePayload.trial_end = trialEnd.toISOString();
    } else if (status === 'paused') {
      updatePayload.rejection_reason = null;
    }

    const { data: clinic, error } = await supabaseAdmin
      .from('vet_clinics')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (clinic?.email) {
      if (status === 'approved') {
        sendVetClinicApprovalEmail(clinic.email, clinic.clinic_name);
      } else if (status === 'rejected') {
        sendVetClinicRejectionEmail(clinic.email, clinic.clinic_name, clinic.rejection_reason);
      }
    }

    return NextResponse.json({ clinic });
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
      return NextResponse.json({ error: 'Missing clinic id' }, { status: 400 });
    }

    // 1. Fetch clinic details
    const { data: clinic } = await supabaseAdmin.from('vet_clinics').select('*').eq('id', id).single();
    if (!clinic) {
      return NextResponse.json({ error: 'Vet clinic not found' }, { status: 404 });
    }

    // 2. Check & cancel active Stripe subscriptions FIRST
    let canceledStripeSubs = 0;
    if (stripeSecretKey) {
      try {
        const stripe = new Stripe(stripeSecretKey);
        if (clinic.stripe_subscription_id) {
          try {
            await stripe.subscriptions.cancel(clinic.stripe_subscription_id);
            canceledStripeSubs++;
          } catch (e: any) {
            console.error('[Vet Clinic DELETE] Error canceling sub ID:', e.message);
          }
        }
        if (clinic.email) {
          const customers = await stripe.customers.list({ email: clinic.email.toLowerCase().trim(), limit: 100 });
          for (const cust of customers.data) {
            const subs = await stripe.subscriptions.list({ customer: cust.id, status: 'all' });
            for (const sub of subs.data) {
              if ((sub.status === 'active' || sub.status === 'trialing') && sub.id !== clinic.stripe_subscription_id) {
                await stripe.subscriptions.cancel(sub.id);
                canceledStripeSubs++;
              }
            }
          }
        }
      } catch (stripeErr: any) {
        console.error('[Vet Clinic DELETE] Stripe check error:', stripeErr);
      }
    }

    // 3. Cascade cleanup: delete messages, availability & inquiries
    const { data: inqs } = await supabaseAdmin.from('vet_inquiries').select('id').eq('clinic_id', id);
    if (inqs && inqs.length > 0) {
      await supabaseAdmin.from('messages').delete().in('booking_id', inqs.map(i => i.id));
    }
    await supabaseAdmin.from('vet_clinic_availability').delete().eq('clinic_id', id);
    await supabaseAdmin.from('vet_inquiries').delete().eq('clinic_id', id);

    // 4. Delete clinic record
    const { error: deleteErr } = await supabaseAdmin.from('vet_clinics').delete().eq('id', id);
    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    // 5. Send confirmation email
    if (clinic.email) {
      sendPartnerAccountDeletionEmail(clinic.email, clinic.clinic_name, 'Vet Boarding Clinic');
    }

    return NextResponse.json({
      success: true,
      canceledStripeSubs,
      message: 'Vet clinic account and associated data deleted successfully.'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
