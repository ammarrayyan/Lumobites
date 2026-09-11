import { test, expect } from '@playwright/test';
import { TEST_USER_EMAIL, injectAuthSession } from './helpers/auth';

test.describe('Flow 5: Lost Pet Post Resolution & Button Visibility', () => {
  test('should hide Message button for own post and display Manage Post controls', async ({ page }) => {
    await injectAuthSession(page, TEST_USER_EMAIL);

    await page.route('**/api/lost-pets/own-post-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          pet: {
            id: 'own-post-1',
            pet_name: 'Luna',
            species: 'dog',
            type: 'lost',
            status: 'active',
            description: 'My lost husky',
            city: 'Denver',
            date_lost_found: new Date().toISOString(),
            contact_email: TEST_USER_EMAIL, // Owned by test user
            reaction_count: 0,
            photos: []
          }
        })
      });
    });

    await page.goto('/lost-pets/own-post-1');
    await page.waitForLoadState('domcontentloaded');

    // Confirm "Message Owner/Finder" is NOT visible for own post
    const messageBtn = page.locator('button:has-text("Message Owner"), button:has-text("Message Finder")');
    await expect(messageBtn).not.toBeVisible();

    // Confirm "Contact Information" toggle is NOT visible for own post
    const contactInfoBtn = page.locator('button:has-text("Contact Information")');
    await expect(contactInfoBtn).not.toBeVisible();

    // Confirm "Manage Your Post" section is visible
    const manageSection = page.locator('text="Manage Your Post"');
    await expect(manageSection).toBeVisible({ timeout: 5000 });

    const resolveBtn = page.locator('button:has-text("Mark as Resolved")');
    await expect(resolveBtn).toBeVisible();
  });

  test('should hide Message and Contact buttons when post status is resolved', async ({ page }) => {
    await injectAuthSession(page, TEST_USER_EMAIL);

    await page.route('**/api/lost-pets/resolved-post-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          pet: {
            id: 'resolved-post-1',
            pet_name: 'Max',
            species: 'dog',
            type: 'lost',
            status: 'resolved', // Resolved post
            description: 'Found and reunited with family!',
            city: 'Portland',
            date_lost_found: new Date().toISOString(),
            contact_email: 'someone_else@example.com',
            reaction_count: 10,
            photos: []
          }
        })
      });
    });

    await page.goto('/lost-pets/resolved-post-1');
    await page.waitForLoadState('domcontentloaded');

    // Confirm "Resolved" badge is visible
    const resolvedBadge = page.locator('span:has-text("Resolved")').first();
    await expect(resolvedBadge).toBeVisible({ timeout: 8000 });

    // Confirm "Message" and "Contact Information" buttons are completely hidden on resolved posts
    const messageBtn = page.locator('button:has-text("Message Owner"), button:has-text("Message Finder")');
    await expect(messageBtn).not.toBeVisible();

    const contactInfoBtn = page.locator('button:has-text("Contact Information")');
    await expect(contactInfoBtn).not.toBeVisible();
  });
});
