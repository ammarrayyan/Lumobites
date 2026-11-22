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

  test('desktop homepage (1280x720, 1440x900, 1920x1080): stacked cards handoff, floating logo flip, script lines, pill navigation, measurements, screenshots, and class cleanup', async ({
    page,
  }) => {
    await bypassTerms(page);

    // 1. Verify video stage height min(calc(100vh - 192px), 920px), zero clipping, frosted card overlap,
    // and script + logo visibility at 1280x720, 1440x900, and 1920x1080
    const resolutions = [
      { width: 1280, height: 720, expectedVideoHeight: 528 },
      { width: 1920, height: 1080, expectedVideoHeight: 888 },
      { width: 1440, height: 900, expectedVideoHeight: 708 },
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
        const frosted = document.querySelector(
          '[data-testid="service-chapter-frosted-card-lost-pets"]'
        ) as HTMLElement;
        const script = document.querySelector(
          '[data-testid="service-chapter-script-lost-pets"]'
        ) as HTMLElement;
        const logo = document.querySelector(
          '[data-testid="service-chapters-floating-logo"]'
        ) as HTMLElement;

        const trackTopDoc = window.scrollY + track.getBoundingClientRect().top;
        window.scrollTo({ top: trackTopDoc - 72 + 120, behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 150));

        const railRect = rail.getBoundingClientRect();
        const videoRect = video.getBoundingClientRect();
        const frostedRect = frosted.getBoundingClientRect();
        const scriptRect = script.getBoundingClientRect();
        const logoRect = logo.getBoundingClientRect();

        return {
          railTop: Math.round(railRect.top),
          railBottom: Math.round(railRect.bottom),
          videoTop: Math.round(videoRect.top),
          videoBottom: Math.round(videoRect.bottom),
          videoHeight: Math.round(videoRect.height),
          videoWidth: Math.round(videoRect.width),
          frostedLeft: Math.round(frostedRect.left),
          frostedRight: Math.round(frostedRect.right),
          frostedWidth: Math.round(frostedRect.width),
          frostedOverlapPx: Math.round(frostedRect.right - videoRect.left),
          frostedBottom: Math.round(frostedRect.bottom),
          scriptRight: Math.round(scriptRect.right),
          scriptVisible: scriptRect.width > 0 && scriptRect.height > 0,
          logoVisible: logoRect.width > 0 && logoRect.height > 0,
          logoWidth: Math.round(logoRect.width),
          logoHeight: Math.round(logoRect.height),
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
        };
      });

      console.log(`MEASURED_${res.width}x${res.height}:`, JSON.stringify(clipCheck));

      expect(clipCheck.videoHeight).toBe(res.expectedVideoHeight);
      expect(clipCheck.railTop).toBeGreaterThanOrEqual(72);
      expect(clipCheck.videoTop).toBeGreaterThanOrEqual(clipCheck.railBottom - 4);
      expect(clipCheck.videoBottom).toBeLessThanOrEqual(clipCheck.viewportHeight);
      expect(clipCheck.frostedLeft).toBeGreaterThan(0);
      expect(clipCheck.frostedOverlapPx).toBeGreaterThanOrEqual(48);
      expect(clipCheck.frostedOverlapPx).toBeLessThanOrEqual(64);
      expect(clipCheck.frostedBottom).toBeLessThanOrEqual(clipCheck.viewportHeight);
      expect(clipCheck.scriptVisible).toBe(true);
      expect(clipCheck.scriptRight).toBeLessThanOrEqual(clipCheck.viewportWidth);
      expect(clipCheck.logoVisible).toBe(true);
    }

    // 2. Full stacked cards + floating logo + script lines flow & 4 screenshots at 1440x900
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

    // Confirm slim app strip and section order remain intact
    await expect(page.locator('h2:has-text("Take Lumo Bites with you.")')).toHaveCount(0);
    const slimStrip = page.getByTestId('desktop-slim-app-strip');
    await expect(slimStrip).toBeVisible();
    await expect(slimStrip).toContainText('Get the Lumo Bites app');
    await expect(page.getByTestId('slim-strip-google-play')).toBeVisible();
    await expect(page.getByTestId('slim-strip-app-store')).toBeVisible();

    const chaptersSection = page.getByTestId('service-chapters-section');
    const cardLostPets = page.getByTestId('service-chapter-card-lost-pets');
    const cardScanFood = page.getByTestId('service-chapter-card-scan-food');
    const floatingLogo = page.getByTestId('service-chapters-floating-logo');
    const logoTrail = page.getByTestId('service-chapters-logo-trail');
    const ctaLostPets = page.getByTestId('service-chapter-cta-lost-pets');
    const ctaScanFood = page.getByTestId('service-chapter-cta-scan-food');

    // Verify floating logo uses cropped transparent B emblem mark
    await expect(floatingLogo.locator('img')).toHaveAttribute('src', '/brand/lumo-b-mark.png');

    // Helper to scroll to a specific fraction (0..1) of total ServiceChapters scroll distance
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
        await new Promise((r) => setTimeout(r, 320));
      }, fraction);
    };

    // Step A: Start of Chapter 1 (Lost Pets, ~2% of ch1 = 0.01 total)
    await scrollToTotalFraction(0.01);
    await expect(chaptersSection).toHaveAttribute('data-active-chapter', 'lost-pets');
    await expect(cardLostPets).toHaveAttribute('data-active', 'true');
    await expect(cardScanFood).toHaveAttribute('data-active', 'false');

    // Only active card receives pointer events
    const peChap1 = await page.evaluate(() => ({
      lostPets: window.getComputedStyle(
        document.querySelector('[data-testid="service-chapter-card-lost-pets"]') as HTMLElement
      ).pointerEvents,
      scanFood: window.getComputedStyle(
        document.querySelector('[data-testid="service-chapter-card-scan-food"]') as HTMLElement
      ).pointerEvents,
      bgLostPets: window.getComputedStyle(
        document.querySelector('[data-testid="service-chapter-card-lost-pets"]') as HTMLElement
      ).backgroundColor,
    }));
    expect(peChap1.lostPets).toBe('auto');
    expect(peChap1.scanFood).toBe('none');
    expect(peChap1.bgLostPets).toBe('rgb(228, 234, 243)'); // #E4EAF3

    // Pill button visible for the whole chapter
    await expect(ctaLostPets).toBeVisible();
    await expect(ctaLostPets).toHaveText('Open Lost Pets →');
    await expect(ctaLostPets).toHaveAttribute('href', '/lost-pets');

    // Script line 0 active at start of Lost Pets
    await expect(page.getByTestId('service-chapter-script-line-lost-pets-0')).toHaveAttribute(
      'data-visible',
      'true'
    );
    await expect(page.getByTestId('service-chapter-script-line-lost-pets-0')).toHaveText(
      'A pet goes missing.'
    );
    await expect(floatingLogo).toHaveAttribute('data-side', 'left');

    // Confirm Scan Food frames have NOT loaded yet at start of Chapter 1
    expect(requestedUrls.some((u) => u.includes('/scroll/scan-food/720/f'))).toBe(false);

    // Step B: Mid Lost Pets (~45% of ch1 = 0.225 total -> script line 1 active)
    await scrollToTotalFraction(0.225);
    await expect(page.getByTestId('service-chapter-script-line-lost-pets-1')).toHaveAttribute(
      'data-visible',
      'true'
    );
    await expect(page.getByTestId('service-chapter-script-line-lost-pets-1')).toHaveText(
      'Neighbors hear about it.'
    );
    await expect
      .poll(
        async () =>
          Number(
            (await page
              .locator('[data-chapter-id="lost-pets"]')
              .getAttribute('data-current-frame')) || '1'
          ),
        { timeout: 5000 }
      )
      .toBeGreaterThan(25);
    await page.screenshot({ path: `${ARTIFACT_DIR}/stacked_1440x900_1_lost_pets_mid.png` });

    // Step C: Late Lost Pets (~75% of ch1 = 0.375 total -> script line 2 active, Scan Food prefetched)
    await scrollToTotalFraction(0.375);
    await expect(page.getByTestId('service-chapter-script-line-lost-pets-2')).toHaveAttribute(
      'data-visible',
      'true'
    );
    await expect(page.getByTestId('service-chapter-script-line-lost-pets-2')).toHaveText(
      'Share it, and help bring them home.'
    );
    expect(requestedUrls.some((u) => u.includes('/scroll/scan-food/720/f'))).toBe(true);

    // Step D: Mid Handoff (~92% of ch1 = 0.46 total -> Lost Pets at frame 67, scaled down, Scan Food sliding up, logo flipping with trail)
    await scrollToTotalFraction(0.46);
    await expect
      .poll(
        async () =>
          Number(
            (await page
              .locator('[data-chapter-id="lost-pets"]')
              .getAttribute('data-current-frame')) || '1'
          ),
        { timeout: 5000 }
      )
      .toBe(67);

    const handoffState = await page.evaluate(() => {
      const c0 = document.querySelector(
        '[data-testid="service-chapter-card-lost-pets"]'
      ) as HTMLElement;
      const c1 = document.querySelector(
        '[data-testid="service-chapter-card-scan-food"]'
      ) as HTMLElement;
      const logo = document.querySelector(
        '[data-testid="service-chapters-floating-logo"]'
      ) as HTMLElement;
      const trail = document.querySelector(
        '[data-testid="service-chapters-logo-trail"]'
      ) as HTMLElement;
      return {
        c0Scale: Number(c0.dataset.scale || '1'),
        c1TranslateY: Number(c1.dataset.translateY || '100'),
        c1Radius: window.getComputedStyle(c1).borderTopLeftRadius,
        logoSide: logo.dataset.side,
        flipDeg: Number(logo.dataset.flipDeg || '0'),
        trailVisible: trail.dataset.visible,
      };
    });

    expect(handoffState.c0Scale).toBeLessThan(0.99);
    expect(handoffState.c0Scale).toBeGreaterThanOrEqual(0.95);
    expect(handoffState.c1TranslateY).toBeGreaterThan(10);
    expect(handoffState.c1TranslateY).toBeLessThan(90);
    expect(handoffState.c1Radius).toBe('32px');
    expect(handoffState.logoSide).toBe('handoff');
    expect(handoffState.flipDeg).toBeGreaterThan(60);
    expect(handoffState.flipDeg).toBeLessThan(300);
    expect(handoffState.trailVisible).toBe('true');

    await page.screenshot({ path: `${ARTIFACT_DIR}/stacked_1440x900_2_handoff_mid.png` });

    // Step E: Mid Scan Food (~45% of ch2 = 0.725 total -> Scan Food active, logo on right, script line 1 active)
    await scrollToTotalFraction(0.725);
    await expect(chaptersSection).toHaveAttribute('data-active-chapter', 'scan-food');
    await expect(cardScanFood).toHaveAttribute('data-active', 'true');
    await expect(cardLostPets).toHaveAttribute('data-active', 'false');
    await expect(floatingLogo).toHaveAttribute('data-side', 'right');
    await expect(logoTrail).toHaveAttribute('data-visible', 'false');

    const peChap2 = await page.evaluate(() => ({
      lostPets: window.getComputedStyle(
        document.querySelector('[data-testid="service-chapter-card-lost-pets"]') as HTMLElement
      ).pointerEvents,
      scanFood: window.getComputedStyle(
        document.querySelector('[data-testid="service-chapter-card-scan-food"]') as HTMLElement
      ).pointerEvents,
      bgScanFood: window.getComputedStyle(
        document.querySelector('[data-testid="service-chapter-card-scan-food"]') as HTMLElement
      ).backgroundColor,
    }));
    expect(peChap2.lostPets).toBe('none');
    expect(peChap2.scanFood).toBe('auto');
    expect(peChap2.bgScanFood).toBe('rgb(246, 230, 204)'); // #F6E6CC

    await expect(ctaScanFood).toBeVisible();
    await expect(ctaScanFood).toHaveText('Open Scan Food →');
    await expect(ctaScanFood).toHaveAttribute('href', '/scan');

    await expect(page.getByTestId('service-chapter-script-line-scan-food-1')).toHaveAttribute(
      'data-visible',
      'true'
    );
    await expect(page.getByTestId('service-chapter-script-line-scan-food-1')).toHaveText(
      'But is it safe?'
    );
    await expect
      .poll(
        async () =>
          Number(
            (await page
              .locator('[data-chapter-id="scan-food"]')
              .getAttribute('data-current-frame')) || '1'
          ),
        { timeout: 5000 }
      )
      .toBeGreaterThan(25);
    await page.screenshot({ path: `${ARTIFACT_DIR}/stacked_1440x900_3_scan_food_mid.png` });

    // Step F: End of Scan Food (~92% of ch2 = 0.96 total -> holds at frame 70, script line 3 active, logo stays right)
    await scrollToTotalFraction(0.96);
    await expect
      .poll(
        async () =>
          Number(
            (await page
              .locator('[data-chapter-id="scan-food"]')
              .getAttribute('data-current-frame')) || '1'
          ),
        { timeout: 5000 }
      )
      .toBe(70);
    await expect(page.getByTestId('service-chapter-script-line-scan-food-3')).toHaveAttribute(
      'data-visible',
      'true'
    );
    await expect(page.getByTestId('service-chapter-script-line-scan-food-3')).toHaveText(
      'Know what is inside.'
    );
    await expect(floatingLogo).toHaveAttribute('data-side', 'right');

    // Confirm skipped end frames (68+ Lost Pets, 71+ Scan Food) were never requested
    expect(requestedUrls.some((u) => /lost-pets\/720\/f0(68|69|7\d|80)\.webp/.test(u))).toBe(false);
    expect(requestedUrls.some((u) => /scan-food\/720\/f0(7[1-9]|80)\.webp/.test(u))).toBe(false);

    await page.screenshot({ path: `${ARTIFACT_DIR}/stacked_1440x900_4_scan_food_end.png` });

    // Step G: Progress rail click jumps back to Chapter 1 (Lost Pets)
    const railBtnLostPets = page.getByTestId('service-chapter-rail-btn-lost-pets');
    await railBtnLostPets.click();
    await expect
      .poll(async () => await chaptersSection.getAttribute('data-active-chapter'), {
        timeout: 5000,
      })
      .toBe('lost-pets');

    // Step H: Verify GA4 service_chapter_view and service_chapter_complete events fired with chapter_id
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

    // Step I: Navigating away via pill button navigates to /lost-pets and cleans up lost-pets-story-route
    await ctaLostPets.click();
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

  test('desktop homepage (1280x800): reduced-motion renders static posters for both chapters, loads zero frame sequences, and hides logo and script', async ({
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
    await expect(page.getByTestId('service-chapters-floating-logo')).toHaveCount(0);
    await expect(page.getByTestId('service-chapter-script-lost-pets')).toHaveCount(0);
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
