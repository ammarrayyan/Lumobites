import { test, expect } from '@playwright/test';
import { TEST_USER_EMAIL, injectAuthSession } from './helpers/auth';

test.describe('Flow 6: Pet Sitting Booking Submission Flow', () => {
  test('should display sitter profile and allow opening booking request modal', async ({ page }) => {
    await injectAuthSession(page, TEST_USER_EMAIL);

    // Mock all relevant petsitting endpoints
    await page.route('**/api/petsitting/geocode**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          lat: 30.2672,
          lng: -97.7431,
          city: 'Austin',
          formatted_address: 'Austin, TX, USA'
        })
      });
    });

    await page.route('**/api/petsitting/vet-clinics**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clinics: [] })
      });
    });

    await page.route('**/api/petsitting/daycares**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ daycares: [] })
      });
    });

    await page.route('**/api/petsitting/sitters**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isOwnerPro: true,
          sitters: [
            {
              id: 'sitter-test-1',
              name: 'Sarah Jenkins',
              bio: 'Experienced dog and cat sitter with 5+ years experience.',
              city: 'Austin',
              zip: '78701',
              lat: 30.2672,
              lng: -97.7431,
              photo_url: '',
              pet_types: 'Dogs, Cats',
              service_types: ['Dog walking', 'Home visits'],
              rate_per_night: 35,
              avg_rating: 4.9,
              review_count: 12,
              is_approved: true
            }
          ]
        })
      });
    });

    await page.route('**/api/petsitting/requests**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ requests: [] })
      });
    });

    await page.route('**/api/petsitting/pets**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ pets: [] })
      });
    });

    await page.addInitScript(() => {
      sessionStorage.setItem('lumo_petsitting_search_state', JSON.stringify({
        activeTab: 'find',
        searchZip: 'Austin',
        searchLocationName: 'Austin, TX, USA',
        searchCoords: { lat: 30.2672, lng: -97.7431 },
        searchRadius: 'any',
        searchPetType: 'all',
        searchDay: 'all',
        searchServiceType: 'all'
      }));
    });

    await page.goto('/petsitting?tab=find');
    await page.waitForLoadState('domcontentloaded');

    // Locate the formatted sitter card (masked as Sarah J.)
    const sitterName = page.locator('text="Sarah J."').first();
    await expect(sitterName).toBeVisible({ timeout: 12000 });

    // Open booking / profile modal
    const bookBtn = page.locator('button:has-text("View Profile & Book"), button:has-text("Book Sitter")').first();
    await expect(bookBtn).toBeVisible({ timeout: 8000 });
    await bookBtn.click({ force: true });

    // Verify modal / profile view is shown
    const requestTitle = page.locator('h3:has-text("Sarah J.")').first();
    await expect(requestTitle).toBeVisible({ timeout: 8000 });
  });
});
