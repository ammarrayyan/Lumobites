import { test, expect } from '@playwright/test';
import { TEST_USER_EMAIL, injectAuthSession } from './helpers/auth';

test.describe('Flow 3: Reactions & Counter Integrity', () => {
  test('should increment reaction count by 1 on react and decrement by 1 on unreact', async ({ page }) => {
    await injectAuthSession(page, TEST_USER_EMAIL);

    let currentReactions = 5;
    let hasReacted = false;

    // Intercept reaction counter API
    await page.route('**/api/reactions**', async (route) => {
      const req = route.request();
      if (req.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ count: currentReactions, userReacted: hasReacted })
        });
      } else if (req.method() === 'POST') {
        if (hasReacted) {
          hasReacted = false;
          currentReactions = Math.max(0, currentReactions - 1);
        } else {
          hasReacted = true;
          currentReactions += 1;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, count: currentReactions, userReacted: hasReacted })
        });
      }
    });

    await page.route('**/api/lost-pets/react-test-post', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          pet: {
            id: 'react-test-post',
            pet_name: 'Buddy',
            species: 'dog',
            type: 'lost',
            status: 'active',
            description: 'Friendly golden lab',
            city: 'Dallas',
            date_lost_found: new Date().toISOString(),
            contact_email: 'owner@example.com',
            reaction_count: currentReactions,
            photos: []
          }
        })
      });
    });

    await page.goto('/lost-pets/react-test-post');
    await page.waitForLoadState('domcontentloaded');

    // Locate the reaction button with the heart icon
    const reactionBtn = page.locator('button:has(svg.lucide-heart)').first();
    await expect(reactionBtn).toBeVisible({ timeout: 10000 });

    // Initial click to react
    await reactionBtn.click({ force: true });
    await page.waitForTimeout(600);

    // Verify counter incremented by 1 (from 5 to 6)
    const countDisplay = reactionBtn.locator('span.text-xs');
    await expect(countDisplay).toHaveText('6', { timeout: 5000 });

    // Click again to unreact
    await reactionBtn.click({ force: true });
    await page.waitForTimeout(600);

    // Verify counter decremented back by 1 (back to 5)
    await expect(countDisplay).toHaveText('5', { timeout: 5000 });
  });
});
