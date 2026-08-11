import twilio from 'twilio'
import { isAuthorizedAdmin } from '@/lib/adminAuth'

export async function POST(request: Request) {
  if (!isAuthorizedAdmin(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    return Response.json({ error: 'Twilio configuration is missing' }, { status: 500 })
  }

  const client = twilio(accountSid, authToken)
  const { numbers, message } = await request.json()

  let sent = 0
  let failed = 0
  const errors: any[] = []

  for (const number of numbers) {
    try {
      await client.messages.create({
        body: message,
        from: fromNumber,
        to: number.trim()
      })
      sent++
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (err: any) {
      failed++
      errors.push({ number, error: err.message })
    }
  }

  return Response.json({ sent, failed, errors })
}
