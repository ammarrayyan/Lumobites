import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';
import { brandedEmail, emailStyles } from '@/lib/email-template';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, pet_type, product_names } = body;

    if (!email || !pet_type) {
      return NextResponse.json({ error: 'Email and pet type are required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const { error: dbError } = await supabase
      .from('recall_subscriptions')
      .upsert(
        {
          email: email.toLowerCase().trim(),
          pet_type: pet_type || 'both',
          product_names: product_names || [],
          created_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );

    if (dbError) {
      console.error('Supabase error:', dbError);
      return NextResponse.json({ error: dbError.message || 'Database error' }, { status: 500 });
    }

    // Send confirmation email - Don't block the response on email failure
    try {
      // Use a safer fallback if the domain isn't verified yet
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <no-reply@lumobites.net>';
      
      const emailResponse = await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: `🐾 You're subscribed to FDA pet food recall alerts`,
        html: brandedEmail({
          subject: `🐾 You're subscribed to FDA pet food recall alerts`,
          preheader: `We'll notify you the moment a new recall is issued.`,
          body: `
    <h1 style="${emailStyles.h1}">You're Subscribed! ✅</h1>
    <p style="${emailStyles.p}">You will now receive an alert whenever the FDA issues a new pet food recall — so you can protect your pet fast.</p>
    ${emailStyles.infoBox(`
      <p style="margin:0 0 8px 0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Monitoring:</strong> ${pet_type || 'All'} pet food recalls</p>
      ${product_names?.length ? `<p style="margin:0;font-size:13px;color:#6B5040;"><strong style="color:#3B2410;">Watching Products:</strong> ${product_names.join(', ')}</p>` : ''}
    `)}
    ${emailStyles.button('https://lumobites.net/recalls', 'View Latest Recalls')}
    ${emailStyles.divider}
    ${emailStyles.signoff}
  `
        })
      });

      if (emailResponse.error) {
        console.error('[Recall Subscribe API] Resend SDK returned an error:', emailResponse.error);
      } else {
        console.log(`[Recall Subscribe API] Recall subscription email successfully sent to: ${email}`);
      }
    } catch (emailErr) {
      console.error('[Recall Subscribe API] Email send error exception:', emailErr);
    }

    return NextResponse.json({ success: true, message: 'Successfully subscribed to recall alerts!' });
  } catch (err: any) {
    console.error('Subscription error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

