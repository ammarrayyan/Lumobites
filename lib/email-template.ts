/**
 * Shared branded email template for Lumo Bites.
 * Wraps any HTML body content with consistent header, footer, and styling.
 */

const LOGO_SVG = `
<div style="text-align:center; padding: 10px 0;">
  <img src="https://lumobites.net/lumo-bites-logo.png" alt="Lumo Bites" width="120" style="display:block; margin: 0 auto; max-width: 120px;" />
</div>
`;

export function brandedEmail({
  subject,
  preheader = '',
  body,
}: {
  subject: string;
  preheader?: string;
  body: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ''}

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F0E8;padding:32px 16px;">
    <tr>
      <td align="center">
        <!-- Email card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

          <!-- HEADER -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              ${LOGO_SVG}
            </td>
          </tr>

          <!-- BODY CARD -->
          <tr>
            <td style="background-color:#FFFFFF;border-radius:20px;border:1px solid #E8DDD4;padding:36px 32px;box-shadow:0 4px 20px rgba(59,36,16,0.06);">
              ${body}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding:24px 16px 8px 16px;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#A08068;">
                © 2026 Lumo Bites
              </p>
              <p style="margin:0 0 10px 0;font-size:11px;color:#B8A090;">
                <a href="https://lumobites.net/privacy" style="color:#8B6A50;text-decoration:none;">Privacy Policy</a>
                &nbsp;·&nbsp;
                <a href="https://lumobites.net/terms" style="color:#8B6A50;text-decoration:none;">Terms of Service</a>
                &nbsp;·&nbsp;
                <a href="https://lumobites.net" style="color:#8B6A50;text-decoration:none;">lumobites.net</a>
              </p>
              <p style="margin:0;font-size:11px;color:#C4A898;font-style:italic;">
                This is an automated message — please do not reply. For support email <a href="mailto:info@lumobitespet.com" style="color:#8B6A50;text-decoration:none;">info@lumobitespet.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Reusable styled components for email body content */

export const emailStyles = {
  h1: `font-size:24px;font-weight:800;color:#3B2410;margin:0 0 8px 0;line-height:1.2;`,
  h2: `font-size:20px;font-weight:700;color:#3B2410;margin:0 0 8px 0;`,
  p: `font-size:15px;line-height:1.7;color:#4A3728;margin:0 0 16px 0;`,
  pSmall: `font-size:13px;line-height:1.6;color:#6B5040;margin:0 0 12px 0;`,
  divider: `<div style="height:1px;background-color:#F0E6DF;margin:24px 0;"></div>`,
  codeBox: (code: string) => `
    <div style="background-color:#FAF6F4;border:2px dashed #8B6A50;border-radius:14px;padding:24px;text-align:center;margin:24px 0;">
      <span style="font-family:'Courier New',Courier,monospace;font-size:38px;font-weight:900;color:#3B2410;letter-spacing:8px;">${code}</span>
    </div>
  `,
  infoBox: (content: string) => `
    <div style="background-color:#FAF6F4;border:1px solid #E8DDD4;border-radius:14px;padding:20px;margin:20px 0;">
      ${content}
    </div>
  `,
  highlightBox: (content: string) => `
    <div style="background-color:#FFF8F4;border:1px dashed #C4956A;border-radius:14px;padding:20px;margin:20px 0;text-align:center;">
      ${content}
    </div>
  `,
  button: (href: string, label: string) => `
    <div style="text-align:center;margin:24px 0;">
      <a href="${href}" style="background-color:#3B2410;color:#F5F0E8;font-weight:700;font-size:14px;text-decoration:none;padding:14px 32px;border-radius:10px;display:inline-block;">${label}</a>
    </div>
  `,
  signoff: `<p style="font-size:14px;line-height:1.6;color:#6B5040;margin:0;">Warm regards,<br/><strong style="color:#3B2410;">The Lumo Bites Team 🐾</strong></p>`,
};
