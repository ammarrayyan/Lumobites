import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { brandedEmail, emailStyles } from '@/lib/email-template';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Fetch sitter to see if they have a Stripe Customer ID and their ID
    const { data: sitter, error: fetchError } = await supabaseAdmin
      .from('sitters')
      .select('id, stripe_customer_id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (fetchError) {
      console.error('[Delete Sitter Profile] Error fetching sitter:', fetchError);
    }

    // 2. Cancel Stripe Subscription immediately if it exists
    if (sitter?.stripe_customer_id && stripeSecretKey) {
      const stripe = new Stripe(stripeSecretKey);
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: sitter.stripe_customer_id,
          status: 'active',
        });
        for (const sub of subscriptions.data) {
          await stripe.subscriptions.cancel(sub.id);
          console.log(`[Delete Sitter Profile] Cancelled subscription ${sub.id} for ${cleanEmail}`);
        }
      } catch (stripeErr) {
        console.error('[Delete Sitter Profile] Failed to cancel Stripe subscription:', stripeErr);
      }
    }

    // 3. Delete associated sitting requests first to satisfy foreign key constraints
    if (sitter?.id) {
      const { error: reqDeleteError } = await supabaseAdmin
        .from('sitting_requests')
        .delete()
        .eq('sitter_id', sitter.id);
      
      if (reqDeleteError) {
        console.error('[Delete Sitter Profile] Failed to delete associated sitting requests:', reqDeleteError);
        return NextResponse.json({ error: 'Failed to delete sitting requests from database' }, { status: 500 });
      }
    }

    // 4. Delete from Supabase
    const { error: deleteError } = await supabaseAdmin
      .from('sitters')
      .delete()
      .eq('email', cleanEmail);

    if (deleteError) {
      console.error('[Delete Sitter Profile] Supabase delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete profile from database' }, { status: 500 });
    }

    // 4. Send Confirmation Email
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
      await resend.emails.send({
        from: fromEmail,
        to: cleanEmail,
        subject: '👋 Your Lumo Sitter Profile has been deleted',
        html: brandedEmail({
          subject: 'Profile Deleted 👋',
          preheader: 'Your sitter profile and subscription have been permanently cancelled.',
          body: `
    <h1 style="${emailStyles.h1}">Profile Deleted 👋</h1>
    <p style="${emailStyles.p}">Your Lumo Bites Pet Sitter profile has been permanently deleted from our platform. You will no longer appear in search results.</p>
    ${emailStyles.infoBox(`
      <p style="margin:0 0 6px 0;font-size:13px;color:#6B5040;">✅ <strong>Profile Removed:</strong> Yes</p>
      <p style="margin:0;font-size:13px;color:#6B5040;">⛔ <strong>Subscription:</strong> Cancelled immediately (if active)</p>
    `)}
    <p style="${emailStyles.pSmall}">If you ever want to return, you can create a new profile at any time.</p>
    ${emailStyles.divider}
    ${emailStyles.signoff}
  `
        })
      });
      console.log(`[Delete Sitter Profile] Deletion email sent to: ${cleanEmail}`);
    } catch (emailErr) {
      console.error('[Delete Sitter Profile] Failed to send deletion email:', emailErr);
    }

    return NextResponse.json({ success: true, message: 'Profile deleted successfully.' });

  } catch (err: any) {
    console.error('[Delete Sitter Profile] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
