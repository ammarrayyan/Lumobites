import { NextRequest, NextResponse } from 'next/server';
import { clearAccountSessionCookie } from '@/lib/accountAuth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  clearAccountSessionCookie(response);
  return response;
}

export async function GET(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  clearAccountSessionCookie(response);
  return response;
}
