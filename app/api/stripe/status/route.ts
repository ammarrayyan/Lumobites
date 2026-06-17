import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

async function checkStatus(email: string) {
  const cleanEmail = email.toLowerCase().trim();

  if (cleanEmail === 'premierpetnutritionllc@gmail.com' || cleanEmail === 'reviewer@lumobites.net') {
    return { isPro: true, phone_verified: true, session_invalidated_at: null };
  }

  // Check if they are an approved sitter
  const { data: sitterData } = await supabase
    .from('sitters')
    .select('is_approved')
    .eq('email', cleanEmail)
    .eq('is_approved', true)
    .maybeSingle();

  const isApprovedSitter = !!sitterData?.is_approved;

  const { data, error } = await supabase
    .from('emails')
    .select('is_pro, session_invalidated_at, phone_verified')
    .eq('email', cleanEmail)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    isPro: !!data?.is_pro,
    session_invalidated_at: data?.session_invalidated_at || null,
    phone_verified: isApprovedSitter || !!data?.phone_verified
  };
}

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    const result = await checkStatus(email);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[Stripe Status GET API] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await checkStatus(email);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[Stripe Status POST API] Server error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
