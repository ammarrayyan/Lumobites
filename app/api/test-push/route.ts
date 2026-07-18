import { sendPushNotification } from '@/lib/push';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') || 'ammar.rayyan12@gmail.com';
  
  console.log('=== TEST PUSH START ===', email);
  await sendPushNotification(email, 'Test 🐾', 'Test notification', '/petsitting');
  console.log('=== TEST PUSH COMPLETE ===');
  
  return Response.json({ success: true });
}
