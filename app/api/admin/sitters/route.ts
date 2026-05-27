import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

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
          rejection_reason: null
        })
        .eq('id', id);

      if (updateErr) throw updateErr;

      // Send approval email
      await resend.emails.send({
        from: fromEmail,
        to: sitter.email,
        subject: 'Your Lumo Bites Pet Sitter Profile is Approved! 🎉',
        html: `
          <h2>Congratulations, ${sitter.name}!</h2>
          <p>Your Lumo Bites sitter profile has been approved.</p>
          <p>You are now live and will start receiving requests from pet owners near you.</p>
          <p>You can view and edit your profile here: <a href="https://lumobites.net/petsitting">Lumo Bites Pet Sitting</a></p>
          <br/>
          <p>Best,<br/>The Lumo Bites Team</p>
        `
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
          rejection_reason: reason
        })
        .eq('id', id);

      if (updateErr) throw updateErr;

      // Send rejection email
      await resend.emails.send({
        from: fromEmail,
        to: sitter.email,
        subject: 'Action Required: Update your Lumo Bites Profile',
        html: `
          <h2>Hi ${sitter.name},</h2>
          <p>Thank you for submitting your sitter profile. Unfortunately, your profile was not approved at this time.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>Please update your profile on the <a href="https://lumobites.net/petsitting">Lumo Bites website</a> and resubmit it for review.</p>
          <br/>
          <p>Best,<br/>The Lumo Bites Team</p>
        `
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Admin Sitters POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
