import admin from '@/lib/firebase-admin';
import { supabaseAdmin } from '@/lib/supabase';

export async function sendPushNotification(email: string, title: string, body: string, link: string = '/petsitting', customData?: Record<string, string>) {
  try {
    const { data: tokens } = await supabaseAdmin
      .from('push_tokens')
      .select('token')
      .ilike('email', email.toLowerCase());

    if (!tokens || tokens.length === 0) return;

    const tokenStrings = tokens.map(t => t.token);

    const message = {
      notification: { title, body },
      data: {
        link,
        ...(customData || {})
      },
      tokens: tokenStrings,
    };

    if (!admin.apps.length) {
      console.warn('Firebase Admin not initialized. Skipping push notification.');
      return;
    }

    const response = await admin.messaging().sendEachForMulticast(message);

    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokenStrings[idx]);
        }
      });
      if (failedTokens.length > 0) {
        await supabaseAdmin.from('push_tokens').delete().in('token', failedTokens);
      }
    }
  } catch (error) {
    console.error('Push notification error:', error);
  }
}
