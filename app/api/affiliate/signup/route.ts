import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';
import { brandedEmail, emailStyles } from '@/lib/email-template';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { full_name, email, paypal_email, promotion_method, bio } = body;

    if (!full_name || !email) {
      return NextResponse.json({ error: 'Full name and email are required.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPaypal = paypal_email ? paypal_email.toLowerCase().trim() : null;

    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from('affiliates')
      .select('id, status')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      if (existing.status === 'pending') {
        return NextResponse.json({ error: 'An application is already pending for this email address.' }, { status: 400 });
      }
      return NextResponse.json({ error: 'An account already exists for this email address.' }, { status: 400 });
    }

    // Insert into affiliates table as pending
    const { error: insertError } = await supabase
      .from('affiliates')
      .insert({
        full_name,
        email: cleanEmail,
        paypal_email: cleanPaypal,
        promotion_method,
        bio,
        status: 'pending',
      });

    if (insertError) throw insertError;

    // Send application under review email via Resend
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
      await resend.emails.send({
        from: fromEmail,
        to: cleanEmail,
        subject: '🐾 Your Lumo Bites Affiliate Application',
        html: brandedEmail({
          subject: 'Affiliate Application Received',
          preheader: 'We are reviewing your Lumo Bites affiliate application.',
          body: `
            <h1 style="${emailStyles.h1}">Application Received! 🐾</h1>
            <p style="${emailStyles.p}">Hi ${full_name},</p>
            <p style="${emailStyles.p}">Thank you for your interest in the Lumo Bites Affiliate Program! We have received your application and our team is currently reviewing it.</p>
            ${emailStyles.infoBox(`
              <p style="margin:0 0 6px 0;font-size:13px;color:#6B5040;">👤 <strong>Name:</strong> ${full_name}</p>
              <p style="margin:0 0 6px 0;font-size:13px;color:#6B5040;">✉️ <strong>Email:</strong> ${cleanEmail}</p>
              <p style="margin:0;font-size:13px;color:#6B5040;">⏳ <strong>Status:</strong> Under Review</p>
            `)}
            <p style="${emailStyles.p}">We will review your application and send you an update within 24-48 hours. Once approved, you will receive another email containing your personal referral link and access to your affiliate dashboard.</p>
            ${emailStyles.divider}
            ${emailStyles.signoff}
          `
        })
      });
      console.log(`[Affiliate Signup] Sent review email to: ${cleanEmail}`);
    } catch (emailErr) {
      console.error('[Affiliate Signup] Resend welcome email failed:', emailErr);
    }

    return NextResponse.json({ success: true, message: 'Application submitted successfully.' });
  } catch (err: any) {
    console.error('[Affiliate Signup] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
