import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserProStatusDetails } from '@/lib/aiLimiter';

async function checkStatus(email: string) {
  const cleanEmail = email.toLowerCase().trim();

  const proDetails = await getUserProStatusDetails(cleanEmail);

  const { data } = await supabaseAdmin
    .from('emails')
    .select('session_invalidated_at, phone_verified')
    .eq('email', cleanEmail)
    .maybeSingle();

  return {
    isPro: proDetails.isPro,
    proSource: proDetails.proSource,
    session_invalidated_at: data?.session_invalidated_at || null,
    phone_verified: !!data?.phone_verified
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
