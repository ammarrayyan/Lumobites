import { Resend } from 'resend'

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
        from: 'Lumo Bites <info@lumobitespet.com>',
        to: email.trim(),
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            ${message.replace(/\n/g, '<br/>')}
            <br/><br/>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
            <p style="font-size: 12px; color: #999;">
              Lumo Bites | lumobites.net | info@lumobitespet.com
            </p>
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

  return Response.json({ sent, failed, errors })
}
