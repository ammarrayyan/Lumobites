import twilio from 'twilio'

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()
    
    console.log('TWILIO_ACCOUNT_SID starts with:', process.env.TWILIO_ACCOUNT_SID?.substring(0, 4))
    console.log('TWILIO_VERIFY_SERVICE_SID starts with:', process.env.TWILIO_VERIFY_SERVICE_SID?.substring(0, 4))
    console.log('TWILIO_AUTH_TOKEN length:', process.env.TWILIO_AUTH_TOKEN?.length)

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID, // Should start with AC
      process.env.TWILIO_AUTH_TOKEN
    )
    
    // Service SID used separately here:
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!) // Should start with VA
      .verifications.create({ to: phone, channel: 'sms' })
    
    return Response.json({ success: true })
  } catch (error: any) {
    console.error('Twilio error:', error.message, error.code)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
