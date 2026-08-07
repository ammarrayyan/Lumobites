import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';

const SESSION_COOKIE_NAME = 'lumo_account_session';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

function getSecretKey(): string {
  return (
    process.env.STRIPE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXTAUTH_SECRET ||
    'lumo_bites_secure_account_session_secret_key_2026'
  );
}

/**
 * Creates a signed session token for a verified email address.
 * Format: email:expiresAtMs:signature
 */
export function createAccountSessionToken(email: string): string {
  const cleanEmail = email.toLowerCase().trim();
  const expiresAtMs = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${cleanEmail}:${expiresAtMs}`;
  
  const hmac = crypto.createHmac('sha256', getSecretKey());
  hmac.update(payload);
  const signature = hmac.digest('hex');
  
  return `${payload}:${signature}`;
}

/**
 * Verifies a session token string and returns the email if valid and non-expired.
 */
export function verifyAccountSessionToken(token: string | null | undefined): string | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split(':');
  if (parts.length !== 3) return null;

  const [email, expiresAtStr, signature] = parts;
  const expiresAtMs = parseInt(expiresAtStr, 10);

  if (isNaN(expiresAtMs) || Date.now() > expiresAtMs) {
    return null;
  }

  const payload = `${email}:${expiresAtMs}`;
  const hmac = crypto.createHmac('sha256', getSecretKey());
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');

  // Timing-safe signature comparison
  if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return email.toLowerCase().trim();
  }

  return null;
}

/**
 * Extracts and verifies the session email from incoming request cookies or headers.
 */
export async function getVerifiedSessionEmail(request: NextRequest): Promise<string | null> {
  // 1. Try reading HTTP-Only cookie
  const cookie = request.cookies.get(SESSION_COOKIE_NAME);
  let token = cookie?.value;

  // 2. Fallback to Authorization / Header
  if (!token) {
    const authHeader = request.headers.get('x-account-session') || request.headers.get('authorization');
    if (authHeader) {
      token = authHeader.replace(/^Bearer\s+/i, '').trim();
    }
  }

  if (!token) return null;

  const verifiedEmail = verifyAccountSessionToken(token);
  if (!verifiedEmail) return null;

  // 3. Optional DB check: verify session was not invalidated via "Sign Out All Devices"
  try {
    const { data } = await supabase
      .from('emails')
      .select('session_invalidated_at')
      .eq('email', verifiedEmail)
      .maybeSingle();

    if (data?.session_invalidated_at) {
      const invalidatedAtMs = new Date(data.session_invalidated_at).getTime();
      const parts = token.split(':');
      const tokenIssuedAtMs = parseInt(parts[1], 10) - (SESSION_MAX_AGE * 1000);
      if (tokenIssuedAtMs < invalidatedAtMs) {
        return null; // Token was issued BEFORE the invalidate timestamp
      }
    }
  } catch (err) {
    console.error('[getVerifiedSessionEmail] DB check error:', err);
  }

  return verifiedEmail;
}

/**
 * Sets the HTTP-Only secure session cookie on a NextResponse object.
 */
export function setAccountSessionCookie(response: NextResponse, email: string): void {
  const token = createAccountSessionToken(email);
  const isProd = process.env.NODE_ENV === 'production';

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

/**
 * Clears the HTTP-Only session cookie on a NextResponse object.
 */
export function clearAccountSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
