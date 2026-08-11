import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import { brandedEmail, emailStyles } from '@/lib/email-template';
import {
  sendPartnerWelcomePaidEmail,
  sendPartnerPaymentReceiptEmail,
  sendPartnerPaymentFailedEmail,
  sendPartnerSubscriptionExpiredEmail,
} from '@/lib/partner-billing-email';
import { getPartnerPricing } from '@/lib/partner-pricing';

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
        const partnerId = session.metadata?.partner_id;
        const partnerType = session.metadata?.partner_type;

        if (partnerId && partnerType && email) {
          const cleanEmail = email.toLowerCase().trim();
          const tableMap: Record<string, string> = {
            shelter: 'shelters',
            pet_daycare: 'pet_daycares',
            vet_boarding: 'vet_clinics',
          };
          const tableName = tableMap[partnerType];
          if (tableName) {
            console.log(`[Stripe Webhook] Processing partner subscription activation for ${partnerType} ID: ${partnerId}`);
            let currentPeriodEndIso: string | null = null;
            if (session.subscription) {
              try {
                const subObj = await stripe.subscriptions.retrieve(session.subscription as string);
                if (subObj?.current_period_end) {
                  currentPeriodEndIso = new Date(subObj.current_period_end * 1000).toISOString();
                }
              } catch (subErr) {
                console.error('[Stripe Webhook] Error fetching subscription period end:', subErr);
              }
            }

            const updateData: any = {
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              subscription_status: 'active',
              cancel_at_period_end: false,
            };

            if (tableName !== 'vet_clinics') {
              updateData.is_paused = false;
            } else {
              updateData.status = 'approved';
            }

            const { data: updatedPartner } = await supabaseAdmin
              .from(tableName)
              .update(updateData)
              .eq('id', partnerId)
              .select('*')
              .maybeSingle();

            const bName = updatedPartner?.business_name || updatedPartner?.clinic_name || updatedPartner?.org_name || updatedPartner?.name || 'Partner Account';
            const pricingSetting = await getPartnerPricing(partnerType as any);
            const priceVal = pricingSetting?.monthly_price_usd || (partnerType === 'shelter' ? 20 : partnerType === 'vet_boarding' ? 40 : 30);
            await sendPartnerWelcomePaidEmail(cleanEmail, bName, partnerType, priceVal);
          }
          break;
        }
        
        if (email) {
          const cleanEmail = email.toLowerCase().trim();
          
          if (referralCode) {
            console.log(`[Stripe Webhook] Processing referral for code: ${referralCode}`);
            const { data: referrer } = await supabaseAdmin.from('referrers').select('id').eq('code', referralCode).single();
            if (referrer) {
              await supabaseAdmin.from('referred_users').insert({
                referrer_id: referrer.id,
                referral_code: referralCode,
                referred_email: cleanEmail,
                subscribed: true,
                subscription_type: service === 'sitter-pro' ? 'pro_sitter' : 'pro_owner',
                monthly_value: session.amount_total ? session.amount_total / 100 : (service === 'sitter-pro' ? 9.99 : 4.99),
                subscription_date: new Date().toISOString(),
                active_months: 1,
              });
            }
          }
          
          if (service === 'sitter-pro') {
            console.log(`[Stripe Webhook] Setting Sitter PRO status for email: ${cleanEmail}`);
            
            await supabaseAdmin
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
      <p style="margin:0;font-size:13px;color:#6B5040;">⭐ <strong>Plan:</strong> Lumo Sitter Pro</p>
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
            
            await supabaseAdmin.from('emails').upsert(
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
              console.log(`[Stripe Webhook] Sending Welcome Email to: ${cleanEmail}`);
              const emailResponse = await resend.emails.send({
                from: fromEmail,
                to: cleanEmail,
                subject: '✨ Welcome to Lumo Bites Membership!',
                html: brandedEmail({
                  subject: '✨ Welcome to Lumo Bites Membership!',
                  preheader: 'Your Membership is active — enjoy 5 daily AI checks across all tools.',
                  body: `
    <h1 style="${emailStyles.h1}">Welcome to Lumo Bites Membership! ✨</h1>
    <p style="${emailStyles.p}">Thank you for upgrading! Your account now has full Membership access with 5 daily AI checks across all tools.</p>
    ${emailStyles.infoBox(`
      <p style="margin:0 0 8px 0;font-size:13px;color:#6B5040;">✅ <strong style="color:#3B2410;">Status:</strong> Active</p>
      <p style="margin:0 0 8px 0;font-size:13px;color:#6B5040;">💳 <strong style="color:#3B2410;">Plan:</strong> Lumo Bites Membership ($4.99/mo)</p>
      <p style="margin:0;font-size:13px;color:#6B5040;">🛡️ <strong style="color:#3B2410;">Benefits:</strong> 5 daily AI checks across all tools, priority features</p>
    `)}
    ${emailStyles.button('https://lumobites.net/account', 'Manage Account')}
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
        const subId = (typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id) || undefined;

        if (subId) {
          // Check if subscription belongs to a partner (vet_clinics, pet_daycares, shelters)
          const tables = ['vet_clinics', 'pet_daycares', 'shelters'];
          for (const tbl of tables) {
            const { data: p } = await supabaseAdmin.from(tbl).select('*').eq('stripe_subscription_id', subId).maybeSingle();
            if (p) {
              const nextDate = invoice.lines?.data?.[0]?.period?.end
                ? new Date(invoice.lines.data[0].period.end * 1000).toLocaleDateString()
                : 'Next Month';
              const nextIso = invoice.lines?.data?.[0]?.period?.end
                ? new Date(invoice.lines.data[0].period.end * 1000).toISOString()
                : null;
              
              const pUpdate: any = { subscription_status: 'active', current_period_end: nextIso };
              if (tbl === 'pet_daycares' || tbl === 'shelters') pUpdate.is_paused = false;
              if (tbl === 'vet_clinics') pUpdate.status = 'approved';

              await supabaseAdmin.from(tbl).update(pUpdate).eq('id', p.id);

              const bName = p.business_name || p.clinic_name || p.org_name || p.name || 'Partner Account';
              const amt = invoice.amount_paid ? invoice.amount_paid / 100 : 30;
              await sendPartnerPaymentReceiptEmail(p.email || email || '', bName, amt, nextDate);
              break;
            }
          }
        }

        if (email) {
          const cleanEmail = email.toLowerCase().trim();
          
          await supabaseAdmin.from('emails').upsert(
            { email: cleanEmail, is_pro: true, source: 'stripe-webhook-invoice', created_at: new Date().toISOString() },
            { onConflict: 'email' }
          );
          
          await supabaseAdmin.from('sitters').update({ is_pro: true }).eq('email', cleanEmail);

          if (invoice.billing_reason === 'subscription_cycle') {
            const { data: referred } = await supabaseAdmin
              .from('referred_users')
              .select('id, active_months')
              .eq('referred_email', cleanEmail)
              .eq('cancelled', false)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (referred) {
              await supabaseAdmin
                .from('referred_users')
                .update({ active_months: (referred.active_months || 1) + 1 })
                .eq('id', referred.id);
            }
          }
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id) || undefined;

        if (subId) {
          const tables = ['vet_clinics', 'pet_daycares', 'shelters'];
          for (const tbl of tables) {
            const { data: p } = await supabaseAdmin.from(tbl).select('*').eq('stripe_subscription_id', subId).maybeSingle();
            if (p) {
              await supabaseAdmin.from(tbl).update({ subscription_status: 'past_due' }).eq('id', p.id);
              const bName = p.business_name || p.clinic_name || p.org_name || p.name || 'Partner Account';
              await sendPartnerPaymentFailedEmail(p.email, bName);
              break;
            }
          }
        }

        const email = invoice.customer_email;
        if (email) {
          const cleanEmail = email.toLowerCase().trim();
          console.log(`[Stripe Webhook] Invoice payment failed for email: ${cleanEmail}. Keeping PRO access active during retry period.`);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const subId = subscription.id;
        const cancelAtEnd = subscription.cancel_at_period_end;
        const tables = ['vet_clinics', 'pet_daycares', 'shelters'];
        for (const tbl of tables) {
          await supabaseAdmin.from(tbl).update({ cancel_at_period_end: cancelAtEnd }).eq('stripe_subscription_id', subId);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const subId = subscription.id;
        const tables = ['vet_clinics', 'pet_daycares', 'shelters'];

        for (const tbl of tables) {
          const { data: p } = await supabaseAdmin.from(tbl).select('*').eq('stripe_subscription_id', subId).maybeSingle();
          if (p) {
            const updatePayload: any = { subscription_status: 'canceled' };
            if (tbl === 'pet_daycares' || tbl === 'shelters') updatePayload.is_paused = true;
            if (tbl === 'vet_clinics') updatePayload.status = 'paused';

            await supabaseAdmin.from(tbl).update(updatePayload).eq('id', p.id);

            const bName = p.business_name || p.clinic_name || p.org_name || p.name || 'Partner Account';
            const partnerType = tbl === 'shelters' ? 'shelter' : tbl === 'vet_clinics' ? 'vet_boarding' : 'pet_daycare';
            const pricingSetting = await getPartnerPricing(partnerType as any);
            const priceVal = pricingSetting?.monthly_price_usd || (tbl === 'shelters' ? 20 : tbl === 'vet_clinics' ? 40 : 30);
            await sendPartnerSubscriptionExpiredEmail(p.email, bName, priceVal);
          }
        }

        // Also process Sitter / Owner PRO subscription deletion
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
              await supabaseAdmin.from('emails').update({ is_pro: false }).eq('email', cleanEmail);
              await supabaseAdmin.from('sitters').update({ is_pro: false }).eq('email', cleanEmail);
 
              // Mark referral as cancelled
              await supabaseAdmin.from('referred_users').update({
                cancelled: true,
                cancelled_date: new Date().toISOString(),
              }).eq('referred_email', cleanEmail).eq('cancelled', false);

              // Check if cancelled due to payment failure
              const isPaymentFailed = subscription.cancellation_details?.reason === 'payment_failed';
              if (isPaymentFailed) {
                console.log(`[Stripe Webhook] Subscription for ${cleanEmail} was cancelled due to failed payment. Sending notification email.`);
                try {
                  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
                  await resend.emails.send({
                    from: fromEmail,
                    to: cleanEmail,
                    subject: '⚠️ Your Lumo Bites PRO subscription was cancelled due to a payment issue',
                    html: brandedEmail({
                      subject: '⚠️ Lumo Bites PRO Cancellation Warning',
                      preheader: 'Your Lumo Bites PRO subscription was cancelled due to a payment issue.',
                      body: `
    <h1 style="${emailStyles.h1}">Your PRO Subscription has been Cancelled</h1>
    <p style="${emailStyles.p}">Your Lumo Bites PRO subscription was cancelled due to a payment issue. Update your payment method to restore access: <a href="https://lumobites.net/account" style="color: #8B5E3C; font-weight: bold; text-decoration: underline;">lumobites.net/account</a></p>
    ${emailStyles.infoBox(`
      <p style="margin:0 0 6px 0;font-size:13px;color:#6B5040;">❌ <strong>Status:</strong> Cancelled (Unpaid)</p>
      <p style="margin:0 0 6px 0;font-size:13px;color:#6B5040;">⚠️ <strong>Reason:</strong> Payment failure after multiple retry attempts</p>
      <p style="margin:0;font-size:13px;color:#6B5040;">🔗 <strong>Action Required:</strong> Update billing details at <a href="https://lumobites.net/account" style="color: #8B5E3C; font-weight: bold;">lumobites.net/account</a></p>
    `)}
    ${emailStyles.button('https://lumobites.net/account', 'Update Payment Method')}
    ${emailStyles.divider}
    ${emailStyles.signoff}
  `
                    })
                  });
                } catch (emailErr) {
                  console.error('[Stripe Webhook] Failed to send payment failed cancellation email:', emailErr);
                }
              }
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
