import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

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
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <notifications@lumobites.net>';
      await resend.emails.send({
        from: fromEmail,
        to: cleanEmail,
        subject: '📅 Your Lumo Bites Pro subscription has been cancelled',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 32px 24px; border: 1px solid #F0E6DF; border-radius: 16px; background-color: #FFFFFF; color: #191919;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 40px;">📅</span>
              <h1 style="color: #8B5E3C; margin: 12px 0 4px 0; font-size: 24px; font-weight: 800;">Subscription Cancelled</h1>
              <p style="color: #A08068; margin: 0; font-size: 14px; font-weight: 600;">Lumo Bites Pro</p>
            </div>
            <div style="height: 1px; background-color: #F5EBE4; margin: 24px 0;"></div>
            <p style="font-size: 16px; line-height: 1.6; color: #4A4A4A; margin-top: 0;">Hi there,</p>
            <p style="font-size: 16px; line-height: 1.6; color: #4A4A4A;">Your Lumo Bites Pro subscription has been successfully cancelled. You will continue to have full Pro access until your billing period ends.</p>
            <div style="background-color: #FAF6F4; border: 1px dashed #8B5E3C; border-radius: 12px; padding: 20px; margin: 28px 0; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 13px; color: #A08068; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Pro Access Ends On</p>
              <p style="margin: 0; font-size: 22px; font-weight: 800; color: #8B5E3C;">${endDate}</p>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #888;"><strong>${daysRemaining} days</strong> of Pro access remaining</p>
            </div>
            <p style="font-size: 14px; line-height: 1.6; color: #6D6D6D;">After ${endDate}, your account will return to the free plan. Changed your mind? You can reactivate your subscription anytime from your <a href="https://lumobites.net/account" style="color: #8B5E3C;">account page</a>.</p>
            <div style="height: 1px; background-color: #F5EBE4; margin: 24px 0;"></div>
            <p style="font-size: 14px; line-height: 1.6; color: #6D6D6D; margin-bottom: 0;">The Lumo Bites Team 🐾</p>
          </div>
        `,
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
