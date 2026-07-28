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

    const res = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject,
      html
    });

    if (res.error) {
      console.warn('[Adoption Email] Registration email notice:', res.error.message || res.error);
    } else {
      console.log('[Adoption Email] Registration email sent successfully:', res.data?.id);
    }
  } catch (err) {
    console.error('[Adoption Email] Registration email threw exception:', err);
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

    const res = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject,
      html
    });

    if (res.error) {
      console.warn('[Adoption Email] Approval email notice:', res.error.message || res.error);
    } else {
      console.log('[Adoption Email] Approval email sent successfully:', res.data?.id);
    }
  } catch (err) {
    console.error('[Adoption Email] Approval email threw exception:', err);
  }
}

/**
 * 3. On Shelter Application Rejected
 */
export async function sendShelterRejectionEmail(toEmail: string, orgName: string, rejectionReason?: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const subject = `Update on your Lumo Bites Shelter Application`;
    const html = brandedEmail({
      subject,
      preheader: `Update regarding your shelter application for ${orgName}`,
      body: `
        <h1 style="${emailStyles.h1}">Shelter Application Update</h1>
        <p style="${emailStyles.p}">Thank you for submitting an application for <strong>${orgName}</strong> to join Lumo Bites as a rescue partner.</p>
        <p style="${emailStyles.p}">At this time, we are unable to approve your application.</p>
        
        ${rejectionReason ? emailStyles.infoBox(`
          <p style="${emailStyles.pSmall}"><strong>Reviewer Note:</strong></p>
          <p style="font-size:14px;line-height:1.6;color:#854D0E;margin:0;">"${rejectionReason}"</p>
        `) : ''}

        <p style="${emailStyles.p}">If you believe this is an error or would like to update your organization credentials and re-apply, you may re-submit your details anytime directly on Lumo Bites.</p>
      `
    });

    const res = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject,
      html
    });

    if (res.error) {
      console.warn('[Adoption Email] Rejection email notice:', res.error.message || res.error);
    } else {
      console.log('[Adoption Email] Rejection email sent successfully:', res.data?.id);
    }
  } catch (err) {
    console.error('[Adoption Email] Rejection email threw exception:', err);
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

    const res = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject,
      html
    });

    if (res.error) {
      console.warn('[Adoption Email] Inquiry email notice:', res.error.message || res.error);
    } else {
      console.log('[Adoption Email] Inquiry email sent successfully:', res.data?.id);
    }
  } catch (err) {
    console.error('[Adoption Email] Inquiry email threw exception:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Veterinary Boarding Email Notifications
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 5. On Vet Clinic Registration Submission
 */
export async function sendVetClinicRegistrationEmail(toEmail: string, clinicName: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const subject = `Application Received — Lumo Bites Veterinary Boarding Partner`;
    const html = brandedEmail({
      subject,
      preheader: `We've received your application for ${clinicName}`,
      body: `
        <h1 style="${emailStyles.h1}">Application Received</h1>
        <p style="${emailStyles.p}">Thank you for applying to join Lumo Bites as a verified Veterinary Boarding partner!</p>

        ${emailStyles.infoBox(`
          <p style="${emailStyles.pSmall}"><strong>Clinic:</strong> ${clinicName}</p>
          <p style="${emailStyles.pSmall}"><strong>Status:</strong> Under Review</p>
        `)}

        <p style="${emailStyles.p}">Our team will review your clinic details and veterinary license. Once approved, you will receive an email confirmation and your clinic will appear in our Find a Sitter search.</p>
        <p style="${emailStyles.pSmall}">If you have any questions in the meantime, please reach out to support.</p>
      `
    });

    const res = await resend.emails.send({ from: fromEmail, to: [toEmail], subject, html });
    if (res.error) {
      console.warn('[Vet Email] Registration email notice:', res.error.message || res.error);
    } else {
      console.log('[Vet Email] Registration email sent successfully:', res.data?.id);
    }
  } catch (err) {
    console.error('[Vet Email] Registration email threw exception:', err);
  }
}

/**
 * 6. On Vet Clinic Application Approved
 */
export async function sendVetClinicApprovalEmail(toEmail: string, clinicName: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const subject = `Congratulations! Your Veterinary Clinic is Approved — Lumo Bites`;
    const dashboardUrl = `https://lumobites.net/vet-boarding/dashboard`;
    const html = brandedEmail({
      subject,
      preheader: `${clinicName} is now an approved Veterinary Boarding partner on Lumo Bites`,
      body: `
        <h1 style="${emailStyles.h1}">Clinic Approved! 🎉</h1>
        <p style="${emailStyles.p}">Great news! <strong>${clinicName}</strong> has been approved as an official Veterinary Boarding partner on Lumo Bites.</p>

        <p style="${emailStyles.p}">Your clinic will now appear in our Find a Sitter search alongside local pet sitters, with a 🏥 Veterinary Clinic badge so pet owners can find you easily.</p>

        <div style="text-align:center;margin:28px 0;">
          <a href="${dashboardUrl}" style="background-color:#8B5E3C;color:#FFFFFF;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 28px;border-radius:12px;display:inline-block;">
            Go to Clinic Dashboard &rarr;
          </a>
        </div>
      `
    });

    const res = await resend.emails.send({ from: fromEmail, to: [toEmail], subject, html });
    if (res.error) {
      console.warn('[Vet Email] Approval email notice:', res.error.message || res.error);
    } else {
      console.log('[Vet Email] Approval email sent successfully:', res.data?.id);
    }
  } catch (err) {
    console.error('[Vet Email] Approval email threw exception:', err);
  }
}

