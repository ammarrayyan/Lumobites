import { test, expect, devices } from '@playwright/test';
import { TEST_USER_EMAIL, injectAuthSession } from './helpers/auth';

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

test.describe('Flow 7: Adoption Pet Chat on Mobile Viewport', () => {
  test('should open ChatModal for shelter pet on mobile, send inquiry message, and render bubble without crashing', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => {
      pageErrors.push(err);
    });

    await injectAuthSession(page, TEST_USER_EMAIL);

    let adoptionMessages: any[] = [];

    await page.route('**/api/adoption/messages**', async (route) => {
      const req = route.request();
      if (req.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            messages: adoptionMessages,
            pet: {
              id: 'pet-adopt-1',
              name: 'Luna',
              status: 'available',
              species: 'dog',
              shelter_id: 'shelter-123'
            }
          })
        });
      } else if (req.method() === 'POST') {
        const body = JSON.parse(req.postData() || '{}');
        const newMsg = {
          id: 'adopt-msg-' + Date.now(),
          pet_id: body.pet_id || 'pet-adopt-1',
          sender_email: TEST_USER_EMAIL,
          receiver_email: body.receiver_email || 'shelter@example.com',
          message: body.message,
          read: false,
          created_at: new Date().toISOString()
        };
        adoptionMessages.push(newMsg);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: newMsg })
        });
      }
    });

    await page.route('**/api/adoption/pets**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          pets: [
            {
              id: 'pet-adopt-1',
              name: 'Luna',
              species: 'dog',
              breed: 'Golden Retriever',
              age: '2 years',
              status: 'available',
              shelter_id: 'shelter-123',
              shelter_name: 'Happy Tails Rescue',
              shelter_email: 'shelter@example.com',
              photo_urls: ['/placeholder-dog.png']
            }
          ]
        })
      });
    });

    await page.goto('/adoption');
    await page.waitForLoadState('domcontentloaded');

    const inquireBtn = page.locator('button:has-text("Ask About"), button:has-text("Message Shelter"), button:has-text("Inquire")').first();
    await expect(inquireBtn).toBeVisible({ timeout: 10000 });
    await inquireBtn.click({ force: true });

    const chatTextarea = page.locator('textarea').first();
    await expect(chatTextarea).toBeVisible({ timeout: 8000 });

    await expect(page.locator('text=Say hello to')).toBeVisible({ timeout: 5000 });

    const inquiryText = 'Hi! Is Luna good with cats and other dogs?';
    await chatTextarea.fill(inquiryText);

    const sendBtn = page.locator('button:has(svg.lucide-send)').first();
    await sendBtn.click({ force: true });

    const messageBubble = page.locator('text=' + inquiryText);
    await expect(messageBubble).toBeVisible({ timeout: 8000 });

    const dateHeader = page.locator('text=Today').first();
    await expect(dateHeader).toBeVisible({ timeout: 5000 });

    expect(pageErrors.length).toBe(0);
  });
});
