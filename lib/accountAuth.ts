import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

const SESSION_COOKIE_NAME = 'lumo_account_session';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds
export const SESSION_RENEW_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

function getSecretKey(): string {
  const secret = process.env.ACCOUNT_SESSION_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'lumo_account_session_secret_dev_only_2026');
  if (!secret) {
    throw new Error('CRITICAL SECURITY ERROR: ACCOUNT_SESSION_SECRET environment variable is missing in production.');
  }
  return secret;
}

/**
 * Creates a signed session token for a verified email address.
 * Format: email:issuedAtMs:expiresAtMs:signature
 */
export function createAccountSessionToken(email: string): string {
  const cleanEmail = email.toLowerCase().trim();
  const issuedAtMs = Date.now();
  const expiresAtMs = issuedAtMs + SESSION_MAX_AGE * 1000;
  const payload = `${cleanEmail}:${issuedAtMs}:${expiresAtMs}`;
  
  const hmac = crypto.createHmac('sha256', getSecretKey());
  hmac.update(payload);
  const signature = hmac.digest('hex');
  
  return `${payload}:${signature}`;
}

export interface VerifiedSessionToken {
  email: string;
  issuedAtMs: number;
  expiresAtMs: number;
}

export interface VerifiedSessionDetails extends VerifiedSessionToken {
  shouldRenew: boolean;
}

/**
 * Verifies a session token string and returns the email, issuedAtMs, and expiresAtMs if valid and non-expired.
 */
export function verifyAccountSessionToken(token: string | null | undefined): VerifiedSessionToken | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split(':');
  if (parts.length !== 4) return null;

  const [email, issuedAtStr, expiresAtStr, signature] = parts;
  const issuedAtMs = parseInt(issuedAtStr, 10);
  const expiresAtMs = parseInt(expiresAtStr, 10);

  if (isNaN(issuedAtMs) || isNaN(expiresAtMs) || Date.now() > expiresAtMs) {
    return null;
  }

  const payload = `${email}:${issuedAtMs}:${expiresAtMs}`;
  const hmac = crypto.createHmac('sha256', getSecretKey());
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');

  // Validate signature lengths before timingSafeEqual to avoid uncaught TypeErrors
  if (signature.length !== 64 || expectedSignature.length !== 64) {
    return null;
  }

  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expectedSignature, 'hex');

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  return { email: email.toLowerCase().trim(), issuedAtMs, expiresAtMs };
}

/**
 * Extracts and verifies the full session details from incoming request cookies or headers.
 * Fails closed (returns null) if session cookie/header is invalid, expired, or if DB revocation check fails.
 */
export async function getVerifiedSessionDetails(request: NextRequest): Promise<VerifiedSessionDetails | null> {
  // 1. Try reading HTTP-Only cookie
  const cookie = request.cookies.get(SESSION_COOKIE_NAME);
  let token = cookie?.value;

  // 2. Fallback to Authorization / Header (used by iOS/Android Capacitor app)
  if (!token) {
    const authHeader = request.headers.get('x-account-session') || request.headers.get('authorization');
    if (authHeader) {
      token = authHeader.replace(/^Bearer\s+/i, '').trim();
    }
  }

  if (!token) return null;

  const verifiedSession = verifyAccountSessionToken(token);
  if (!verifiedSession) return null;

  const { email: verifiedEmail, issuedAtMs, expiresAtMs } = verifiedSession;

  // 3. Database check: verify session was not revoked via "Sign Out All Devices"
  // FAIL CLOSED: If DB check errors or throws exception, return null
  try {
    const { data, error } = await supabaseAdmin
      .from('emails')
      .select('session_invalidated_at')
      .eq('email', verifiedEmail)
      .maybeSingle();

    if (error) {
      console.error('[getVerifiedSessionEmail] Revocation DB check error (failing closed):', error);
      return null;
    }

    if (data?.session_invalidated_at) {
      const invalidatedAtMs = new Date(data.session_invalidated_at).getTime();
      if (issuedAtMs < invalidatedAtMs) {
        console.warn(`[getVerifiedSessionEmail] Revoked token presented for ${verifiedEmail}`);
        return null; // Token was issued BEFORE the revocation timestamp
      }
    }
  } catch (err) {
    console.error('[getVerifiedSessionEmail] Revocation DB check exception (failing closed):', err);
    return null;
  }

  const remainingMs = expiresAtMs - Date.now();
  const shouldRenew = remainingMs > 0 && remainingMs < SESSION_RENEW_THRESHOLD_MS;

  return {
    email: verifiedEmail,
    issuedAtMs,
    expiresAtMs,
    shouldRenew,
  };
}

/**
 * Extracts and verifies the session email from incoming request cookies or headers.
 * Fails closed (returns null) if session cookie is invalid, expired, or if DB revocation check fails.
 */
export async function getVerifiedSessionEmail(request: NextRequest): Promise<string | null> {
  const details = await getVerifiedSessionDetails(request);
  return details ? details.email : null;
}

/**
 * Sets the HTTP-Only secure session cookie on a NextResponse object and returns the minted token.
 */
export function setAccountSessionCookie(response: NextResponse, email: string, existingToken?: string): string {
  const token = existingToken || createAccountSessionToken(email);
  const isProd = process.env.NODE_ENV === 'production';

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });

  return token;
}

/**
 * Re-issues the 30-day session cookie if fewer than 7 days remain on the current token.
 * Returns the newly minted token string when renewed, or null if no renewal was needed.
 */
export function applySlidingSessionRenewal(
  response: NextResponse,
  sessionDetails: VerifiedSessionDetails
): string | null {
  if (!sessionDetails.shouldRenew) {
    return null;
  }
  return setAccountSessionCookie(response, sessionDetails.email);
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
