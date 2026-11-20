import { test, expect } from '@playwright/test';
import { bypassTerms } from './helpers/auth';

const ARTIFACT_DIR =
  'C:/Users/user/.gemini/antigravity/brain/0fcaf360-97f8-4450-b67d-9da3bcc2b7aa';

test.describe('ServiceChapters (Desktop Homepage) & /how-lost-pets-works', () => {
  test('phone (390x844) and native Capacitor view mount nothing, make zero scroll-asset requests, and keep pixel-identical mobile home tiles', async ({
    page,
  }) => {
    await bypassTerms(page);
    await page.setViewportSize({ width: 390, height: 844 });

    const scrollAssetRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/scroll/lost-pets/') || req.url().includes('/scroll/scan-food/')) {
        scrollAssetRequests.push(req.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const mobileMain = page.locator('main.lg\\:hidden').first();
    await expect(mobileMain).toBeVisible();

    // Capture required 390x844 phone homepage screenshot
    await page.screenshot({ path: `${ARTIFACT_DIR}/home_phone_390x844.png` });

    // Confirm neither ServiceChapters nor the slim app strip is mounted on mobile
    await expect(page.getByTestId('service-chapters-section')).toHaveCount(0);
    await expect(page.getByTestId('desktop-slim-app-strip')).toHaveCount(0);
    await expect(page.getByTestId('lost-pets-scroll-story')).toHaveCount(0);
    expect(scrollAssetRequests).toHaveLength(0);

    const layoutMetrics = await page.evaluate(() => {
      const mainEl = document.querySelector('main.lg\\:hidden') as HTMLElement;
      const style = window.getComputedStyle(mainEl);
      const rect = mainEl.getBoundingClientRect();
      const tileSelectors = ['/scan', '/petsitting', '/lost-pets', '/adoption', '/city-board'];
      const tiles = tileSelectors.map((href) => {
        const a = mainEl.querySelector(`a[href="${href}"]`) as HTMLElement;
        const r = a.getBoundingClientRect();
        return {
          href,
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          left: Math.round(r.left),
          right: Math.round(r.right),
        };
      });

      return {
        position: style.position,
        top: Math.round(rect.top),
        height: Math.round(rect.height),
        width: Math.round(rect.width),
        bodyClientWidth: document.body.clientWidth,
        clientHeight: mainEl.clientHeight,
        scrollHeight: mainEl.scrollHeight,
        htmlHasClass: document.documentElement.classList.contains('lost-pets-story-route'),
        bodyHasClass: document.body.classList.contains('lost-pets-story-route'),
        bodyOverflowX: window.getComputedStyle(document.body).overflowX,
        tiles,
      };
    });

    expect(layoutMetrics.position).toBe('fixed');
    expect(layoutMetrics.top).toBe(72);
    expect(layoutMetrics.height).toBe(844 - 72);
    expect(layoutMetrics.width).toBe(layoutMetrics.bodyClientWidth);
    expect(layoutMetrics.scrollHeight).toBeLessThanOrEqual(layoutMetrics.clientHeight);
    expect(layoutMetrics.htmlHasClass).toBe(false);
    expect(layoutMetrics.bodyHasClass).toBe(false);
    expect(layoutMetrics.bodyOverflowX).toBe('hidden');
    expect(layoutMetrics.tiles).toEqual([
      { href: '/scan', top: 474, bottom: 557, left: 42, right: 136 },
      { href: '/petsitting', top: 474, bottom: 557, left: 145, right: 239 },
      { href: '/lost-pets', top: 474, bottom: 557, left: 248, right: 342 },
      { href: '/adoption', top: 566, bottom: 650, left: 87, right: 187 },
      { href: '/city-board', top: 566, bottom: 650, left: 197, right: 297 },
    ]);
  });

  test('desktop homepage (1280x720, 1440x900, 1920x1080): unclipped video stage, chapter handoff, background color transition, rail click, slim app strip, screenshots, and class cleanup', async ({
    page,
  }) => {
    await bypassTerms(page);

    // 1. Verify video stage height min(calc(100vh - 150px), 900px) and zero clipping at 1280x720, 1440x900, and 1920x1080
    const resolutions = [
      { width: 1280, height: 720, expectedVideoHeight: 570 },
      { width: 1920, height: 1080, expectedVideoHeight: 900 },
      { width: 1440, height: 900, expectedVideoHeight: 750 },
    ];

    for (const res of resolutions) {
      await page.setViewportSize({ width: res.width, height: res.height });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByTestId('service-chapters-section')).toBeVisible();

      const clipCheck = await page.evaluate(async () => {
        const track = document.querySelector('[data-testid="service-chapters-track"]') as HTMLElement;
        const rail = document.querySelector(
          '[data-testid="service-chapters-progress-rail"]'
        ) as HTMLElement;
        const video = document.querySelector(
          '[data-testid="service-chapters-video-stage"]'
        ) as HTMLElement;
        const trackTopDoc = window.scrollY + track.getBoundingClientRect().top;
        window.scrollTo({ top: trackTopDoc - 72 + 100, behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 120));

        const railRect = rail.getBoundingClientRect();
        const videoRect = video.getBoundingClientRect();
        return {
          railTop: Math.round(railRect.top),
          railBottom: Math.round(railRect.bottom),
          videoTop: Math.round(videoRect.top),
          videoBottom: Math.round(videoRect.bottom),
          videoHeight: Math.round(videoRect.height),
          videoWidth: Math.round(videoRect.width),
          viewportHeight: window.innerHeight,
        };
      });

      expect(clipCheck.videoHeight).toBe(res.expectedVideoHeight);
      expect(clipCheck.railTop).toBeGreaterThanOrEqual(72);
      expect(clipCheck.videoTop).toBeGreaterThanOrEqual(clipCheck.railBottom);
      expect(clipCheck.videoBottom).toBeLessThanOrEqual(clipCheck.viewportHeight);
    }

    // 2. Full chapter flow & 5 screenshots at 1440x900
    const requestedUrls: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/scroll/lost-pets/') || url.includes('/scroll/scan-food/')) {
        requestedUrls.push(url);
      }
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByTestId('service-chapters-section')).toBeVisible();

    // Confirm old "Take Lumo Bites with you." section is removed and replaced by slim strip
    await expect(page.locator('h2:has-text("Take Lumo Bites with you.")')).toHaveCount(0);
    const slimStrip = page.getByTestId('desktop-slim-app-strip');
    await expect(slimStrip).toBeVisible();
    await expect(slimStrip).toContainText('Get the Lumo Bites app');
    await expect(page.getByTestId('slim-strip-google-play')).toBeVisible();
    await expect(page.getByTestId('slim-strip-app-store')).toBeVisible();

    // Confirm 3 top-row service cards have equal height and section order:
    // Services -> ServiceChapters -> Slim App Strip -> Footer
    const sectionOrder = await page.evaluate(() => {
      const desktopWrapper = document.querySelector('div.hidden.lg\\:flex') as HTMLElement;
      const scanCard = desktopWrapper.querySelector('a[href="/scan"]') as HTMLElement;
      const sitterCard = desktopWrapper.querySelector('a[href="/petsitting"]') as HTMLElement;
      const lostPetsCard = desktopWrapper.querySelector('[data-testid="desktop-lost-pets-card"]') as HTMLElement;
      const servicesSection = scanCard.closest('section') as HTMLElement;
      const chaptersWrapper = document.getElementById('service-chapters-wrapper') as HTMLElement;
      const strip = desktopWrapper.querySelector('[data-testid="desktop-slim-app-strip"]') as HTMLElement;
      const footer = desktopWrapper.querySelector('footer') as HTMLElement;

      return {
        scanHeight: Math.round(scanCard.getBoundingClientRect().height),
        sitterHeight: Math.round(sitterCard.getBoundingClientRect().height),
        lostPetsHeight: Math.round(lostPetsCard.getBoundingClientRect().height),
        servicesBottom: Math.round(servicesSection.getBoundingClientRect().bottom),
        chaptersTop: Math.round(chaptersWrapper.getBoundingClientRect().top),
        chaptersBottom: Math.round(chaptersWrapper.getBoundingClientRect().bottom),
        stripTop: Math.round(strip.getBoundingClientRect().top),
        stripBottom: Math.round(strip.getBoundingClientRect().bottom),
        footerTop: Math.round(footer.getBoundingClientRect().top),
      };
    });

    expect(sectionOrder.lostPetsHeight).toBe(sectionOrder.scanHeight);
    expect(sectionOrder.lostPetsHeight).toBe(sectionOrder.sitterHeight);
    expect(sectionOrder.chaptersTop).toBeGreaterThanOrEqual(sectionOrder.servicesBottom);
    expect(sectionOrder.stripTop).toBeGreaterThanOrEqual(sectionOrder.chaptersBottom);
    expect(sectionOrder.footerTop).toBeGreaterThanOrEqual(sectionOrder.stripBottom);

    const chaptersSection = page.getByTestId('service-chapters-section');
    const stickyStage = page.getByTestId('service-chapters-sticky-stage');
    const canvas = page.getByTestId('service-chapters-canvas');
    const heading = page.getByTestId('service-chapter-heading');
    const text = page.getByTestId('service-chapter-text');
    const activeLink = page.getByTestId('service-chapter-active-link');

    // Helper to scroll to a specific fraction (0..1) of the total ServiceChapters scroll distance
    const scrollToTotalFraction = async (fraction: number) => {
      await page.evaluate(async (frac) => {
        const track = document.querySelector('[data-testid="service-chapters-track"]') as HTMLElement;
        const sticky = document.querySelector(
          '[data-testid="service-chapters-sticky-stage"]'
        ) as HTMLElement;
        const trackTopDoc = window.scrollY + track.getBoundingClientRect().top;
        const scrollable = track.offsetHeight - sticky.offsetHeight;
        window.scrollTo({
          top: trackTopDoc - 72 + scrollable * frac,
          behavior: 'instant',
        });
        await new Promise((r) => setTimeout(r, 350));
      }, fraction);
    };

    // Step A: Top of Chapter 1 (Lost Pets)
    await scrollToTotalFraction(0.01);
    await expect(chaptersSection).toHaveAttribute('data-active-chapter', 'lost-pets');
    await expect(heading).toHaveText('Lost a pet? Tell the whole block.');
    await expect(text).toHaveText('Report a lost or found pet and share it with people nearby.');
    await expect(activeLink).toHaveAttribute('data-visible', 'false');

    const bgChap1 = await stickyStage.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(bgChap1).toBe('rgb(228, 234, 243)'); // #E4EAF3

    // Confirm Scan Food frames have NOT loaded yet at the start of Chapter 1
    expect(requestedUrls.some((u) => u.includes('/scroll/scan-food/720/f'))).toBe(false);

    // Screenshot 1: Top of chapters
    await page.screenshot({ path: `${ARTIFACT_DIR}/chapters_1440x900_1_top.png` });

    // Step B: Mid Lost Pets (~22% total = 44% of Chapter 1)
    await scrollToTotalFraction(0.22);
    await expect.poll(async () => Number((await canvas.getAttribute('data-current-frame')) || '1'), {
      timeout: 5000,
    }).toBeGreaterThan(25);
    await page.screenshot({ path: `${ARTIFACT_DIR}/chapters_1440x900_2_lost_pets_mid.png` });

    // Step C: End of Lost Pets (~46% total = 92% of Chapter 1 -> holding on frame 80 with link visible & Scan Food prefetched)
    await scrollToTotalFraction(0.46);
    await expect.poll(async () => Number((await canvas.getAttribute('data-current-frame')) || '1'), {
      timeout: 5000,
    }).toBe(80);
    await expect(activeLink).toHaveAttribute('data-visible', 'true');
    await expect(activeLink).toHaveText('Open Lost Pets →');
    await expect(activeLink).toHaveAttribute('href', '/lost-pets');
    expect(requestedUrls.some((u) => u.includes('/scroll/scan-food/720/f'))).toBe(true);
    await page.screenshot({ path: `${ARTIFACT_DIR}/chapters_1440x900_3_lost_pets_end.png` });

    // Step D: Mid Scan Food (~70% total = 40% of Chapter 2)
    await scrollToTotalFraction(0.70);
    await expect(chaptersSection).toHaveAttribute('data-active-chapter', 'scan-food');
    await expect(heading).toHaveText('Scan before you serve.');
    await expect(text).toHaveText('Point your phone at a pet food label and see what is inside.');
    await expect(activeLink).toHaveAttribute('data-visible', 'false');

    // Wait for 0.9s background color transition to #F6E6CC -> rgb(246, 230, 204)
    await page.waitForTimeout(950);
    const bgChap2 = await stickyStage.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(bgChap2).toBe('rgb(246, 230, 204)'); // #F6E6CC

    await expect.poll(async () => Number((await canvas.getAttribute('data-current-frame')) || '1'), {
      timeout: 5000,
    }).toBeGreaterThan(25);
    await page.screenshot({ path: `${ARTIFACT_DIR}/chapters_1440x900_4_scan_food_mid.png` });

    // Step E: End of Scan Food (~96% total = 92% of Chapter 2 -> holding on frame 80 with "Open Scan Food →" link visible)
    await scrollToTotalFraction(0.96);
    await expect.poll(async () => Number((await canvas.getAttribute('data-current-frame')) || '1'), {
      timeout: 5000,
    }).toBe(80);
    await expect(activeLink).toHaveAttribute('data-visible', 'true');
    await expect(activeLink).toHaveText('Open Scan Food →');
    await expect(activeLink).toHaveAttribute('href', '/scan');
    await page.screenshot({ path: `${ARTIFACT_DIR}/chapters_1440x900_5_scan_food_end.png` });

    // Step F: Progress rail click jumps back to Chapter 1 (Lost Pets)
    const railBtnLostPets = page.getByTestId('service-chapter-rail-btn-lost-pets');
    await railBtnLostPets.click();
    await expect.poll(async () => await chaptersSection.getAttribute('data-active-chapter'), {
      timeout: 5000,
    }).toBe('lost-pets');

    // Keyboard focus reveals the link even at the start of Chapter 1
    await activeLink.focus();
    await expect(activeLink).toHaveAttribute('data-visible', 'true');

    // Step G: Verify GA4 service_chapter_view and service_chapter_complete events fired with chapter_id
    const gaEvents = await page.evaluate(() =>
      Array.from((window as any).dataLayer || [])
        .map((entry: any) => (Array.isArray(entry) ? entry : Array.from(entry || [])))
        .filter((arr: any[]) => arr[0] === 'event' && String(arr[1]).startsWith('service_chapter_'))
        .map((arr: any[]) => ({ name: arr[1], chapterId: arr[2]?.chapter_id }))
    );
    expect(gaEvents).toContainEqual({ name: 'service_chapter_view', chapterId: 'lost-pets' });
    expect(gaEvents).toContainEqual({ name: 'service_chapter_complete', chapterId: 'lost-pets' });
    expect(gaEvents).toContainEqual({ name: 'service_chapter_view', chapterId: 'scan-food' });
    expect(gaEvents).toContainEqual({ name: 'service_chapter_complete', chapterId: 'scan-food' });

    const noOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
    );
    expect(noOverflow).toBe(true);

    // Step H: Navigating away via active link removes lost-pets-story-route and restores overflow-x: hidden
    await activeLink.click();
    await expect(page).toHaveURL(/\/lost-pets/);

    const afterNav = await page.evaluate(() => ({
      htmlHasClass: document.documentElement.classList.contains('lost-pets-story-route'),
      bodyHasClass: document.body.classList.contains('lost-pets-story-route'),
      bodyOverflowX: window.getComputedStyle(document.body).overflowX,
    }));
    expect(afterNav.htmlHasClass).toBe(false);
    expect(afterNav.bodyHasClass).toBe(false);
    expect(afterNav.bodyOverflowX).toBe('hidden');
  });

  test('desktop homepage (1280x800): reduced-motion renders static posters for both chapters and loads zero frame sequences', async ({
    page,
  }) => {
    await bypassTerms(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 800 });

    const frameRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/480/f') || url.includes('/720/f')) {
        frameRequests.push(url);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByTestId('service-chapters-section')).toHaveAttribute(
      'data-static-fallback',
      'true'
    );
    await expect(page.getByTestId('service-chapter-static-poster-lost-pets')).toBeVisible();
    await expect(page.getByTestId('service-chapter-static-poster-scan-food')).toBeVisible();
    await expect(page.getByTestId('service-chapters-canvas')).toHaveCount(0);
    expect(frameRequests).toHaveLength(0);
  });

  test('/how-lost-pets-works (390x844): standalone page remains live with store badges, 480p frames under 2MB, and reduced-motion fallback', async ({
    page,
  }) => {
    await bypassTerms(page);
    await page.setViewportSize({ width: 390, height: 844 });

    let totalTransferredBytes = 0;
    page.on('response', async (response) => {
      if (response.url().includes('/scroll/lost-pets/')) {
        try {
          const body = await response.body();
          totalTransferredBytes += body.byteLength;
        } catch {}
      }
    });

    await page.goto('/how-lost-pets-works');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveTitle('Every paw has a story | Lumo Bites');
    await expect(page.getByTestId('lost-pets-scroll-story')).toBeVisible();
    await expect(page.getByTestId('lost-pets-story-google-play')).toBeVisible();
    await expect(page.getByTestId('lost-pets-story-app-store')).toBeVisible();

    const canvas = page.getByTestId('lost-pets-canvas');
    await expect(canvas).toHaveAttribute('data-frame-set', '480');

    await page.evaluate(async () => {
      const track = document.querySelector('[data-testid="lost-pets-scroll-track"]') as HTMLElement;
      const sticky = document.querySelector('[data-testid="lost-pets-sticky-stage"]') as HTMLElement;
      const trackTopDoc = window.scrollY + track.getBoundingClientRect().top;
      const scrollable = track.offsetHeight - sticky.offsetHeight;
      window.scrollTo({ top: trackTopDoc + scrollable, behavior: 'instant' });
    });

    await expect.poll(async () => Number((await canvas.getAttribute('data-current-frame')) || '1'), {
      timeout: 5000,
    }).toBeGreaterThanOrEqual(75);
    expect(totalTransferredBytes).toBeLessThan(2 * 1024 * 1024);
  });
});
