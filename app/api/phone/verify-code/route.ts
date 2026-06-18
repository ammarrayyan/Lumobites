import twilio from 'twilio'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  const { phone, code, email } = await request.json()
  
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )
  
  const verification = await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
    .verificationChecks.create({ to: phone, code })
  
  if (verification.status === 'approved') {
    await supabaseAdmin
      .from('emails')
      .update({ phone_verified: true, verified_phone: phone })
      .eq('email', email)
    
    return Response.json({ success: true })
  }
  
  return Response.json({ success: false, error: 'Invalid code' })
}
