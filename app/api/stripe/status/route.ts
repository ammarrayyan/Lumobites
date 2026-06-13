import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (cleanEmail === 'premierpetnutritionllc@gmail.com') {
      return NextResponse.json({ isPro: true });
    }

    const { data, error } = await supabase
      .from('emails')
      .select('is_pro, session_invalidated_at')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (error) {
      console.error('[Stripe Status API] Supabase error:', error);
      return NextResponse.json({ error: 'Failed to retrieve user status' }, { status: 500 });
    }

    return NextResponse.json({ 
      isPro: !!data?.is_pro,
      session_invalidated_at: data?.session_invalidated_at || null
    });
  } catch (err: any) {
    console.error('[Stripe Status API] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
