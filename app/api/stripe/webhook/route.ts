import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    if (!stripeSecretKey) {
      console.error('[Stripe Webhook] Missing STRIPE_SECRET_KEY');
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-01-27-pre.0' as any,
    });

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
