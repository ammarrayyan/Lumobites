import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('=== PUSH DEBUG ===', JSON.stringify(body));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Push Debug] Error parsing body:', err);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
