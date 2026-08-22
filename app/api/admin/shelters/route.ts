import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { sendShelterApprovalEmail, sendShelterRejectionEmail, sendPartnerAccountDeletionEmail } from '@/lib/adoption-email';
import { isAuthorizedAdmin } from '@/lib/adminAuth';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorizedAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: shelters, error } = await supabaseAdmin
      .from('shelters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ shelters: shelters || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorizedAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status, rejection_reason } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const updatePayload: any = { status };

    if (status === 'rejected') {
      updatePayload.rejection_reason = rejection_reason || 'Application did not meet verification criteria.';
    } else if (status === 'approved') {
      updatePayload.rejection_reason = null;
      updatePayload.approved_at = now.toISOString();
      updatePayload.subscription_status = 'trialing';
      updatePayload.trial_start = now.toISOString();
      updatePayload.trial_end = trialEnd.toISOString();
    }

    const { data: shelter, error } = await supabaseAdmin
      .from('shelters')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (shelter && shelter.email) {
      if (status === 'approved') {
        sendShelterApprovalEmail(shelter.email, shelter.org_name);
      } else if (status === 'rejected') {
        sendShelterRejectionEmail(shelter.email, shelter.org_name, shelter.rejection_reason);
      }
    }

    return NextResponse.json({ shelter });
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
      return NextResponse.json({ error: 'Missing shelter id' }, { status: 400 });
    }

    // 1. Fetch shelter details
    const { data: shelter } = await supabaseAdmin.from('shelters').select('*').eq('id', id).single();
    if (!shelter) {
      return NextResponse.json({ error: 'Shelter not found' }, { status: 404 });
    }

    // 2. Check & cancel active Stripe subscriptions FIRST
    let canceledStripeSubs = 0;
    if (stripeSecretKey) {
      try {
        const stripe = new Stripe(stripeSecretKey);
        if (shelter.stripe_subscription_id) {
          try {
            await stripe.subscriptions.cancel(shelter.stripe_subscription_id);
            canceledStripeSubs++;
          } catch (e: any) {
            console.error('[Shelter DELETE] Error canceling sub ID:', e.message);
          }
        }
        if (shelter.email) {
          const customers = await stripe.customers.list({ email: shelter.email.toLowerCase().trim(), limit: 100 });
          for (const cust of customers.data) {
            const subs = await stripe.subscriptions.list({ customer: cust.id, status: 'all' });
            for (const sub of subs.data) {
              if ((sub.status === 'active' || sub.status === 'trialing') && sub.id !== shelter.stripe_subscription_id) {
                await stripe.subscriptions.cancel(sub.id);
                canceledStripeSubs++;
              }
            }
          }
        }
      } catch (stripeErr: any) {
        console.error('[Shelter DELETE] Stripe check error:', stripeErr);
      }
    }

    // 3. Cascade cleanup: delete pets and inquiries
    await supabaseAdmin.from('adoption_pets').delete().eq('shelter_id', id);
    await supabaseAdmin.from('adoption_messages').delete().eq('shelter_id', id);

    // 4. Delete shelter record
    const { error: deleteErr } = await supabaseAdmin.from('shelters').delete().eq('id', id);
    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    // 5. Send confirmation email
    if (shelter.email) {
      sendPartnerAccountDeletionEmail(shelter.email, shelter.org_name, 'Shelter');
    }

    return NextResponse.json({
      success: true,
      canceledStripeSubs,
      message: 'Shelter account and associated listings deleted successfully.'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
