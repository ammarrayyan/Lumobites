import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

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
        if (email) {
          const cleanEmail = email.toLowerCase().trim();
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
            const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <onboarding@resend.dev>';
            console.log(`[Stripe Webhook] Sending Pro Welcome Email to: ${cleanEmail}`);
            await resend.emails.send({
              from: fromEmail,
              to: cleanEmail,
              subject: "✨ Welcome to Lumo Bites Pro! 🐾",
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 32px 24px; border: 1px solid #F0E6DF; border-radius: 16px; background-color: #FFFFFF; color: #191919; box-shadow: 0 4px 12px rgba(139, 94, 60, 0.05);">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <span style="font-size: 40px;">✨</span>
                    <h1 style="color: #8B5E3C; margin: 12px 0 4px 0; font-size: 24px; font-weight: 800;">Lumo Bites Pro</h1>
                    <p style="color: #A08068; margin: 0; font-size: 14px; font-weight: 600; text-transform: uppercase; tracking-widest: 1px;">Subscription Confirmed</p>
                  </div>
                  
                  <div style="height: 1px; background-color: #F5EBE4; margin: 24px 0;"></div>
                  
                  <p style="font-size: 16px; line-height: 1.6; color: #4A4A4A; margin-top: 0;">Hi there,</p>
                  <p style="font-size: 16px; line-height: 1.6; color: #4A4A4A;">Thank you for upgrading to <strong>Lumo Bites Pro</strong>! Your account is now active with unlimited barcode scans, instant ingredient analyses, and priority access to our FDA recall check database. 🐾</p>
                  
                  <div style="background-color: #FAF6F4; border: 1px solid #F5EBE4; border-radius: 12px; padding: 20px; margin: 28px 0;">
                    <h3 style="margin-top: 0; color: #8B5E3C; font-size: 16px; font-weight: 700;">💳 Subscription Details:</h3>
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #555555; line-height: 1.6;">
                      <li><strong>Status:</strong> Active ✅</li>
                      <li><strong>Plan:</strong> Lumo Bites Pro ($2.99/mo)</li>
                      <li><strong>Benefits:</strong> Unlimited ingredient scanning & recall alerts</li>
                    </ul>
                  </div>

                  <h3 style="color: #8B5E3C; font-size: 16px; font-weight: 700; margin-top: 24px;">⚙️ Manage or Cancel Subscription:</h3>
                  <p style="font-size: 14px; line-height: 1.6; color: #4A4A4A;">
                    You are in full control of your subscription. You can view your status, check your billing period, or cancel your subscription at any time by visiting your account page:
                  </p>
                  <div style="text-align: center; margin: 20px 0;">
                    <a href="https://lumobites.net/account" style="background-color: #8B5E3C; color: #FFFFFF; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 8px; display: inline-block; font-size: 14px;">Manage Subscription</a>
                  </div>
                  <p style="font-size: 12px; line-height: 1.5; color: #8C8C8C; margin-top: 16px; text-align: center;">
                    Or copy this link: <a href="https://lumobites.net/account" style="color: #8B5E3C; text-decoration: underline;">https://lumobites.net/account</a>
                  </p>

                  <div style="height: 1px; background-color: #F5EBE4; margin: 28px 0;"></div>
                  
                  <p style="font-size: 14px; line-height: 1.6; color: #6D6D6D; margin-bottom: 0;">Stay safe,<br/><strong>The Lumo Bites Team</strong></p>
                </div>
              `,
            });
            console.log(`[Stripe Webhook] Welcome email successfully sent to: ${cleanEmail}`);
          } catch (emailErr) {
            console.error('[Stripe Webhook] Failed to send Pro welcome email:', emailErr);
          }
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const email = invoice.customer_email;
        if (email) {
          const cleanEmail = email.toLowerCase().trim();
          console.log(`[Stripe Webhook] Payment succeeded, ensuring PRO status for email: ${cleanEmail}`);
          
          await supabase.from('emails').upsert(
            {
              email: cleanEmail,
              is_pro: true,
              source: 'stripe-webhook-invoice',
              created_at: new Date().toISOString(),
            },
            { onConflict: 'email' }
          );
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
              
              await supabase
                .from('emails')
                .update({ is_pro: false })
                .eq('email', cleanEmail);
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
