import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';
import { brandedEmail, emailStyles } from '@/lib/email-template';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function GET(request: NextRequest) {
  try {
    // 1. Validate Cron Secret (bypassed in local development)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Calculate timestamp for 2 hours ago
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    // 2. Fetch completed requests older than 2 hours that haven't received a review email
    const { data: requests, error: fetchError } = await supabase
      .from('sitting_requests')
      .select('id, owner_email, sitter_id, pet_name, dates, completed_at')
      .eq('status', 'completed')
      .eq('review_sent', false)
      .lte('completed_at', twoHoursAgo);

    if (fetchError) {
      console.error('[Cron Reviews] Supabase Fetch Error:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!requests || requests.length === 0) {
      return NextResponse.json({ success: true, message: 'No pending review emails to send.' });
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
    let successCount = 0;

    for (const reqRow of requests) {
      try {
        // Fetch sitter details
        const { data: sitter } = await supabase
          .from('sitters')
          .select('name')
          .eq('id', reqRow.sitter_id)
          .single();

        const sitterName = sitter?.name || 'your sitter';

        // Send review request email
        await resend.emails.send({
          from: fromEmail,
          to: reqRow.owner_email,
          subject: `How was your experience with ${sitterName}? ⭐`,
          html: brandedEmail({
            subject: `How was your experience with ${sitterName}? ⭐`,
            preheader: `Please leave a quick review to help the Lumo Bites community!`,
            body: `
              <h1 style="${emailStyles.h1}">How was your experience? ⭐</h1>
              <p style="${emailStyles.p}">Hi there,</p>
              <p style="${emailStyles.p}">How was your experience with <strong>${sitterName}</strong>? Leave a review to help other pet owners: <a href="https://lumobites.net/petsitting/review/${reqRow.sitter_id}?token=${encodeURIComponent(reqRow.owner_email)}" style="color:#8B5E3C;font-weight:bold;text-decoration:underline;">lumobites.net/petsitting/review/${reqRow.sitter_id}</a></p>
              ${emailStyles.divider}
              ${emailStyles.button(`https://lumobites.net/petsitting/review/${reqRow.sitter_id}?token=${encodeURIComponent(reqRow.owner_email)}`, 'Write a Review ⭐')}
              ${emailStyles.divider}
              <p style="${emailStyles.pSmall}">It only takes 30 seconds and makes a big difference for our sitters.</p>
              ${emailStyles.signoff}
            `
          })
        });

        // Mark as sent
        await supabase
          .from('sitting_requests')
          .update({ review_sent: true })
          .eq('id', reqRow.id);

        successCount++;
      } catch (innerErr) {
        console.error(`[Cron Reviews] Failed to process request ${reqRow.id}:`, innerErr);
      }
    }

    return NextResponse.json({ success: true, sent: successCount, total: requests.length });
  } catch (error: any) {
    console.error('[Cron Reviews] Failed to run review cron:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
