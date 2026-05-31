import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import { brandedEmail, emailStyles } from '@/lib/email-template';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { postId, email } = body;

    if (!postId || !email) {
      return NextResponse.json({ error: 'Missing postId or email' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Fetch the post from DB
    const { data: post, error } = await supabaseAdmin
      .from('city_board_posts')
      .select('*')
      .eq('post_id', postId)
      .eq('category', 'Pet Twin')
      .maybeSingle();

    if (error || !post) {
      return NextResponse.json({ error: 'Shared match result not found' }, { status: 404 });
    }

    // 2. Extract email and token
    let associatedEmail: string | null = post.email || null;
    let removalToken: string | null = post.removal_token || null;

    try {
      const payload = JSON.parse(post.content);
      if (!associatedEmail && payload.email) associatedEmail = payload.email;
      if (!removalToken && payload.removal_token) removalToken = payload.removal_token;
    } catch (e) {
      console.warn('[Remove Request] Failed to parse content JSON payload', e);
    }

    // 3. Verify association
    if (!associatedEmail) {
      return NextResponse.json({ 
        error: 'This result was shared anonymously and cannot be self-removed via email. Please contact support.' 
      }, { status: 400 });
    }

    if (associatedEmail.toLowerCase().trim() !== cleanEmail) {
      return NextResponse.json({ 
        error: 'The email entered does not match the email associated with this result.' 
      }, { status: 400 });
    }

    if (!removalToken) {
      return NextResponse.json({ 
        error: 'Could not find a valid removal token for this result. Please contact support.' 
      }, { status: 500 });
    }

    // 4. Send the verification email with Resend
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
    const removalUrl = `https://lumobites.net/api/twin/remove/${removalToken}`;

    await resend.emails.send({
      from: fromEmail,
      to: cleanEmail,
      subject: 'Remove your Lumo Bites Pet Twin result',
      html: brandedEmail({
        subject: '🐾 Secure Pet Twin Deletion Link',
        preheader: 'Verification request to remove your result',
        body: `
          <h1 style="${emailStyles.h1}">Verification Request 🔐</h1>
          <p style="${emailStyles.p}">We received a request to remove your Pet Twin match from the Lumo Bites public gallery.</p>
          <p style="${emailStyles.p}">To permanently delete your result, click the secure button below:</p>
          <div style="margin: 32px 0; text-align: center;">
            <a href="${removalUrl}" style="display: inline-block; background-color: #8B5E3C; color: white; padding: 14px 28px; border-radius: 12px; font-weight: bold; text-decoration: none; font-size: 14px; shadow: 0 4px 12px rgba(139, 94, 60, 0.15);">Permanently Remove My Result</a>
          </div>
          <p style="${emailStyles.pSmall}">If you did not request this deletion, you can safely ignore this email. Your match will remain live in the gallery.</p>
          ${emailStyles.divider}
          ${emailStyles.signoff}
        `
      })
    });

    console.log(`[Remove Request] Successfully sent verification email to ${cleanEmail} for post ${postId}`);
    return NextResponse.json({ success: true, message: 'Verification email sent successfully!' });
  } catch (err: any) {
    console.error('[Remove Request error]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
