import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import { brandedEmail, emailStyles } from '@/lib/email-template';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';

function checkAuth(req: NextRequest) {
  const key = req.headers.get('x-admin-key');
  return key === process.env.NEXT_PUBLIC_ADMIN_BYPASS_KEY;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('sitters')
      .select('*')
      .order('submitted_at', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Generate signed URLs for private ID photos
    const sittersWithSignedUrls = await Promise.all(data.map(async (sitter) => {
      if (sitter.id_photo_url && !sitter.id_photo_url.startsWith('http')) {
        const { data: signedUrlData } = await supabaseAdmin.storage
          .from('sitter-ids')
          .createSignedUrl(sitter.id_photo_url, 60 * 60); // 1 hour expiry
        
        return {
          ...sitter,
          id_photo_url: signedUrlData?.signedUrl || null
        };
      }
      return sitter;
    }));

    return NextResponse.json({ sitters: sittersWithSignedUrls });
  } catch (err: any) {
    console.error('[Admin Sitters GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, action, reason } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
    }

    // Fetch the sitter to get their email and name
    const { data: sitter, error: fetchErr } = await supabaseAdmin
      .from('sitters')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !sitter) {
      return NextResponse.json({ error: 'Sitter not found' }, { status: 404 });
    }

    if (action === 'approve') {
      const { error: updateErr } = await supabaseAdmin
        .from('sitters')
        .update({
          is_approved: true,
          approval_status: 'approved',
          rejection_reason: null,
          needs_reapproval: false
        })
        .eq('id', id);

      if (updateErr) throw updateErr;

      // Send approval email
      await resend.emails.send({
        from: fromEmail,
        to: sitter.email,
        subject: 'Your Lumo Bites Pet Sitter Profile is Approved! 🎉',
        html: brandedEmail({
          subject: 'Your Lumo Bites Pet Sitter Profile is Approved! 🎉',
          preheader: 'Congratulations! Your sitter profile is live on the Lumo Bites community board.',
          body: `
            <h1 style="${emailStyles.h1}">Congratulations, ${sitter.name}! 🎉</h1>
            <p style="${emailStyles.p}">Your Lumo Bites pet sitter profile has been reviewed and approved by our safety team!</p>
            ${emailStyles.highlightBox(`
              <p style="margin:0;font-size:12px;color:#2F5A32;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Profile Status</p>
              <p style="margin:8px 0 0 0;font-size:24px;font-weight:800;color:#2E7D32;">🟢 ACTIVE & LIVE</p>
              <p style="margin:8px 0 0 0;font-size:13px;color:#555555;line-height:1.4;">Your profile is now visible in sitter search results, and pet owners in your neighborhood can send you requests directly.</p>
            `)}
            <p style="${emailStyles.p}">You can manage your availability, pricing, or update your profile details at any time by logging into the dashboard.</p>
            ${emailStyles.button('https://lumobites.net/petsitting', 'View & Manage Profile')}
            ${emailStyles.divider}
            ${emailStyles.signoff}
          `
        })
      });

    } else if (action === 'reject') {
      if (!reason) {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
      }

      const { error: updateErr } = await supabaseAdmin
        .from('sitters')
        .update({
          is_approved: false,
          approval_status: 'rejected',
          rejection_reason: reason,
          needs_reapproval: false
        })
        .eq('id', id);

      if (updateErr) throw updateErr;

      // Send rejection email
      await resend.emails.send({
        from: fromEmail,
        to: sitter.email,
        subject: 'Action Required: Update your Lumo Bites Profile',
        html: brandedEmail({
          subject: 'Action Required: Update your Lumo Bites Profile',
          preheader: 'Your sitter profile needs updates before we can approve it.',
          body: `
            <h1 style="${emailStyles.h1}">Profile Update Needed ⚠️</h1>
            <p style="${emailStyles.p}">Hi ${sitter.name},</p>
            <p style="${emailStyles.p}">Thank you for applying to become a pet sitter on Lumo Bites. During our review, our safety team noted that some changes are required before we can list your profile publicly.</p>
            ${emailStyles.highlightBox(`
              <p style="margin:0;font-size:12px;color:#8B0000;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Reason for Request</p>
              <p style="margin:8px 0 0 0;font-size:15px;color:#8B0000;font-weight:bold;line-height:1.4;">${reason}</p>
            `)}
            <p style="${emailStyles.p}">Please log in, update the highlighted details, and resubmit your profile for review. We look forward to getting you live!</p>
            ${emailStyles.button('https://lumobites.net/petsitting', 'Update My Profile')}
            ${emailStyles.divider}
            ${emailStyles.signoff}
          `
        })
      });
    } else if (action === 'delete') {
      // Delete associated sitting requests first to satisfy foreign key constraints
      const { error: reqDeleteErr } = await supabaseAdmin
        .from('sitting_requests')
        .delete()
        .eq('sitter_id', id);

      if (reqDeleteErr) throw reqDeleteErr;

      // Permanently delete the sitter profile
      const { error: deleteErr } = await supabaseAdmin
        .from('sitters')
        .delete()
        .eq('id', id);

      if (deleteErr) throw deleteErr;

      // Send deletion notification email
      if (sitter.email) {
        try {
          await resend.emails.send({
            from: fromEmail,
            to: sitter.email,
            subject: 'Your Lumo Bites sitter profile has been removed',
            html: `
              <h2>Hi ${sitter.name},</h2>
              <p>Your Lumo Bites sitter profile has been removed by our admin team.</p>
              <p>If you have questions please contact <a href="mailto:info@lumobitespet.com">info@lumobitespet.com</a>.</p>
              <br/>
              <p>Best,<br/>The Lumo Bites Team</p>
            `
          });
        } catch (emailErr) {
          console.error('[Admin Sitters] Failed to send deletion email:', emailErr);
        }
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Admin Sitters POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
