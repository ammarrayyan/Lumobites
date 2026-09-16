import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { password } = body;
    const expectedKey = process.env.MARKETING_PAGE_KEY || process.env.NEXT_PUBLIC_MARKETING_PAGE_KEY;

    if (!expectedKey) {
      console.error('[Marketing Verify API] MARKETING_PAGE_KEY is not configured');
      return NextResponse.json({ error: 'Marketing portal key is not configured' }, { status: 500 });
    }

    if (password && typeof password === 'string' && password.trim() === expectedKey.trim()) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
