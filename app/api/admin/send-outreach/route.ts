import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY)

  const adminSecret = request.headers.get('x-admin-secret')
  if (adminSecret !== 'Lumo2026@') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { emails, subject, message } = await request.json()

  let sent = 0
  let failed = 0
  const errors: any[] = []

  // Send one by one with delay to avoid rate limits
  for (const email of emails) {
    try {
      await resend.emails.send({
        from: 'Lumo Bites <info@lumobites.net>',
        replyTo: 'info@lumobitespet.com',
        to: email.trim(),
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            
            ${message.replace(/\n/g, '<br/>')}
            
            <br/><br/>
            <p style="margin: 0; color: #333;">Best regards,</p>
            <br/>
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-right: 15px; vertical-align: middle;">
                  <img 
                    src="https://lumobites.net/Logo.png" 
                    alt="Lumo Bites" 
                    width="70" 
                    style="display: block;"
                  />
                </td>
                <td style="vertical-align: middle;">
                  <p style="margin: 0; font-weight: bold; color: #8B5E3C; font-size: 16px;">
                    Lumo Bites™ Team
                  </p>
                  <p style="margin: 6px 0 0 0; font-size: 13px; color: #999;">
                    ─────────────────────
                  </p>
                  <p style="margin: 4px 0; font-size: 13px; color: #555;">
                    📧 <a href="mailto:info@lumobitespet.com" style="color: #8B5E3C; text-decoration: none;">info@lumobitespet.com</a>
                  </p>
                  <p style="margin: 4px 0; font-size: 13px; color: #555;">
                    🌐 <a href="https://lumobites.com" style="color: #8B5E3C; text-decoration: none;">lumobites.com</a>
                  </p>
                  <p style="margin: 4px 0; font-size: 13px; color: #555;">
                    🌐 <a href="https://lumobites.net" style="color: #8B5E3C; text-decoration: none;">lumobites.net</a>
                  </p>
                </td>
              </tr>
            </table>

          </div>
        `
      })
      sent++
      // Small delay between emails
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (err: any) {
      failed++
      errors.push({ email, error: err.message })
    }
  }

  try {
    await supabaseAdmin.from('outreach_logs').insert({
      subject: subject,
      recipients: emails,
      total_sent: sent,
      total_failed: failed
    })
  } catch (err) {
    console.error('Failed to log outreach to database:', err)
  }

  return Response.json({ sent, failed, errors })
}
