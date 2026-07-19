import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

export async function POST(request: Request) {
  const { phone } = await request.json()
  
  if (!phone) return Response.json({ error: 'Phone required' }, { status: 400 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return Response.json({ error: 'Supabase configuration is missing' }, { status: 500 })
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  // Save to Supabase
  const { error: upsertError } = await supabaseAdmin
    .from('sms_subscribers')
    .upsert({ 
      phone: phone.trim(),
      opted_in: true,
      created_at: new Date().toISOString()
    })

  if (upsertError) {
    console.error('Supabase upsert error:', upsertError)
    return Response.json({ error: upsertError.message }, { status: 500 })
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('Twilio keys are not configured. SMS not sent, but opted-in successfully.')
    return Response.json({ success: true, message: 'Opted in, but welcome SMS not sent due to missing Twilio config' })
  }

  try {
    const client = twilio(accountSid, authToken)
    await client.messages.create({
      body: `Welcome to Lumo Bites! 🐾 You'll now receive lost pet alerts near you. Reply STOP to unsubscribe anytime. lumobites.net`,
      from: fromNumber,
      to: phone.trim()
    })
  } catch (twilioErr: any) {
    console.error('Twilio error:', twilioErr)
    return Response.json({ success: true, message: `Opted in, but welcome SMS failed: ${twilioErr.message}` })
  }

  return Response.json({ success: true })
}
