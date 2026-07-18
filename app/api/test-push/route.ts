import { sendPushNotification } from '@/lib/push';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') || 'ammar.rayyan12@gmail.com';
  
  console.log('=== TEST PUSH START ===');
  console.log('Sending to:', email);
  
  try {
    await sendPushNotification(
      email,
      'Test Notification 🐾',
      'This is a test push notification from Lumo Bites!',
      '/petsitting',
      { type: 'test' }
    );
    console.log('=== TEST PUSH COMPLETE ===');
    return Response.json({ success: true, message: 'Push sent to ' + email });
  } catch (err: any) {
    console.error('=== TEST PUSH ERROR ===', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
