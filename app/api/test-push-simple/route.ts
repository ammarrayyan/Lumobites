import { NextRequest, NextResponse } from 'next/server'
import admin from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  try {
    const message = {
      token: token,
      notification: {
        title: "Lumo Bites Test",
        body: "Push notification test",
      },
      apns: {
        headers: {
          "apns-priority": "10",
          "apns-push-type": "alert",
        },
        payload: {
          aps: {
            alert: {
              title: "Lumo Bites Test",
              body: "Push notification test",
            },
            sound: "default",
            badge: 1,
          },
        },
      },
    }
    const result = await admin.messaging().send(message)
    return NextResponse.json({ success: true, messageId: result })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: 500 })
  }
}
