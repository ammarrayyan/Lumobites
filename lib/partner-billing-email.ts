import { Resend } from 'resend';
import { brandedEmail, emailStyles } from '@/lib/email-template';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';

/**
 * 1. Welcome Email (Subscription Started)
 */
export async function sendPartnerWelcomePaidEmail(email: string, businessName: string, partnerType: string, amountUsd: number) {
  try {
    const serviceName = partnerType === 'shelter' ? 'Shelter & Adoption' : partnerType === 'vet_boarding' ? 'Vet Boarding' : 'Pet Daycare';
    await resend.emails.send({
      from: fromEmail,
      to: email.toLowerCase().trim(),
      subject: `✨ Welcome to ${serviceName} Partner PRO!`,
      html: brandedEmail({
        subject: `✨ Welcome to ${serviceName} Partner PRO!`,
        preheader: `Your subscription is active — ${businessName} is fully visible in search.`,
        body: `
          <h1 style="${emailStyles.h1}">Welcome to Lumo ${serviceName}! ✨</h1>
          <p style="${emailStyles.p}">Thank you for subscribing! <strong>${businessName}</strong> is now fully active and verified in public search results.</p>
          ${emailStyles.infoBox(`
            <p style="margin:0 0 6px 0;font-size:13px;color:#6B5040;">✅ <strong>Status:</strong> Active & Visible in Search</p>
            <p style="margin:0 0 6px 0;font-size:13px;color:#6B5040;">💳 <strong>Plan:</strong> Monthly Subscription ($${amountUsd}/mo)</p>
            <p style="margin:0;font-size:13px;color:#6B5040;">🏥 <strong>Partner Account:</strong> ${businessName}</p>
          `)}
          ${emailStyles.button('https://lumobites.net', 'View Dashboard')}
          ${emailStyles.divider}
          ${emailStyles.signoff}
        `,
      }),
    });
  } catch (err) {
    console.error('[Resend Email] Failed to send welcome paid email:', err);
  }
}

/**
 * 2. Monthly Payment Receipt Email
 */
export async function sendPartnerPaymentReceiptEmail(email: string, businessName: string, amountUsd: number, nextBillingDate: string) {
  try {
    await resend.emails.send({
      from: fromEmail,
      to: email.toLowerCase().trim(),
      subject: `🧾 Payment Receipt - Lumo Partner Subscription ($${amountUsd})`,
      html: brandedEmail({
        subject: '🧾 Payment Receipt - Lumo Partner Subscription',
        preheader: `Thank you for your payment of $${amountUsd} for ${businessName}.`,
        body: `
          <h1 style="${emailStyles.h1}">Payment Receipt 🧾</h1>
          <p style="${emailStyles.p}">We successfully processed your monthly subscription payment for <strong>${businessName}</strong>.</p>
          ${emailStyles.infoBox(`
            <p style="margin:0 0 6px 0;font-size:13px;color:#6B5040;">💳 <strong>Amount Charged:</strong> $${amountUsd}.00 USD</p>
            <p style="margin:0 0 6px 0;font-size:13px;color:#6B5040;">📅 <strong>Next Billing Date:</strong> ${nextBillingDate}</p>
            <p style="margin:0;font-size:13px;color:#6B5040;">✅ <strong>Status:</strong> Active & Visible</p>
          `)}
          ${emailStyles.divider}
          ${emailStyles.signoff}
        `,
      }),
    });
  } catch (err) {
    console.error('[Resend Email] Failed to send payment receipt email:', err);
  }
}

/**
 * 3. Payment Failed / Past Due Alert Email
 */
export async function sendPartnerPaymentFailedEmail(email: string, businessName: string) {
  try {
    await resend.emails.send({
      from: fromEmail,
      to: email.toLowerCase().trim(),
      subject: `⚠️ Action Required: Renewal Payment Failed for ${businessName}`,
      html: brandedEmail({
        subject: '⚠️ Renewal Payment Failed',
        preheader: `Please update your payment method for ${businessName} to prevent listing pause.`,
        body: `
          <h1 style="${emailStyles.h1}">Payment Failed ⚠️</h1>
          <p style="${emailStyles.p}">We were unable to process the monthly renewal payment for <strong>${businessName}</strong>. Stripe is currently retrying the payment.</p>
          <p style="${emailStyles.p}">Your public listing remains active during this retry window. Please update your payment details immediately to prevent automatic listing pause.</p>
          ${emailStyles.infoBox(`
            <p style="margin:0 0 6px 0;font-size:13px;color:#6B5040;">⚠️ <strong>Status:</strong> Past Due (Retrying)</p>
            <p style="margin:0;font-size:13px;color:#6B5040;">🔗 <strong>Action Required:</strong> Update credit card on your dashboard</p>
          `)}
          ${emailStyles.button('https://lumobites.net', 'Update Payment Method')}
          ${emailStyles.divider}
          ${emailStyles.signoff}
        `,
      }),
    });
  } catch (err) {
    console.error('[Resend Email] Failed to send payment failed email:', err);
  }
}

