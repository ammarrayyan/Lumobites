import { test, expect } from '@playwright/test';
import { TEST_USER_EMAIL, injectAuthSession } from './helpers/auth';

test.describe('Flow 2: Comment and Reply Lifecycle (Delete Verification)', () => {
  test('should delete a comment immediately and remain removed after refresh', async ({ page }) => {
    await injectAuthSession(page, TEST_USER_EMAIL);

    let commentsState = [
      {
        id: 'test-comment-1',
        post_id: 'post-100',
        author_name: 'reviewer',
        author_email: TEST_USER_EMAIL,
        content: 'This is a test sighting update',
        created_at: new Date().toISOString(),
        parent_id: null,
      }
    ];

    // Mock API for comments fetch and delete
    await page.route('**/api/lost-pets/comments**', async (route) => {
      const request = route.request();
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ comments: commentsState })
        });
      } else if (request.method() === 'DELETE') {
        const body = JSON.parse(request.postData() || '{}');
        commentsState = commentsState.filter(c => c.id !== body.commentId);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/lost-pets/post-100', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          pet: {
            id: 'post-100',
            pet_name: 'Milo',
            species: 'dog',
            type: 'lost',
            status: 'active',
            description: 'Lost golden retriever with red collar',
            city: 'Austin',
            zip_code: '78701',
            date_lost_found: new Date().toISOString(),
            contact_email: 'other_owner@example.com',
            reaction_count: 3,
            photos: []
          }
        })
      });
    });

    await page.goto('/lost-pets/post-100');
    await page.waitForLoadState('domcontentloaded');

    // Verify test comment is visible
    const commentText = page.locator('text="This is a test sighting update"');
    await expect(commentText).toBeVisible({ timeout: 10000 });

    // Handle confirm dialog automatically
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Locate and click Delete button for the comment
    const deleteBtn = page.locator('button:has-text("Delete")').first();
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Verify comment is removed from the DOM immediately
    await expect(commentText).not.toBeVisible({ timeout: 5000 });

    // Reload page and confirm it remains deleted
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(commentText).not.toBeVisible({ timeout: 5000 });
  });
});
