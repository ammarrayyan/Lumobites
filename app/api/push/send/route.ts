import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import admin from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { email, title, body, link, data } = await request.json();

    if (!email || !title || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    // Get all tokens for this email (case-insensitive)
    const { data: tokens, error } = await supabaseAdmin
      .from('push_tokens')
      .select('token')
      .ilike('email', normalizedEmail);

    if (error || !tokens || tokens.length === 0) {
      return NextResponse.json({ success: true, message: 'No push tokens found for user' });
    }

    const tokenStrings = tokens.map((t) => t.token);

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        link: link || '/petsitting',
        ...(data || {}),
      },
      tokens: tokenStrings,
    };

    if (!admin.apps.length) {
      console.warn('Firebase Admin not initialized. Skipping push notification via API.');
      return NextResponse.json({ success: true, message: 'Firebase not configured' });
    }

    const response = await admin.messaging().sendEachForMulticast(message);
    
    // Handle invalid tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokenStrings[idx]);
        }
      });
      
      if (failedTokens.length > 0) {
        await supabaseAdmin
          .from('push_tokens')
          .delete()
          .in('token', failedTokens);
      }
    }

    return NextResponse.json({ success: true, sent: response.successCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
