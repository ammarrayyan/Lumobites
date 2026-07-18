import admin from '@/lib/firebase-admin';
import { supabaseAdmin } from '@/lib/supabase';

export async function sendPushNotification(email: string, title: string, body: string, link: string = '/petsitting', customData?: Record<string, string>) {
  console.log('=== PUSH NOTIFICATION DEBUG ===');
  console.log('Sending to email:', email);
  console.log('Title:', title);
  console.log('Body:', body);

  if (!admin.apps.length) {
    console.log('❌ Firebase Admin not initialized');
    return;
  }
  console.log('✅ Firebase Admin initialized');

  // Look up tokens (case-insensitive)
  const { data: tokens, error } = await supabaseAdmin
    .from('push_tokens')
    .select('token')
    .ilike('email', email.toLowerCase());

  console.log('Tokens found:', tokens?.length || 0);
  if (error) console.log('Token lookup error:', error);

  if (!tokens || tokens.length === 0) {
    console.log('❌ No tokens found for email:', email);
    return;
  }

  const tokenStrings = tokens.map(t => t.token);
  console.log('Sending to tokens:', tokenStrings.map(t => t.substring(0, 20) + '...'));

  const message = {
    notification: { title, body },
    data: {
      link,
      ...(customData || {}),
    },
    tokens: tokenStrings,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log('✅ Push sent:', response.successCount, 'success,', response.failureCount, 'failed');

    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.log('❌ Token failed:', resp.error?.message, '| Token:', tokenStrings[idx].substring(0, 20) + '...');
          failedTokens.push(tokenStrings[idx]);
        }
      });
      if (failedTokens.length > 0) {
        await supabaseAdmin.from('push_tokens').delete().in('token', failedTokens);
        console.log('🗑️ Removed', failedTokens.length, 'invalid token(s)');
      }
    }
  } catch (err: any) {
    console.log('❌ Push send error:', err?.message || err);
  }
}
