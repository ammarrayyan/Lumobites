import { test, expect } from '@playwright/test';
import { TEST_USER_EMAIL, injectAuthSession } from './helpers/auth';

test.describe('Flow 4: Lost Pets In-App Messaging (ChatModal)', () => {
  test('should open ChatModal, send a message, and display it in the conversation thread', async ({ page }) => {
    await injectAuthSession(page, TEST_USER_EMAIL);

    let messagesList: any[] = [];

    // Mock Lost Pets Messages API
    await page.route('**/api/lost-pets/messages**', async (route) => {
      const req = route.request();
      if (req.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ messages: messagesList })
        });
      } else if (req.method() === 'POST') {
        const body = JSON.parse(req.postData() || '{}');
        const newMsg = {
          id: 'msg-' + Date.now(),
          lost_pet_id: body.lost_pet_id || 'pet-chat-1',
          sender_email: TEST_USER_EMAIL,
          receiver_email: body.receiver_email || 'finder@example.com',
          message: body.message,
          read: false,
          created_at: new Date().toISOString()
        };
        messagesList.push(newMsg);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: newMsg })
        });
      }
    });

    await page.route('**/api/lost-pets/pet-chat-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          pet: {
            id: 'pet-chat-1',
            pet_name: 'Charlie',
            species: 'cat',
            type: 'lost',
            status: 'active',
            description: 'Lost grey tabby cat',
            city: 'Seattle',
            date_lost_found: new Date().toISOString(),
            contact_email: 'finder@example.com',
            reaction_count: 2,
            photos: []
          }
        })
      });
    });

    await page.goto('/lost-pets/pet-chat-1');
    await page.waitForLoadState('domcontentloaded');

    // Click "Message"
    const messageBtn = page.locator('button:has-text("Message")').first();
    await expect(messageBtn).toBeVisible({ timeout: 10000 });
    await messageBtn.click({ force: true });

    // Verify Chat modal textarea is opened
    const chatTextarea = page.locator('textarea').first();
    await expect(chatTextarea).toBeVisible({ timeout: 8000 });

    // Type test message and send
    const testMessageText = 'Hello, I think I saw Charlie near 5th Ave!';
    await chatTextarea.fill(testMessageText);

    // Click send or press Enter
    const sendBtn = page.locator('button:has(svg.lucide-send), button:has-text("Send")').first();
    await sendBtn.click({ force: true });

    // Verify message bubble appears in conversation thread
    const messageBubble = page.locator('text=' + testMessageText);
    await expect(messageBubble).toBeVisible({ timeout: 8000 });
  });
});