/**
 * 4. Cancellation Scheduled Email
 */
export async function sendPartnerCancellationConfirmedEmail(email: string, businessName: string, endDate: string) {
  try {
    await resend.emails.send({
      from: fromEmail,
      to: email.toLowerCase().trim(),
      subject: `Subscription Cancellation Scheduled for ${businessName}`,
      html: brandedEmail({
        subject: 'Subscription Cancellation Scheduled',
        preheader: `Your paid access for ${businessName} will remain active until ${endDate}.`,
        body: `
          <h1 style="${emailStyles.h1}">Cancellation Scheduled</h1>
          <p style="${emailStyles.p}">Your subscription for <strong>${businessName}</strong> has been set to cancel at the end of your current billing period.</p>
          ${emailStyles.infoBox(`
            <p style="margin:0 0 6px 0;font-size:13px;color:#6B5040;">📅 <strong>Active Until:</strong> ${endDate}</p>
            <p style="margin:0;font-size:13px;color:#6B5040;">💡 You can reactivate your subscription anytime before or after this date from your dashboard.</p>
          `)}
          ${emailStyles.divider}
          ${emailStyles.signoff}
        `,
      }),
    });
  } catch (err) {
    console.error('[Resend Email] Failed to send cancellation email:', err);
  }
}

/**
 * 5. Trial Expiry Reminder Email (7 days, 1 day, Day of Expiry)
 */
export async function sendPartnerTrialReminderEmail(email: string, businessName: string, daysLeft: number, monthlyPriceUsd: number) {
  try {
    const isToday = daysLeft <= 0;
    const timeText = isToday ? 'ends TODAY' : daysLeft === 1 ? 'ends in 1 DAY' : `ends in ${daysLeft} days`;

    await resend.emails.send({
      from: fromEmail,
      to: email.toLowerCase().trim(),
      subject: `⏰ Action Needed: Free Trial ${timeText} for ${businessName}`,
      html: brandedEmail({
        subject: `⏰ Free Trial ${timeText}`,
        preheader: `Add a payment method to keep ${businessName} visible in search.`,
        body: `
          <h1 style="${emailStyles.h1}">Your Free Trial ${timeText}! ⏰</h1>
          <p style="${emailStyles.p}">Your 1-month free trial for <strong>${businessName}</strong> is ${isToday ? 'expiring today' : `ending in ${daysLeft} days`}.</p>
          <p style="${emailStyles.p}">To keep your listing visible in public search results and receive new inquiries without interruption, please add a payment method ($${monthlyPriceUsd}/mo).</p>
          ${emailStyles.infoBox(`
            <p style="margin:0 0 6px 0;font-size:13px;color:#6B5040;">⏳ <strong>Trial Status:</strong> ${timeText}</p>
            <p style="margin:0;font-size:13px;color:#6B5040;">💳 <strong>Monthly Price:</strong> $${monthlyPriceUsd}.00 USD / month</p>
          `)}
          ${emailStyles.button('https://lumobites.net', 'Add Payment Method')}
          ${emailStyles.divider}
          ${emailStyles.signoff}
        `,
      }),
    });
  } catch (err) {
    console.error('[Resend Email] Failed to send trial reminder email:', err);
  }
}

/**
 * 6. Subscription / Trial Expired & Paused Email
 */
export async function sendPartnerSubscriptionExpiredEmail(email: string, businessName: string, monthlyPriceUsd: number) {
  try {
    await resend.emails.send({
      from: fromEmail,
      to: email.toLowerCase().trim(),
      subject: `⚠️ Listing Paused: Free Trial Ended for ${businessName}`,
      html: brandedEmail({
        subject: '⚠️ Listing Paused - Action Required',
        preheader: `Your free trial for ${businessName} has ended and your public listing is paused.`,
        body: `
          <h1 style="${emailStyles.h1}">Public Listing Paused ⚠️</h1>
          <p style="${emailStyles.p}">Your free trial for <strong>${businessName}</strong> has ended. Because no payment method was added, your listing has been automatically hidden from search results.</p>
          <p style="${emailStyles.p}"><strong>Don't worry — your account data and existing inquiries are safe!</strong> You can still log in, review existing messages, and reply to customers.</p>
          ${emailStyles.infoBox(`
            <p style="margin:0 0 6px 0;font-size:13px;color:#6B5040;">🛑 <strong>Listing Status:</strong> Paused (Hidden from Search)</p>
            <p style="margin:0;font-size:13px;color:#6B5040;">⚡ <strong>Reactivate:</strong> Add payment method ($${monthlyPriceUsd}/mo) to restore instant search visibility.</p>
          `)}
          ${emailStyles.button('https://lumobites.net', 'Subscribe to Reactivate')}
          ${emailStyles.divider}
          ${emailStyles.signoff}
        `,
      }),
    });
  } catch (err) {
    console.error('[Resend Email] Failed to send subscription expired email:', err);
  }
}
