import twilio from 'twilio'

export async function POST(request: Request) {
  const { phone } = await request.json()
  
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )
  
  await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
    .verifications.create({ to: phone, channel: 'sms' })
  
  return Response.json({ success: true })
}
