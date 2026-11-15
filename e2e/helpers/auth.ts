import { Page, expect } from '@playwright/test';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

export const TEST_USER_EMAIL = 'reviewer@lumobites.net';
export const TEST_USER_CODE = '123456';

export function createTestSessionToken(
  email: string = TEST_USER_EMAIL,
  expiresInMs: number = 30 * 24 * 60 * 60 * 1000
): string {
  const secret = process.env.ACCOUNT_SESSION_SECRET || 'lumo_account_session_secret_dev_only_2026';
  const cleanEmail = email.toLowerCase().trim();
  const issuedAtMs = Date.now();
  const expiresAtMs = issuedAtMs + expiresInMs;
  const payload = `${cleanEmail}:${issuedAtMs}:${expiresAtMs}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  return `${payload}:${signature}`;
}

export async function bypassTerms(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('lumo_terms_accepted', 'true');
    localStorage.setItem('lumo_age_confirmed', 'true');
  });
}

export async function injectAuthSession(page: Page, email: string = TEST_USER_EMAIL) {
  const validToken = createTestSessionToken(email);

  await page.context().addCookies([
    {
      name: 'lumo_account_session',
      value: validToken,
      url: 'http://localhost:3000',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);

  await page.addInitScript(
    ({ userEmail, sessionToken }) => {
      // Only inject if not already explicitly signed out
      if (sessionStorage.getItem('lumo_signed_out') === 'true') return;
      localStorage.setItem('lumo_terms_accepted', 'true');
      localStorage.setItem('lumo_age_confirmed', 'true');
      localStorage.setItem('lumo_pro_email', userEmail);
      localStorage.setItem('lumo_user_email', userEmail);
      localStorage.setItem('lumo_account_session_token', sessionToken);
      localStorage.setItem('lumo_session_started_at', new Date().toISOString());
      document.cookie = 'lumo_pro_email=' + userEmail + '; path=/; max-age=2592000';
    },
    { userEmail: email, sessionToken: validToken }
  );
}

export async function signInViaUI(page: Page, email: string = TEST_USER_EMAIL, code: string = TEST_USER_CODE) {
  await bypassTerms(page);
  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const signInButton = page.locator('button:has-text("Sign In")').first();
  if (await signInButton.isVisible()) {
    await signInButton.click();
  } else {
    await page.evaluate(() => window.dispatchEvent(new Event('lumo-open-signin')));
  }

  const emailInput = page.locator('input[type="email"][placeholder="name@example.com"]').first();
  await expect(emailInput).toBeVisible({ timeout: 5000 });
  await emailInput.fill(email);

  const sendCodeBtn = page.locator('button:has-text("Send Code")').first();
  await sendCodeBtn.click();

  const codeInput = page.locator('input[inputmode="numeric"]').first();
  await expect(codeInput).toBeVisible({ timeout: 8000 });
  await codeInput.fill(code);

  const verifyBtn = page.locator('button:has-text("Verify & Sign In")').first();
  await verifyBtn.click();

  await expect(codeInput).not.toBeVisible({ timeout: 8000 });
}
