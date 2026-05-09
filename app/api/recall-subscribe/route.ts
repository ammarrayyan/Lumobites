import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, pet_type, product_names } = body;

    if (!email || !pet_type) {
      return NextResponse.json({ error: 'Email and pet type are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Upsert so re-subscribing with the same email doesn't create duplicates
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
      return NextResponse.json({ error: 'Failed to save subscription. Ensure table and RLS policies are set up correctly.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Successfully subscribed to recall alerts!' });
  } catch (err) {
    console.error('Subscription error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
