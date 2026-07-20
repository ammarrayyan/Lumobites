import { NextRequest, NextResponse } from 'next/server'
import { sendPushNotification } from '@/lib/push'

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })
  
  const result = await sendPushNotification(
    email,
    'Direct Test 🔔',
    'This is a direct test notification - ' + new Date().toISOString(),
    '/petsitting',
    { type: 'test' }
  )
  
  return NextResponse.json({ sent: true, result })
}
