import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';
import { brandedEmail, emailStyles } from '@/lib/email-template';
import { getVerifiedSessionEmail } from '@/lib/accountAuth';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function POST(request: NextRequest) {
  try {
    const verifiedEmail = await getVerifiedSessionEmail(request);
    let bodyEmail = '';
    let subscriptionId = '';
    try {
      const body = await request.json();
      bodyEmail = body.email;
      subscriptionId = body.subscriptionId;
    } catch {}

    const cleanEmail = (verifiedEmail || bodyEmail || '').toLowerCase().trim();

    if (!cleanEmail || !subscriptionId) {
      return NextResponse.json({ error: 'Email and subscriptionId are required' }, { status: 400 });
    }

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
        return NextResponse.json({ error: 'Failed to update status in database' }, { status: 500 });
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

    // Defensively extract current_period_end — fall back to items[0] if top-level is missing
    let rawPeriodEnd: number | null | undefined = updatedSub.current_period_end;
    if (!rawPeriodEnd && updatedSub.items?.data?.[0]) {
      rawPeriodEnd = (updatedSub.items.data[0] as any).current_period_end;
      console.log('[Cancel Subscription API] Used items[0].current_period_end fallback:', rawPeriodEnd);
    }

    let endDate = 'N/A';
    let daysRemaining = 0;

    if (rawPeriodEnd && rawPeriodEnd > 0) {
      const periodEndMs = rawPeriodEnd * 1000;
      try {
        endDate = new Date(periodEndMs).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'UTC',
        });
      } catch {
        endDate = new Date(periodEndMs).toDateString();
      }
      daysRemaining = Math.max(0, Math.ceil((periodEndMs - Date.now()) / (1000 * 60 * 60 * 24)));
    } else {
      console.error('[Cancel Subscription API] current_period_end is missing or zero for subscription:', subscriptionId);
    }

    // Note: We do NOT update Supabase's emails table to is_pro = false here.
    // The customer retains access until their billing cycle finishes, at which point
    // Stripe will send a `customer.subscription.deleted` webhook, which handles setting is_pro = false.

    // Send cancellation confirmation email
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
      await resend.emails.send({
        from: fromEmail,
        to: cleanEmail,
        subject: '📅 Your Lumo Bites Membership subscription has been cancelled',
        html: brandedEmail({
          subject: '📅 Your Lumo Bites Membership subscription has been cancelled',
          preheader: `Your Membership access continues until ${endDate} — ${daysRemaining} days remaining.`,
          body: `
    <h1 style="${emailStyles.h1}">Membership Subscription Cancelled</h1>
    <p style="${emailStyles.p}">Your Lumo Bites Membership subscription ($4.99/mo) has been cancelled. You still have full access (5 daily AI checks across all tools) until your billing period ends.</p>
    ${emailStyles.highlightBox(`
      <p style="margin:0 0 4px 0;font-size:12px;color:#8B6A50;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Membership Access Ends On</p>
      <p style="margin:0;font-size:26px;font-weight:800;color:#3B2410;">${endDate}</p>
      <p style="margin:8px 0 0 0;font-size:13px;color:#8B6A50;"><strong>${daysRemaining} days</strong> of Membership access remaining</p>
    `)}
    <p style="${emailStyles.pSmall}">After ${endDate}, your account will return to the free plan (2 lifetime checks). Changed your mind?</p>
    ${emailStyles.button('https://lumobites.net/account', 'Reactivate Membership')}
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