/**
 * 7. On Vet Clinic Application Rejected
 */
export async function sendVetClinicRejectionEmail(toEmail: string, clinicName: string, rejectionReason?: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const subject = `Update on your Lumo Bites Veterinary Boarding Application`;
    const html = brandedEmail({
      subject,
      preheader: `Update regarding your veterinary boarding application for ${clinicName}`,
      body: `
        <h1 style="${emailStyles.h1}">Application Update</h1>
        <p style="${emailStyles.p}">Thank you for submitting an application for <strong>${clinicName}</strong> to join Lumo Bites as a Veterinary Boarding partner.</p>
        <p style="${emailStyles.p}">At this time, we are unable to approve your application.</p>

        ${rejectionReason ? emailStyles.infoBox(`
          <p style="${emailStyles.pSmall}"><strong>Reviewer Note:</strong></p>
          <p style="font-size:14px;line-height:1.6;color:#854D0E;margin:0;">"${rejectionReason}"</p>
        `) : ''}

        <p style="${emailStyles.p}">If you believe this is an error or would like to update your clinic credentials and re-apply, you may re-submit your details anytime directly on Lumo Bites.</p>
      `
    });

    const res = await resend.emails.send({ from: fromEmail, to: [toEmail], subject, html });
    if (res.error) {
      console.warn('[Vet Email] Rejection email notice:', res.error.message || res.error);
    } else {
      console.log('[Vet Email] Rejection email sent successfully:', res.data?.id);
    }
  } catch (err) {
    console.error('[Vet Email] Rejection email threw exception:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Notification Email for New Partner Applications
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 8. Admin Email Notification on New Partner Application Submission
 */
export async function sendAdminNewPartnerNotificationEmail(
  partnerType: 'Shelter' | 'Vet Clinic' | 'Pet Daycare',
  orgName: string,
  applicantEmail: string,
  city: string,
  state?: string,
  phone?: string,
  website?: string
) {
  if (!process.env.RESEND_API_KEY) return;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'info@lumobitespet.com';
  try {
    const locationStr = [city, state].filter(Boolean).join(', ');
    const subject = `New ${partnerType} Application — ${orgName}`;
    const adminUrl = `https://lumobites.net/admin`;

    const html = brandedEmail({
      subject,
      preheader: `New ${partnerType} application pending review: ${orgName}`,
      body: `
        <h1 style="${emailStyles.h1}">New ${partnerType} Application 📋</h1>
        <p style="${emailStyles.p}">A new partner application has been submitted and is waiting for your review in the Admin Panel.</p>

        ${emailStyles.infoBox(`
          <p style="${emailStyles.pSmall}"><strong>Type:</strong> ${partnerType}</p>
          <p style="${emailStyles.pSmall}"><strong>Name:</strong> ${orgName}</p>
          <p style="${emailStyles.pSmall}"><strong>Email:</strong> ${applicantEmail}</p>
          <p style="${emailStyles.pSmall}"><strong>Location:</strong> ${locationStr || 'N/A'}</p>
          ${phone ? `<p style="${emailStyles.pSmall}"><strong>Phone:</strong> ${phone}</p>` : ''}
          ${website ? `<p style="${emailStyles.pSmall}"><strong>Website:</strong> <a href="${website}" style="color:#8B5E3C;text-decoration:underline;">${website}</a></p>` : ''}
        `)}

        <div style="text-align:center;margin:28px 0;">
          <a href="${adminUrl}" style="background-color:#8B5E3C;color:#FFFFFF;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 28px;border-radius:12px;display:inline-block;">
            Open Admin Panel to Review &rarr;
          </a>
        </div>
      `
    });

    const res = await resend.emails.send({
      from: fromEmail,
      to: [adminEmail],
      subject,
      html
    });

    if (res.error) {
      console.warn(`[Admin Email] New ${partnerType} notification notice:`, res.error.message || res.error);
    } else {
      console.log(`[Admin Email] New ${partnerType} notification sent successfully to ${adminEmail}:`, res.data?.id);
    }
  } catch (err) {
    console.error(`[Admin Email] New ${partnerType} notification email threw exception:`, err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Pet Daycare Email Notifications
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 9. On Pet Daycare Registration Submission
 */
export async function sendDaycareRegistrationEmail(toEmail: string, businessName: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const subject = `Application Received — Lumo Bites Pet Daycare Partner`;
    const html = brandedEmail({
      subject,
      preheader: `We've received your application for ${businessName}`,
      body: `
        <h1 style="${emailStyles.h1}">Application Received</h1>
        <p style="${emailStyles.p}">Thank you for applying to join Lumo Bites as a verified Pet Daycare partner!</p>

        ${emailStyles.infoBox(`
          <p style="${emailStyles.pSmall}"><strong>Business:</strong> ${businessName}</p>
          <p style="${emailStyles.pSmall}"><strong>Status:</strong> Under Review</p>
        `)}

        <p style="${emailStyles.p}">Our team will review your daycare details. Once approved, you will receive an email confirmation and your daycare will appear in our Pet Daycare search.</p>
        <p style="${emailStyles.pSmall}">If you have any questions in the meantime, please reach out to support.</p>
      `
    });

    const res = await resend.emails.send({ from: fromEmail, to: [toEmail], subject, html });
    if (res.error) {
      console.warn('[Daycare Email] Registration email notice:', res.error.message || res.error);
    } else {
      console.log('[Daycare Email] Registration email sent successfully:', res.data?.id);
    }
  } catch (err) {
    console.error('[Daycare Email] Registration email threw exception:', err);
  }
}

/**
 * 10. On Pet Daycare Application Approved
 */
export async function sendDaycareApprovalEmail(toEmail: string, businessName: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const subject = `Congratulations! Your Pet Daycare is Approved — Lumo Bites`;
    const dashboardUrl = `https://lumobites.net/pet-daycare/dashboard`;
    const html = brandedEmail({
      subject,
      preheader: `${businessName} is now an approved Pet Daycare partner on Lumo Bites`,
      body: `
        <h1 style="${emailStyles.h1}">Daycare Approved! 🎉</h1>
        <p style="${emailStyles.p}">Great news! <strong>${businessName}</strong> has been approved as an official Pet Daycare partner on Lumo Bites.</p>

        <p style="${emailStyles.p}">Your daycare will now appear in our Pet Services search alongside verified sitters, with a 🐕 Pet Daycare badge so pet owners can send inquiries directly.</p>

        <div style="text-align:center;margin:28px 0;">
          <a href="${dashboardUrl}" style="background-color:#8B5E3C;color:#FFFFFF;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 28px;border-radius:12px;display:inline-block;">
            Go to Daycare Dashboard &rarr;
          </a>
        </div>
      `
    });

    const res = await resend.emails.send({ from: fromEmail, to: [toEmail], subject, html });
    if (res.error) {
      console.warn('[Daycare Email] Approval email notice:', res.error.message || res.error);
    } else {
      console.log('[Daycare Email] Approval email sent successfully:', res.data?.id);
    }
  } catch (err) {
    console.error('[Daycare Email] Approval email threw exception:', err);
  }
}

/**
 * 11. On Pet Daycare Application Rejected
 */
export async function sendDaycareRejectionEmail(toEmail: string, businessName: string, rejectionReason?: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const subject = `Update on your Lumo Bites Pet Daycare Application`;
    const html = brandedEmail({
      subject,
      preheader: `Update regarding your pet daycare application for ${businessName}`,
      body: `
        <h1 style="${emailStyles.h1}">Application Update</h1>
        <p style="${emailStyles.p}">Thank you for submitting an application for <strong>${businessName}</strong> to join Lumo Bites as a Pet Daycare partner.</p>
        <p style="${emailStyles.p}">At this time, we are unable to approve your application.</p>

        ${rejectionReason ? emailStyles.infoBox(`
          <p style="${emailStyles.pSmall}"><strong>Reviewer Note:</strong></p>
          <p style="font-size:14px;line-height:1.6;color:#854D0E;margin:0;">"${rejectionReason}"</p>
        `) : ''}

        <p style="${emailStyles.p}">If you believe this is an error or would like to update your daycare credentials and re-apply, you may re-submit your details anytime directly on Lumo Bites.</p>
      `
    });

    const res = await resend.emails.send({ from: fromEmail, to: [toEmail], subject, html });
    if (res.error) {
      console.warn('[Daycare Email] Rejection email notice:', res.error.message || res.error);
    } else {
      console.log('[Daycare Email] Rejection email sent successfully:', res.data?.id);
    }
  } catch (err) {
    console.error('[Daycare Email] Rejection email threw exception:', err);
  }
}
