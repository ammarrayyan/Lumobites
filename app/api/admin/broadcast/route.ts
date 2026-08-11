import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import admin from '@/lib/firebase-admin';

import { isAuthorizedAdmin } from '@/lib/adminAuth';

function checkAuth(req: NextRequest) {
  return isAuthorizedAdmin(req);
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, message, link, audience } = await req.json();

    if (!title || !message || !audience) {
      return NextResponse.json({ error: 'Missing title, message, or audience' }, { status: 400 });
    }

    // 1. Fetch targeted user emails based on audience
    let targetEmails: string[] = [];
    const emailSet = new Set<string>();

    if (audience === 'all') {
      const { data, error } = await supabaseAdmin.from('emails').select('email');
      if (error) throw error;
      data?.forEach(r => r.email && emailSet.add(r.email.toLowerCase().trim()));
    } else if (audience === 'pro') {
      const { data, error } = await supabaseAdmin.from('emails').select('email').eq('is_pro', true);
      if (error) throw error;
      data?.forEach(r => r.email && emailSet.add(r.email.toLowerCase().trim()));
    } else if (audience === 'sitters') {
      const { data, error } = await supabaseAdmin.from('sitters').select('email');
      if (error) throw error;
      data?.forEach(r => r.email && emailSet.add(r.email.toLowerCase().trim()));
    } else if (audience === 'owners') {
      const { data, error } = await supabaseAdmin.from('owner_pets').select('owner_email');
      if (error) throw error;
      data?.forEach(r => r.owner_email && emailSet.add(r.owner_email.toLowerCase().trim()));
    } else {
      return NextResponse.json({ error: 'Invalid audience type' }, { status: 400 });
    }

    targetEmails = Array.from(emailSet);

    if (targetEmails.length === 0) {
      return NextResponse.json({ success: true, message: 'No users found in the selected target audience', dbCount: 0, pushCount: 0 });
    }

    // 2. Insert rows into notifications table in chunks of 1000
    const notificationsToInsert = targetEmails.map(email => ({
      recipient_email: email,
      type: 'broadcast',
      title,
      message,
      link: link || '/petsitting',
      read: false
    }));

    const dbChunkSize = 1000;
    for (let i = 0; i < notificationsToInsert.length; i += dbChunkSize) {
      const chunk = notificationsToInsert.slice(i, i + dbChunkSize);
      const { error: insertError } = await supabaseAdmin.from('notifications').insert(chunk);
      if (insertError) {
        console.error('[Broadcast API] Failed to bulk insert notifications:', insertError);
      }
    }

    // 3. Fetch push tokens for target emails in chunks of 1000
    let allTokens: string[] = [];
    const emailChunkSize = 1000;
    for (let i = 0; i < targetEmails.length; i += emailChunkSize) {
      const emailChunk = targetEmails.slice(i, i + emailChunkSize);
      const { data: chunkTokens, error: chunkErr } = await supabaseAdmin
        .from('push_tokens')
        .select('token')
        .in('email', emailChunk);

      if (chunkErr) {
        console.error('[Broadcast API] Failed to fetch push tokens chunk:', chunkErr);
        continue;
      }
      if (chunkTokens) {
        allTokens.push(...chunkTokens.map(t => t.token));
      }
    }

    const uniqueTokens = Array.from(new Set(allTokens));
    let pushSuccessCount = 0;
    let pushFailureCount = 0;
    const staleTokensToDelete: string[] = [];

    // 4. Send push notifications in batches of 500 via Firebase
    if (admin.apps.length && uniqueTokens.length > 0) {
      const pushChunkSize = 500;
      for (let i = 0; i < uniqueTokens.length; i += pushChunkSize) {
        const batchTokens = uniqueTokens.slice(i, i + pushChunkSize);
        const payload = {
          tokens: batchTokens,
          notification: { title, body: message },
          apns: {
            payload: {
              aps: {
                alert: { title, body: message },
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
            link: link || '/petsitting',
          },
        };

        try {
          const response = await admin.messaging().sendEachForMulticast(payload);
          pushSuccessCount += response.successCount;
          pushFailureCount += response.failureCount;

          // Collect stale/expired tokens
          response.responses.forEach((resp, idx) => {
            if (!resp.success && resp.error) {
              const code = resp.error.code;
              if (
                code === 'messaging/registration-token-not-registered' ||
                code === 'messaging/invalid-registration-token'
              ) {
                staleTokensToDelete.push(batchTokens[idx]);
              }
            }
          });
        } catch (pushErr) {
          console.error('[Broadcast API] Multicast send error for batch:', pushErr);
        }
      }

      // Cleanup stale tokens in chunks of 1000
      if (staleTokensToDelete.length > 0) {
        const cleanupChunkSize = 1000;
        for (let i = 0; i < staleTokensToDelete.length; i += cleanupChunkSize) {
          const deleteChunk = staleTokensToDelete.slice(i, i + cleanupChunkSize);
          await supabaseAdmin.from('push_tokens').delete().in('token', deleteChunk);
        }
        console.log(`[Broadcast API] Cleaned up ${staleTokensToDelete.length} stale push tokens`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Broadcast successfully sent to ${targetEmails.length} users.`,
      dbCount: targetEmails.length,
      pushCount: uniqueTokens.length,
      pushSuccess: pushSuccessCount,
      pushFailed: pushFailureCount,
      staleCleaned: staleTokensToDelete.length
    });

  } catch (err: any) {
    console.error('[Admin Broadcast POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
