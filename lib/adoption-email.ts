import { Resend } from 'resend';
import { brandedEmail, emailStyles } from '@/lib/email-template';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';

/**
 * 1. On Shelter Registration Submission
 */
export async function sendShelterRegistrationEmail(toEmail: string, orgName: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const subject = `Application Received — Lumo Bites Rescue Partner`;
    const html = brandedEmail({
      subject,
      preheader: `We've received your application for ${orgName}`,
      body: `
        <h1 style="${emailStyles.h1}">Application Received</h1>
        <p style="${emailStyles.p}">Thank you for applying to join Lumo Bites as a verified rescue partner!</p>
        
        ${emailStyles.infoBox(`
          <p style="${emailStyles.pSmall}"><strong>Organization:</strong> ${orgName}</p>
          <p style="${emailStyles.pSmall}"><strong>Status:</strong> Under Review</p>
        `)}

        <p style="${emailStyles.p}">Our team will review your organization details. Once approved, you will receive an email confirmation and can begin posting adoptable pets to the Lumo Bites network.</p>
        <p style="${emailStyles.pSmall}">If you have any questions in the meantime, please reach out to support.</p>
      `
    });

    await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject,
      html
    });
  } catch (err) {
    console.error('[Adoption Email] Registration email failed:', err);
  }
}

/**
 * 2. On Shelter Application Approved
 */
export async function sendShelterApprovalEmail(toEmail: string, orgName: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const subject = `Congratulations! Your Shelter Account is Approved — Lumo Bites`;
    const dashboardUrl = `https://lumobites.net/adoption/shelter/dashboard`;
    const html = brandedEmail({
      subject,
      preheader: `${orgName} is now an approved rescue partner on Lumo Bites`,
      body: `
        <h1 style="${emailStyles.h1}">Account Approved! 🎉</h1>
        <p style="${emailStyles.p}">Great news! <strong>${orgName}</strong> has been approved as an official rescue partner on Lumo Bites.</p>
        
        <p style="${emailStyles.p}">You can now log in to your shelter dashboard to post pets, manage adoptable listings, and reply to adopter inquiries in real-time.</p>

        <div style="text-align:center;margin:28px 0;">
          <a href="${dashboardUrl}" style="background-color:#8B5E3C;color:#FFFFFF;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 28px;border-radius:12px;display:inline-block;">
            Go to Shelter Dashboard &rarr;
          </a>
        </div>
      `
    });

    await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject,
      html
    });
  } catch (err) {
    console.error('[Adoption Email] Approval email failed:', err);
  }
}

/**
 * 3. On Shelter Application Rejected
 */
export async function sendShelterRejectionEmail(toEmail: string, orgName: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const subject = `Update on your Lumo Bites Shelter Application`;
    const html = brandedEmail({
      subject,
      preheader: `Update regarding your shelter application for ${orgName}`,
      body: `
        <h1 style="${emailStyles.h1}">Shelter Application Update</h1>
        <p style="${emailStyles.p}">Thank you for submitting an application for <strong>${orgName}</strong> to join Lumo Bites.</p>
        <p style="${emailStyles.p}">At this time, we are unable to approve your application. If you believe this is an error or would like to submit additional organization credentials, please reply to support.</p>
      `
    });

    await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject,
      html
    });
  } catch (err) {
    console.error('[Adoption Email] Rejection email failed:', err);
  }
}

/**
 * 4. On New Adopter Inquiry
 */
export async function sendAdoptionInquiryEmail(
  toEmail: string,
  petName: string,
  petId: string,
  adopterEmail: string,
  messagePreview: string
) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const subject = `New Adoption Inquiry for ${petName} — Lumo Bites`;
    const chatUrl = `https://lumobites.net/adoption/messages/${petId}`;
    const html = brandedEmail({
      subject,
      preheader: `New message regarding ${petName} from ${adopterEmail}`,
      body: `
        <h1 style="${emailStyles.h1}">New Adoption Inquiry 🐾</h1>
        <p style="${emailStyles.p}">An adopter has sent a new inquiry regarding <strong>${petName}</strong>.</p>
        
        ${emailStyles.infoBox(`
          <p style="${emailStyles.pSmall}"><strong>From:</strong> ${adopterEmail}</p>
          <p style="${emailStyles.pSmall}"><strong>Pet:</strong> ${petName}</p>
          <p style="${emailStyles.pSmall}"><strong>Message:</strong> "${messagePreview}"</p>
        `)}

        <div style="text-align:center;margin:28px 0;">
          <a href="${chatUrl}" style="background-color:#8B5E3C;color:#FFFFFF;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 28px;border-radius:12px;display:inline-block;">
            View & Reply in Conversation &rarr;
          </a>
        </div>
      `
    });

    await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject,
      html
    });
  } catch (err) {
    console.error('[Adoption Email] Inquiry email failed:', err);
  }
}
