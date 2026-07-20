import admin from '@/lib/firebase-admin';
import { supabaseAdmin } from '@/lib/supabase';

export async function sendPushNotification(email: string, title: string, body: string, link: string = '/petsitting', customData?: Record<string, string>) {
  console.log('=== PUSH NOTIFICATION DEBUG ===');
  console.log('Sending to email:', email);
  console.log('Title:', title);
  console.log('Body:', body);

  if (!admin.apps.length) {
    console.log('❌ Firebase Admin not initialized');
    try {
      await supabaseAdmin.from('push_logs').insert({
        email,
        success: 0,
        failed: 0,
        error: 'Firebase Admin not initialized',
        created_at: new Date().toISOString()
      });
    } catch (e) {}
    return;
  }
  console.log('✅ Firebase Admin initialized');

  // Look up ONLY the most recent token (case-insensitive)
  const { data: tokens, error } = await supabaseAdmin
    .from('push_tokens')
    .select('token, device, created_at')
    .ilike('email', email.toLowerCase())
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.log('Token lookup error:', error);
  }

  if (!tokens || tokens.length === 0) {
    console.log('❌ No tokens found for email:', email);
    try {
      await supabaseAdmin.from('push_logs').insert({
        email,
        success: 0,
        failed: 0,
        error: `No tokens found in push_tokens table${error ? `: ${error.message}` : ''}`,
        created_at: new Date().toISOString()
      });
    } catch (e) {}
    return;
  }

  console.log('Most recent token:', tokens[0].token.substring(0, 30) + '...');
  console.log('Device:', tokens[0].device);
  console.log('Created:', tokens[0].created_at);

  const tokenStrings = tokens.map(t => t.token);

  const message = {
    tokens: tokenStrings,
    notification: { title, body },
    apns: {
      payload: {
        aps: {
          alert: { title, body },
          sound: 'default',
          badge: 1,
          'content-available': 1,
        },
      },
      headers: {
        'apns-priority': '10',
        'apns-push-type': 'alert',
      },
    },
    data: {
      link,
      ...(customData || {}),
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log('Firebase result:', JSON.stringify(response));

    // Save result to Supabase for debugging
    try {
      await supabaseAdmin.from('push_logs').insert({
        email,
        success: response.successCount,
        failed: response.failureCount,
        error: response.responses[0]?.error?.message || null,
        created_at: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to log push to DB:', e);
    }

    response.responses.forEach((r, i) => {
      console.log(`Token ${i}: success=${r.success}`);
      if (!r.success) {
        console.log(`Error:`, JSON.stringify(r.error));
      }
    });

    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
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
    try {
      await supabaseAdmin.from('push_logs').insert({
        email,
        success: 0,
        failed: 1,
        error: err?.message || String(err),
        created_at: new Date().toISOString()
      });
    } catch (e) {}
  }
}
