import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';
import { brandedEmail, emailStyles } from '@/lib/email-template';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, subscriptionId } = body;

    if (!email || !subscriptionId) {
      return NextResponse.json({ error: 'Email and subscriptionId are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check for owner/admin bypass
    const isOwner = cleanEmail === 'premierpetnutritionllc@gmail.com';

    if (isOwner || subscriptionId === 'admin_bypass') {
      // For admin/owner, just update Supabase Pro status to false
      const { error: dbError } = await supabase
        .from('emails')
        .update({ is_pro: false })
        .eq('email', cleanEmail);

      if (dbError) {
        console.error('[Cancel Subscription API] Supabase DB error (owner):', dbError);
        return NextResponse.json({ error: 'Failed to update Pro status in database' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Admin bypass removed' });
    }

    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe is not configured on the server.' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey);

    // Update Stripe subscription to cancel at period end instead of immediate deletion
    console.log(`[Cancel Subscription API] Setting cancel_at_period_end = true for subscription: ${subscriptionId} for email: ${cleanEmail}`);
    const updatedSub = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });

    // Compute human-readable end date and days remaining
    const periodEndMs = updatedSub.current_period_end * 1000;
    const endDate = new Date(periodEndMs).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    const daysRemaining = Math.max(0, Math.ceil((periodEndMs - Date.now()) / (1000 * 60 * 60 * 24)));

    // Note: We do NOT update Supabase's emails table to is_pro = false here.
    // The customer retains Pro access until their billing cycle finishes, at which point
    // Stripe will send a `customer.subscription.deleted` webhook, which handles setting is_pro = false.

    // Send cancellation confirmation email
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
      await resend.emails.send({
        from: fromEmail,
        to: cleanEmail,
        subject: '📅 Your Lumo Bites Pro subscription has been cancelled',
        html: brandedEmail({
          subject: '📅 Your Lumo Bites Pro subscription has been cancelled',
          preheader: `Your Pro access continues until ${endDate} — ${daysRemaining} days remaining.`,
          body: `
    <h1 style="${emailStyles.h1}">Subscription Cancelled 📅</h1>
    <p style="${emailStyles.p}">Your Lumo Bites Pro subscription has been cancelled. You still have full access until your billing period ends.</p>
    ${emailStyles.highlightBox(`
      <p style="margin:0 0 4px 0;font-size:12px;color:#8B6A50;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Pro Access Ends On</p>
      <p style="margin:0;font-size:26px;font-weight:800;color:#3B2410;">${endDate}</p>
      <p style="margin:8px 0 0 0;font-size:13px;color:#8B6A50;"><strong>${daysRemaining} days</strong> of Pro access remaining</p>
    `)}
    <p style="${emailStyles.pSmall}">After ${endDate}, your account will return to the free plan. Changed your mind?</p>
    ${emailStyles.button('https://lumobites.net/account', 'Reactivate Subscription')}
    ${emailStyles.divider}
    ${emailStyles.signoff}
  `
        })
      });
      console.log(`[Cancel Subscription API] Cancellation email sent to: ${cleanEmail}`);
    } catch (emailErr) {
      console.error('[Cancel Subscription API] Failed to send cancellation email:', emailErr);
      // Non-fatal — subscription is already cancelled
    }

    console.log(`[Cancel Subscription API] Successfully set cancel_at_period_end for: ${cleanEmail}`);
    return NextResponse.json({ success: true, endDate, daysRemaining, message: 'Subscription will cancel at the end of the billing period.' });

  } catch (err: any) {
    console.error('[Cancel Subscription API] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
