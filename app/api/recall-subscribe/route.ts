import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

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

    const { error } = await supabase
      .from('recall_subscriptions')
      .upsert(
        {
          email: email.toLowerCase().trim(),
          pet_type,
          product_names: product_names || [],
          created_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to save subscription.' }, { status: 500 });
    }

    // Send confirmation email
    try {
      const emailResult = await resend.emails.send({
        from: 'Lumo Bites <alerts@lumobites.net>',
        to: email,
        subject: "🐾 You're subscribed to pet food recall alerts!",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8B6914;">You're subscribed to Lumo Bites Recall Alerts</h2>
            <p>We'll notify you whenever there's a new pet food recall from the FDA.</p>
            <p><strong>Pet type:</strong> ${pet_type}</p>
            ${product_names?.length ? `<p><strong>Watching:</strong> ${product_names.join(', ')}</p>` : ''}
            <p>Stay safe,<br/>The Lumo Bites Team</p>
            <hr/>
            <p style="font-size: 12px; color: #999;">
              To unsubscribe, reply to this email with "unsubscribe".
            </p>
          </div>
        `,
      });
      console.log('Email result:', JSON.stringify(emailResult));
    } catch (emailErr) {
      console.error('Email send error:', emailErr);
    }

    return NextResponse.json({ success: true, message: 'Successfully subscribed to recall alerts!' });
  } catch (err) {
    console.error('Subscription error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

