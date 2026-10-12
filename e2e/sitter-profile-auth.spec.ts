import { test, expect } from '@playwright/test';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local if present
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const TEST_SITTER_EMAIL = 'e2e-auth-test-sitter@example.com';
const WRONG_USER_EMAIL = 'e2e-auth-wrong-user@example.com';

function createSessionToken(email: string): string {
  const secret = process.env.ACCOUNT_SESSION_SECRET || 'lumo_account_session_secret_dev_only_2026';
  const cleanEmail = email.toLowerCase().trim();
  const issuedAtMs = Date.now();
  const expiresAtMs = issuedAtMs + 30 * 24 * 60 * 60 * 1000;
  const payload = `${cleanEmail}:${issuedAtMs}:${expiresAtMs}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  return `${payload}:${signature}`;
}

test.describe('PETSITTING PROFILE AUTH: GET /api/petsitting/profile', () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminKey = process.env.ADMIN_API_KEY || 'test-admin-api-key';

  test.beforeAll(async () => {
    if (supabaseUrl && supabaseKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
      // Clean up any previous test sitter
      await supabaseAdmin.from('sitters').delete().eq('email', TEST_SITTER_EMAIL);
      // Insert temporary fixture sitter
      const { error } = await supabaseAdmin.from('sitters').insert({
        email: TEST_SITTER_EMAIL,
        name: 'E2E Test Sitter',
        city: 'Austin',
        bio: 'Automated test sitter profile.',
        id_photo_url: 'e2e-test-id-photo-reference.jpg',
        is_approved: true,
        approval_status: 'approved',
      });
      if (error) console.error('Fixture insert error:', error);
    }
  });

  test.afterAll(async () => {
    if (supabaseUrl && supabaseKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
      await supabaseAdmin.from('sitters').delete().eq('email', TEST_SITTER_EMAIL);
    }
  });

  test('Case 1: No login (unauthenticated) returns 401 and no data', async ({ request }) => {
    const res = await request.get(`/api/petsitting/profile?email=${encodeURIComponent(TEST_SITTER_EMAIL)}`);
    expect(res.status()).toBe(401);
    const json = await res.json();
    expect(json.error).toContain('Authentication required');
    expect(json.id_photo_url).toBeUndefined();
    expect(json.stripe_customer_id).toBeUndefined();
  });

  test('Case 2: Wrong user (authenticated as another user) returns 403 and no data', async ({ request }) => {
    const wrongToken = createSessionToken(WRONG_USER_EMAIL);
    const res = await request.get(`/api/petsitting/profile?email=${encodeURIComponent(TEST_SITTER_EMAIL)}`, {
      headers: {
        'x-account-session': wrongToken,
      },
    });
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json.error).toContain('Forbidden');
    expect(json.id_photo_url).toBeUndefined();
    expect(json.stripe_customer_id).toBeUndefined();
  });

  test('Case 3: Correct sitter returns 200, has_id_on_file boolean, and strips sensitive fields', async ({ request }) => {
    const correctToken = createSessionToken(TEST_SITTER_EMAIL);
    const res = await request.get(`/api/petsitting/profile?email=${encodeURIComponent(TEST_SITTER_EMAIL)}`, {
      headers: {
        'x-account-session': correctToken,
      },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).not.toBeNull();
    expect(json.email).toBe(TEST_SITTER_EMAIL);
    expect(json.name).toBe('E2E Test Sitter');
    expect(json.has_id_on_file).toBe(true);
    // CRITICAL: ID photos and Stripe customer ID must NEVER be exposed
    expect(json.id_photo_url).toBeUndefined();
    expect(json.stripe_customer_id).toBeUndefined();
  });

  test('Case 4: Authorized admin with x-admin-key returns 200 and strips sensitive fields', async ({ request }) => {
    const res = await request.get(`/api/petsitting/profile?email=${encodeURIComponent(TEST_SITTER_EMAIL)}`, {
      headers: {
        'x-admin-key': adminKey,
      },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).not.toBeNull();
    expect(json.email).toBe(TEST_SITTER_EMAIL);
    expect(json.has_id_on_file).toBe(true);
    // Sensitive fields must remain stripped even for admin response on this endpoint
    expect(json.id_photo_url).toBeUndefined();
    expect(json.stripe_customer_id).toBeUndefined();
  });
});
