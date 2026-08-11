import { NextRequest } from 'next/server';

/**
 * Single source of truth for admin API authentication. Reads only the
 * server-only ADMIN_API_KEY env var (never NEXT_PUBLIC_*) so the value is
 * never bundled into client JS. Accepts either the `x-admin-key` header
 * (used by most admin routes) or `Authorization: Bearer <key>` (used by the
 * referrals routes) so no client call sites need to change header names.
 */
export function isAuthorizedAdmin(req: NextRequest | Request): boolean {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) return false; // fail closed if not configured

  const directKey = req.headers.get('x-admin-key');
  const authHeader = req.headers.get('authorization') || '';
  const bearerKey = authHeader.replace(/^Bearer\s+/i, '').trim();

  const provided = directKey || bearerKey;
  return !!provided && provided === adminKey;
}
