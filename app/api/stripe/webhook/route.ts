import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';
import { brandedEmail, emailStyles } from '@/lib/email-template';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function POST(request: NextRequest) {
  try {
    if (!stripeSecretKey) {
      console.error('[Stripe Webhook] Missing STRIPE_SECRET_KEY');
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey);

    const bodyText = await request.text();
    const sig = request.headers.get('stripe-signature');

    let event: Stripe.Event;

    if (webhookSecret && sig) {
      try {
        event = stripe.webhooks.constructEvent(bodyText, sig, webhookSecret);
      } catch (err: any) {
        console.error('[Stripe Webhook] Signature verification failed:', err.message);
        return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
      }
    } else {
      console.warn('[Stripe Webhook] Running without STRIPE_WEBHOOK_SECRET verification.');
      event = JSON.parse(bodyText);
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    // Handle different Stripe webhook events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_details?.email || session.metadata?.email;
        const service = session.metadata?.service;
        const referralCode = session.metadata?.referral_code;
        
        if (email) {
          const cleanEmail = email.toLowerCase().trim();
          
          if (referralCode) {
            console.log(`[Stripe Webhook] Processing referral for code: ${referralCode}`);
            const { data: referrer } = await supabase.from('referrers').select('id').eq('code', referralCode).single();
            if (referrer) {
              await supabase.from('referred_users').insert({
                referrer_id: referrer.id,
                referral_code: referralCode,
                referred_email: cleanEmail,
                subscribed: true,
                subscription_type: service === 'sitter-pro' ? 'pro_sitter' : 'pro_owner',
                monthly_value: session.amount_total ? session.amount_total / 100 : (service === 'sitter-pro' ? 9.99 : 2.99),
                subscription_date: new Date().toISOString(),
                active_months: 1,
              });
            }
          }
          
          if (service === 'sitter-pro') {
            console.log(`[Stripe Webhook] Setting Sitter PRO status for email: ${cleanEmail}`);
            
            await supabase
              .from('sitters')
              .update({ is_pro: true, stripe_customer_id: session.customer as string })
              .eq('email', cleanEmail);

            // Send Sitter Pro Welcome Email
            try {
              const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
              await resend.emails.send({
                from: fromEmail,
                to: cleanEmail,
                subject: '✨ Welcome to Lumo Sitter Pro!',
                html: brandedEmail({
                  subject: '✨ Welcome to Lumo Sitter Pro!',
                  preheader: 'Your sitter profile is now live — pet owners can find you!',
                  body: `
    <h1 style="${emailStyles.h1}">Welcome to Lumo Sitter Pro! ✨</h1>
    <p style="${emailStyles.p}">Your sitter profile is now <strong>active and live</strong> in search results. Pet owners in your area can discover your services and send you requests directly.</p>
    ${emailStyles.infoBox(`
      <p style="margin:0 0 6px 0;font-size:13px;color:#6B5040;">✅ <strong>Status:</strong> Active & Visible</p>
      <p style="margin:0 0 6px 0;font-size:13px;color:#6B5040;">📩 <strong>Requests:</strong> Enabled — owners can now contact you</p>
      <p style="margin:0;font-size:13px;color:#6B5040;">⭐ <strong>Plan:</strong> Lumo Sitter Pro ($9.99/mo)</p>
    `)}
    ${emailStyles.button('https://lumobites.net/petsitting', 'View Your Profile')}
    ${emailStyles.divider}
    ${emailStyles.signoff}
  `
                })
              });
            } catch (err) {
              console.error('[Stripe Webhook] Failed to send Sitter Pro welcome email:', err);
            }
            
          } else {
            console.log(`[Stripe Webhook] Setting PRO status for email: ${cleanEmail}`);
            
            await supabase.from('emails').upsert(
              {
                email: cleanEmail,
                is_pro: true,
                source: 'stripe-webhook',
                created_at: new Date().toISOString(),
              },
              { onConflict: 'email' }
            );

            // Send transactional welcome email via Resend
            try {
              const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
              console.log(`[Stripe Webhook] Sending Pro Welcome Email to: ${cleanEmail}`);
              const emailResponse = await resend.emails.send({
                from: fromEmail,
                to: cleanEmail,
                subject: '✨ Welcome to Lumo Bites Pro!',
                html: brandedEmail({
                  subject: '✨ Welcome to Lumo Bites Pro!',
                  preheader: 'Your Pro subscription is active — enjoy unlimited scans and recall alerts.',
                  body: `
    <h1 style="${emailStyles.h1}">Welcome to Lumo Bites Pro! ✨</h1>
    <p style="${emailStyles.p}">Thank you for upgrading! Your account now has full Pro access with unlimited ingredient scanning and priority recall alerts.</p>
    ${emailStyles.infoBox(`
      <p style="margin:0 0 8px 0;font-size:13px;color:#6B5040;">✅ <strong style="color:#3B2410;">Status:</strong> Active</p>
      <p style="margin:0 0 8px 0;font-size:13px;color:#6B5040;">💳 <strong style="color:#3B2410;">Plan:</strong> Lumo Bites Pro ($2.99/mo)</p>
      <p style="margin:0;font-size:13px;color:#6B5040;">🛡️ <strong style="color:#3B2410;">Benefits:</strong> Unlimited scanning, recall alerts, sitter contact</p>
    `)}
    ${emailStyles.button('https://lumobites.net/account', 'Manage Subscription')}
    ${emailStyles.divider}
    ${emailStyles.signoff}
  `
                })
              });

              if (emailResponse.error) {
                console.error('[Stripe Webhook] Resend Pro welcome email delivery failed:', emailResponse.error);
              } else {
                console.log(`[Stripe Webhook] Welcome email successfully sent to: ${cleanEmail}`);
              }
            } catch (emailErr) {
              console.error('[Stripe Webhook] Failed to send Pro welcome email exception:', emailErr);
            }
          }
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const email = invoice.customer_email;
        if (email) {
          const cleanEmail = email.toLowerCase().trim();
          
          // Try to update both tables to be safe, since we don't have metadata here easily
          await supabase.from('emails').upsert(
            { email: cleanEmail, is_pro: true, source: 'stripe-webhook-invoice', created_at: new Date().toISOString() },
            { onConflict: 'email' }
          );
          
          await supabase.from('sitters').update({ is_pro: true }).eq('email', cleanEmail);

          if (invoice.billing_reason === 'subscription_cycle') {
            // Fetch the referred user by email and increment active_months using RPC or select/update
            const { data: referred } = await supabase
              .from('referred_users')
              .select('id, active_months')
              .eq('referred_email', cleanEmail)
              .eq('cancelled', false)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
              
            if (referred) {
              await supabase
                .from('referred_users')
                .update({ active_months: (referred.active_months || 1) + 1 })
                .eq('id', referred.id);
            }
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        // In order to find the email, we retrieve the customer from Stripe
        const customerId = subscription.customer as string;
        if (customerId) {
          const customer = await stripe.customers.retrieve(customerId);
          // Check if it's a deleted customer object
          if (customer && !customer.deleted) {
            const email = customer.email;
            if (email) {
              const cleanEmail = email.toLowerCase().trim();
              console.log(`[Stripe Webhook] Subscription deleted, removing PRO status for email: ${cleanEmail}`);
              
              // Remove PRO from both owner and sitter tables
              await supabase.from('emails').update({ is_pro: false }).eq('email', cleanEmail);
              await supabase.from('sitters').update({ is_pro: false }).eq('email', cleanEmail);

              // Mark referral as cancelled
              await supabase.from('referred_users').update({
                cancelled: true,
                cancelled_date: new Date().toISOString(),
              }).eq('referred_email', cleanEmail).eq('cancelled', false);
            }
          }
        }
        break;
      }
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[Stripe Webhook Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
