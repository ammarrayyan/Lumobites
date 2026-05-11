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
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lumo Bites <onboarding@resend.dev>';
      
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: "🐾 You're subscribed to pet food recall alerts!",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #191919;">
            <h2 style="color: #8B5E3C;">You're subscribed!</h2>
            <p>We'll notify you whenever there's a new pet food recall from the FDA.</p>
            <p><strong>Status:</strong> Monitoring for ${pet_type || 'all'} pet food recalls.</p>
            ${product_names?.length ? `<p><strong>Watching:</strong> ${product_names.join(', ')}</p>` : ''}
            <p>Stay safe,<br/>The Lumo Bites Team</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Email send error:', emailErr);
    }

    return NextResponse.json({ success: true, message: 'Successfully subscribed to recall alerts!' });
  } catch (err: any) {
    console.error('Subscription error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

