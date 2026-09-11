import { test, expect } from '@playwright/test';
import { TEST_USER_EMAIL, TEST_USER_CODE, injectAuthSession, bypassTerms } from './helpers/auth';

test.describe('Flow 1: Authentication & Session Lifecycle', () => {
  test('should sign in via verification code and update UI immediately without refresh', async ({ page }) => {
    await bypassTerms(page);

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
          token: 'mock-test-session-token',
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

    await page.route('**/api/account/signout', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });

    await page.goto('/account?tab=security');
    await page.waitForLoadState('domcontentloaded');

    // Locate and click Sign Out button
    const signOutBtn = page.locator('button:has-text("Sign Out")').first();
    await expect(signOutBtn).toBeVisible({ timeout: 10000 });

    // Mark session storage so initScript does not re-populate on reload
    await page.evaluate(() => sessionStorage.setItem('lumo_signed_out', 'true'));
    await signOutBtn.click();

    // Verify session localStorage is wiped
    await page.waitForTimeout(1000);
    const storedEmail = await page.evaluate(() => localStorage.getItem('lumo_pro_email'));
    expect(storedEmail).toBeFalsy();
  });
});
