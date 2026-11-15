import { test, expect } from '@playwright/test';
import {
  TEST_USER_EMAIL,
  TEST_USER_CODE,
  injectAuthSession,
  bypassTerms,
  createTestSessionToken,
} from './helpers/auth';

test.describe('Flow 1: Authentication & Session Lifecycle', () => {
  test('should sign in via verification code and update UI immediately without refresh', async ({ page }) => {
    await bypassTerms(page);
    const validToken = createTestSessionToken(TEST_USER_EMAIL);

    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.route('**/api/stripe/send-code', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    await page.route('**/api/stripe/verify-code', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          isPro: true,
          existed: true,
          isSitter: false,
          sitterId: null,
          sessionToken: validToken,
          token: validToken,
          email: TEST_USER_EMAIL
        })
      });
    });

    await page.route('**/api/stripe/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ isPro: true })
      });
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Click Sign In in Navbar
    const signInBtn = page.locator('button:has-text("Sign In")').first();
    if (await signInBtn.isVisible()) {
      await signInBtn.click();
    } else {
      await page.evaluate(() => window.dispatchEvent(new Event('lumo-open-signin')));
    }

    // Wait for modal to be visible
    const emailInput = page.locator('input[type="email"][placeholder="name@example.com"]').first();
    await expect(emailInput).toBeVisible({ timeout: 8000 });
    await emailInput.fill(TEST_USER_EMAIL);

    // Click Send Code
    const sendCodeBtn = page.locator('button:has-text("Send Code")').first();
    await sendCodeBtn.click();

    // Enter verification code using inputmode="numeric"
    const codeInput = page.locator('input[inputmode="numeric"]').first();
    await expect(codeInput).toBeVisible({ timeout: 8000 });
    await codeInput.fill(TEST_USER_CODE);

    // Verify & Sign In
    const verifyBtn = page.locator('button:has-text("Verify & Sign In")').first();
    await verifyBtn.click();

    // Verify modal closes
    await expect(codeInput).not.toBeVisible({ timeout: 8000 });

    // Verify localStorage contains the signed in email
    const storedEmail = await page.evaluate(() => localStorage.getItem('lumo_pro_email'));
    expect(storedEmail?.toLowerCase()).toBe(TEST_USER_EMAIL.toLowerCase());
  });

  test('should clear stale localStorage email and show Sign In when server session is unverified', async ({ page }) => {
    await bypassTerms(page);
    await page.addInitScript(() => {
      localStorage.setItem('lumo_pro_email', 'stale-unverified@example.com');
      localStorage.setItem('lumo_sitter_email', 'stale-unverified@example.com');
      localStorage.setItem('lumo_shelter_email', 'stale-unverified@example.com');
      document.cookie = 'lumo_pro_email=stale-unverified@example.com; path=/; max-age=2592000';
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for Navbar's /api/account/session check to clear stale localStorage
    await expect.poll(async () => {
      return await page.evaluate(() => localStorage.getItem('lumo_pro_email'));
    }, { timeout: 8000 }).toBeNull();

    const staleSitter = await page.evaluate(() => localStorage.getItem('lumo_sitter_email'));
    const staleShelter = await page.evaluate(() => localStorage.getItem('lumo_shelter_email'));
    expect(staleSitter).toBeNull();
    expect(staleShelter).toBeNull();

    // Navbar must show Sign In (or Create Free Account on mobile), not the logged-in avatar menu
    await expect(page.locator('button[aria-label="Account menu"]')).toHaveCount(0);
  });

  test('should open Navbar avatar menu and sign out cleanly', async ({ page }) => {
    await injectAuthSession(page, TEST_USER_EMAIL);

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const avatarBtn = page.locator('button[aria-label="Account menu"]:visible').first();
    await expect(avatarBtn).toBeVisible({ timeout: 8000 });
    await avatarBtn.click();

    const menuSignOutBtn = page.locator('button:has-text("Sign Out"):visible').first();
    await expect(menuSignOutBtn).toBeVisible({ timeout: 5000 });

    await page.evaluate(() => sessionStorage.setItem('lumo_signed_out', 'true'));
    await menuSignOutBtn.click();

    await expect(page.locator('button[aria-label="Account menu"]')).toHaveCount(0, { timeout: 8000 });
    await expect.poll(async () => {
      try {
        return await page.evaluate(() => localStorage.getItem('lumo_pro_email'));
      } catch {
        return 'RELOADING';
      }
    }, { timeout: 8000 }).toBeNull();
  });

  test('should show "Not you? Clear saved email." on Sign In screen and clear email on click', async ({ page }) => {
    await bypassTerms(page);

    await page.goto('/account');
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.locator('input[type="email"][placeholder="name@example.com"]').first();
    await expect(emailInput).toBeVisible({ timeout: 8000 });
    await emailInput.fill('someone@example.com');

    const clearSavedBtn = page.locator('button:has-text("Not you? Clear saved email.")');
    await expect(clearSavedBtn).toBeVisible();
    await clearSavedBtn.click();

    await expect(emailInput).toHaveValue('');
    await expect(clearSavedBtn).toHaveCount(0);
  });

  test('should slide session cookie when fewer than 7 days remain and keep unchanged when >= 7 days remain', async ({ request }) => {
    // 1. Unauthenticated -> signedIn: false
    const unauthRes = await request.get('/api/account/session');
    expect(unauthRes.status()).toBe(200);
    const unauthData = await unauthRes.json();
    expect(unauthData.signedIn).toBe(false);
    expect(unauthData.email).toBeNull();

    // 2. Token expiring in 5 days (< 7 days threshold) -> should re-issue cookie & return renewed: true
    const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
    const expiringSoonToken = createTestSessionToken(TEST_USER_EMAIL, fiveDaysMs);
    const renewRes = await request.get('/api/account/session', {
      headers: { 'x-account-session': expiringSoonToken },
    });
    expect(renewRes.status()).toBe(200);
    const renewData = await renewRes.json();
    expect(renewData.signedIn).toBe(true);
    expect(renewData.email).toBe(TEST_USER_EMAIL);
    expect(renewData.renewed).toBe(true);
    expect(typeof renewData.sessionToken).toBe('string');
    const setCookieHeader = renewRes.headers()['set-cookie'] || '';
    expect(setCookieHeader).toContain('lumo_account_session=');
    expect(setCookieHeader).toContain('Max-Age=2592000');

    // 3. Token expiring in 20 days (>= 7 days threshold) -> should NOT re-issue cookie
    const twentyDaysMs = 20 * 24 * 60 * 60 * 1000;
    const freshToken = createTestSessionToken(TEST_USER_EMAIL, twentyDaysMs);
    const freshRes = await request.get('/api/account/session', {
      headers: { 'x-account-session': freshToken },
    });
    expect(freshRes.status()).toBe(200);
    const freshData = await freshRes.json();
    expect(freshData.signedIn).toBe(true);
    expect(freshData.email).toBe(TEST_USER_EMAIL);
    expect(freshData.renewed).toBeUndefined();
    expect(freshRes.headers()['set-cookie']).toBeUndefined();
  });

  test('should sign out cleanly and clear session without stale state', async ({ page }) => {
    await injectAuthSession(page, TEST_USER_EMAIL);

    await page.route('**/api/stripe/subscription-details', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          verified: true,
          active: true,
          email: TEST_USER_EMAIL,
          nextBillingDate: 'December 31, 2026',
          subscriptionId: 'sub_test_123'
        })
      });
    });

    await page.goto('/account?tab=security');
    await page.waitForLoadState('domcontentloaded');

    // Locate and click Sign Out button
    const signOutBtn = page.locator('button:has-text("Sign Out")').first();
    await expect(signOutBtn).toBeVisible({ timeout: 10000 });

    // Mark session storage so initScript does not re-populate on reload
    await page.evaluate(() => sessionStorage.setItem('lumo_signed_out', 'true'));
    await signOutBtn.click();

    // Verify session localStorage is wiped and stays wiped after reload
    await expect(page.locator('h2:has-text("Sign In")')).toBeVisible({ timeout: 8000 });
    await expect.poll(async () => {
      try {
        return await page.evaluate(() => localStorage.getItem('lumo_pro_email'));
      } catch {
        return 'RELOADING';
      }
    }, { timeout: 8000 }).toBeNull();
  });

  test('should disable reviewer@lumobites.net bypass by default when REVIEWER_BYPASS_CODE is unset', async ({ request }) => {
    const stripeVerifyRes = await request.post('/api/stripe/verify-code', {
      data: { email: 'reviewer@lumobites.net', code: '123456' },
    });
    expect(stripeVerifyRes.status()).toBe(400);

    const sitterVerifyRes = await request.post('/api/petsitting/auth/verify-code', {
      data: { email: 'reviewer@lumobites.net', code: '123456' },
    });
    expect(sitterVerifyRes.status()).toBe(400);
  });

  test('should enforce verified session on secured routes (401 unauthenticated, 403 wrong user, 200 owner via cookie or x-account-session)', async ({ request }) => {
    const ownerEmail = 'owner-sec-test-fake@example.com';
    const otherEmail = 'other-sec-test-fake@example.com';
    const ownerToken = createTestSessionToken(ownerEmail);
    const otherToken = createTestSessionToken(otherEmail);

    // 1. /api/petsitting/pets
    const petsNoAuth = await request.get(`/api/petsitting/pets?email=${encodeURIComponent(ownerEmail)}`);
    expect(petsNoAuth.status()).toBe(401);

    const petsWrongUser = await request.get(`/api/petsitting/pets?email=${encodeURIComponent(ownerEmail)}`, {
      headers: { 'x-account-session': otherToken },
    });
    expect(petsWrongUser.status()).toBe(403);

    const petsOwnerHeader = await request.get(`/api/petsitting/pets?email=${encodeURIComponent(ownerEmail)}`, {
      headers: { 'x-account-session': ownerToken },
    });
    expect(petsOwnerHeader.status()).toBe(200);

    const petsOwnerCookie = await request.get(`/api/petsitting/pets?email=${encodeURIComponent(ownerEmail)}`, {
      headers: { Cookie: `lumo_account_session=${ownerToken}` },
    });
    expect(petsOwnerCookie.status()).toBe(200);

    // 2. /api/petsitting/owner-profile
    const ownerProfNoAuth = await request.get(`/api/petsitting/owner-profile?email=${encodeURIComponent(ownerEmail)}`);
    expect(ownerProfNoAuth.status()).toBe(401);

    const ownerProfWrongUser = await request.get(`/api/petsitting/owner-profile?email=${encodeURIComponent(ownerEmail)}`, {
      headers: { 'x-account-session': otherToken },
    });
    expect(ownerProfWrongUser.status()).toBe(403);

    const ownerProfOwner = await request.get(`/api/petsitting/owner-profile?email=${encodeURIComponent(ownerEmail)}`, {
      headers: { 'x-account-session': ownerToken },
    });
    expect(ownerProfOwner.status()).toBe(200);

    // 3. /api/petsitting/block
    const blockGetNoAuth = await request.get(`/api/petsitting/block?email=${encodeURIComponent(ownerEmail)}`);
    expect(blockGetNoAuth.status()).toBe(401);

    const blockPostWrongUser = await request.post('/api/petsitting/block', {
      headers: { 'x-account-session': otherToken },
      data: { blockerEmail: ownerEmail, blockedEmail: 'spammer@example.com' },
    });
    expect(blockPostWrongUser.status()).toBe(403);

    const blockGetOwner = await request.get(`/api/petsitting/block?email=${encodeURIComponent(ownerEmail)}`, {
      headers: { 'x-account-session': ownerToken },
    });
    expect(blockGetOwner.status()).toBe(200);

    // 4. /api/adoption/shelter (GET, PATCH, DELETE secured)
    const shelterGetNoAuth = await request.get(`/api/adoption/shelter?email=${encodeURIComponent(ownerEmail)}`);
    expect(shelterGetNoAuth.status()).toBe(401);

    const shelterGetWrongUser = await request.get(`/api/adoption/shelter?email=${encodeURIComponent(ownerEmail)}`, {
      headers: { 'x-account-session': otherToken },
    });
    expect(shelterGetWrongUser.status()).toBe(403);

    const shelterGetOwner = await request.get(`/api/adoption/shelter?email=${encodeURIComponent(ownerEmail)}`, {
      headers: { 'x-account-session': ownerToken },
    });
    expect(shelterGetOwner.status()).toBe(200);

    // 5. /api/affiliate/stats
    const affNoAuth = await request.post('/api/affiliate/stats', {
      data: { email: ownerEmail },
    });
    expect(affNoAuth.status()).toBe(401);

    const affWrongUser = await request.post('/api/affiliate/stats', {
      headers: { 'x-account-session': otherToken },
      data: { email: ownerEmail },
    });
    expect(affWrongUser.status()).toBe(403);

    // 6. /api/stripe/cancel-partner-subscription & reactivate-partner-subscription
    const cancelNoAuth = await request.post('/api/stripe/cancel-partner-subscription', {
      data: { partner_id: '00000000-0000-0000-0000-000000000000', partner_type: 'shelter' },
    });
    expect(cancelNoAuth.status()).toBe(401);

    const reactivateNoAuth = await request.post('/api/stripe/reactivate-partner-subscription', {
      data: { partner_id: '00000000-0000-0000-0000-000000000000', partner_type: 'shelter' },
    });
    expect(reactivateNoAuth.status()).toBe(401);

    // 7. /api/petsitting/auth/signout-all-devices
    const signoutAllNoAuth = await request.post('/api/petsitting/auth/signout-all-devices', {
      data: { email: ownerEmail },
    });
    expect(signoutAllNoAuth.status()).toBe(401);

    const signoutAllWrongUser = await request.post('/api/petsitting/auth/signout-all-devices', {
      headers: { 'x-account-session': otherToken },
      data: { email: ownerEmail },
    });
    expect(signoutAllWrongUser.status()).toBe(403);
  });
});
