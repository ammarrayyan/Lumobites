import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Save to Supabase 'emails' table
    // Columns: email, source, created_at
    const { error: dbError } = await supabaseAdmin
      .from('emails')
      .upsert(
        {
          email: email.toLowerCase().trim(),
          source: 'twin',
          created_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );

    if (dbError) {
      console.error('[Twin Email API] Supabase DB error:', dbError);
      return NextResponse.json({ error: dbError.message || 'Failed to save email to database' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Email saved successfully!' });
  } catch (err: any) {
    console.error('[Twin Email API] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
