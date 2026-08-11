import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import admin from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, firebaseToken } = body;

    if (!email || !phone) {
      return NextResponse.json({ error: 'Email and phone number are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    let verifiedPhone = phone.trim();

    // Verify Firebase token if admin is initialized and token is provided
    if (admin.apps.length > 0 && firebaseToken) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
        if (decodedToken.phone_number) {
          verifiedPhone = decodedToken.phone_number;
        }
      } catch (tokenErr: any) {
        console.error('[Verify Phone API] Firebase token verification failed:', tokenErr);
        return NextResponse.json({ error: `Firebase token verification failed: ${tokenErr.message}` }, { status: 400 });
      }
    } else if (admin.apps.length === 0) {
      console.warn('[Verify Phone API] Firebase Admin not initialized. Skipping ID token verification.');
    }

    // Check if user email record exists in Supabase emails table
    const { data: existingRecord, error: fetchError } = await supabaseAdmin
      .from('emails')
      .select('email, is_pro')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (fetchError) {
      console.error('[Verify Phone API] Fetch error:', fetchError);
    }

    let dbError;
    if (existingRecord) {
      // Update existing record
      const { error } = await supabaseAdmin
        .from('emails')
        .update({
          verified_phone: verifiedPhone,
          phone_verified: true
        })
        .eq('email', cleanEmail);
      dbError = error;
    } else {
      // Insert new record (first-time visitor booking request)
      const { error } = await supabaseAdmin
        .from('emails')
        .insert({
          email: cleanEmail,
          verified_phone: verifiedPhone,
          phone_verified: true,
          is_pro: false,
          source: 'phone_verification',
          created_at: new Date().toISOString()
        });
      dbError = error;
    }

    if (dbError) {
      console.error('[Verify Phone API] Supabase DB write error:', dbError);
      return NextResponse.json({ error: 'Failed to update phone verification status in database' }, { status: 500 });
    }

    console.log(`[Verify Phone API] Successfully verified phone for ${cleanEmail}: ${verifiedPhone}`);
    return NextResponse.json({ success: true, verifiedPhone });

  } catch (err: any) {
    console.error('[Verify Phone API] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
