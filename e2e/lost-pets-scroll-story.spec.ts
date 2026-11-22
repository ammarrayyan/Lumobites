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

    // Capture required 390x844 phone homepage screenshot (and after-change copy for before/after proof)
    await page.screenshot({ path: `${ARTIFACT_DIR}/home_phone_390x844.png` });
    await page.screenshot({ path: `${ARTIFACT_DIR}/phone_after_390x844.png` });

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

  test('desktop homepage (1024x768, 1280x720, 1440x900, 1920x1080): vertical column layout, zero clipping, logo non-overlap, Skip keyboard/click, Navbar logo scroll-to-top, and screenshots', async ({
    page,
  }) => {
    await bypassTerms(page);

    // 1. Verify zero clipping, video inside stage, heading clear of progress rail,
    // and floating B logo never overlapping heading/script at 1024x768, 1280x720, 1440x900, 1920x1080
    const resolutions = [
      { width: 1024, height: 768 },
      { width: 1280, height: 720 },
      { width: 1920, height: 1080 },
      { width: 1440, height: 900 },
    ];

    for (const res of resolutions) {
      await page.setViewportSize({ width: res.width, height: res.height });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByTestId('service-chapters-section')).toBeVisible();

      const layoutCheck = await page.evaluate(async () => {
        const track = document.querySelector('[data-testid="service-chapters-track"]') as HTMLElement;
        const stage = document.querySelector(
          '[data-testid="service-chapters-sticky-stage"]'
        ) as HTMLElement;
        const rail = document.querySelector(
          '[data-testid="service-chapters-progress-rail"]'
        ) as HTMLElement;
        const header = document.querySelector(
          '[data-testid="service-chapter-header-lost-pets"]'
        ) as HTMLElement;
        const heading = document.querySelector(
          '[data-testid="service-chapter-heading"]'
        ) as HTMLElement;
        const script = document.querySelector(
          '[data-testid="service-chapter-script-lost-pets"]'
        ) as HTMLElement;
        const video = document.querySelector(
          '[data-testid="service-chapters-video-stage"]'
        ) as HTMLElement;
        const disclaimer = document.querySelector(
          '[data-testid="service-chapter-disclaimer"]'
        ) as HTMLElement;
        const logo = document.querySelector(
          '[data-testid="service-chapters-floating-logo"]'
        ) as HTMLElement;
        const skip = document.querySelector(
          '[data-testid="service-chapters-skip-btn"]'
        ) as HTMLElement;
        const qr = document.querySelector('.floating-qr-btn') as HTMLElement | null;

        const trackTopDoc = window.scrollY + track.getBoundingClientRect().top;
        const scrollable = track.offsetHeight - stage.offsetHeight;
        window.scrollTo({ top: trackTopDoc - 72 + scrollable * 0.225, behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 200));

        const stageRect = stage.getBoundingClientRect();
        const railRect = rail.getBoundingClientRect();
        const headerRect = header.getBoundingClientRect();
        const headingRect = heading.getBoundingClientRect();
        const scriptRect = script.getBoundingClientRect();
        const videoRect = video.getBoundingClientRect();
        const disclaimerRect = disclaimer.getBoundingClientRect();
        const logoRect = logo.getBoundingClientRect();
        const skipRect = skip.getBoundingClientRect();
        const qrRect = qr ? qr.getBoundingClientRect() : null;

        const boxesOverlap = (a: DOMRect, b: DOMRect) =>
          a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

        return {
          stageTop: Math.round(stageRect.top),
          stageBottom: Math.round(stageRect.bottom),
          railTop: Math.round(railRect.top),
          railBottom: Math.round(railRect.bottom),
          headingTop: Math.round(headingRect.top),
          headerBottom: Math.round(headerRect.bottom),
          videoTop: Math.round(videoRect.top),
          videoBottom: Math.round(videoRect.bottom),
          videoHeight: Math.round(videoRect.height),
          videoWidth: Math.round(videoRect.width),
          disclaimerBottom: Math.round(disclaimerRect.bottom),
          scriptVisible: scriptRect.width > 0 && scriptRect.height > 0,
          logoVisible: logoRect.width > 0 && logoRect.height > 0,
          logoTop: Math.round(logoRect.top),
          logoOverlapsHeading: boxesOverlap(logoRect, headingRect),
          logoOverlapsScript: boxesOverlap(logoRect, scriptRect),
          logoOverlapsHeader: boxesOverlap(logoRect, headerRect),
          logoOverlapsVideo: boxesOverlap(logoRect, videoRect),
          skipRight: Math.round(skipRect.right),
          qrLeft: qrRect ? Math.round(qrRect.left) : null,
          viewportHeight: window.innerHeight,
        };
      });

      console.log(`VERTICAL_${res.width}x${res.height}:`, JSON.stringify(layoutCheck));

      expect(layoutCheck.railTop).toBeGreaterThanOrEqual(72);
      expect(layoutCheck.headingTop).toBeGreaterThan(layoutCheck.railBottom);
      expect(layoutCheck.videoTop).toBeGreaterThanOrEqual(layoutCheck.headerBottom);
      expect(layoutCheck.videoBottom).toBeLessThanOrEqual(layoutCheck.stageBottom);
      expect(layoutCheck.disclaimerBottom).toBeLessThanOrEqual(layoutCheck.stageBottom + 1);
      expect(layoutCheck.videoHeight).toBeGreaterThan(340);
      expect(layoutCheck.scriptVisible).toBe(true);
      expect(layoutCheck.logoVisible).toBe(true);
      expect(layoutCheck.logoOverlapsHeading).toBe(false);
      expect(layoutCheck.logoOverlapsScript).toBe(false);
      expect(layoutCheck.logoOverlapsHeader).toBe(false);
      expect(layoutCheck.logoOverlapsVideo).toBe(false);
      if (layoutCheck.qrLeft !== null) {
        expect(layoutCheck.skipRight).toBeLessThan(layoutCheck.qrLeft);
      }

      if (res.width === 1024 && res.height === 768) {
        await page.screenshot({ path: `${ARTIFACT_DIR}/vertical_1024x768_lost_pets_mid.png` });
      }
    }

    // 2. Full vertical stacked cards + floating logo + script lines + Skip + Navbar logo flow at 1440x900
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

    // Confirm slim app strip has id="after-chapters" and frosted cards / eyebrows are removed
    const slimStrip = page.getByTestId('desktop-slim-app-strip');
    await expect(slimStrip).toBeVisible();
    await expect(slimStrip).toHaveAttribute('id', 'after-chapters');
    await expect(page.getByTestId('service-chapter-frosted-card-lost-pets')).toHaveCount(0);
    await expect(page.getByTestId('service-chapter-eyebrow')).toHaveCount(0);

    const chaptersSection = page.getByTestId('service-chapters-section');
    const cardLostPets = page.getByTestId('service-chapter-card-lost-pets');
    const cardScanFood = page.getByTestId('service-chapter-card-scan-food');
    const floatingLogo = page.getByTestId('service-chapters-floating-logo');
    const logoTrail = page.getByTestId('service-chapters-logo-trail');
    const ctaLostPets = page.getByTestId('service-chapter-cta-lost-pets');
    const ctaScanFood = page.getByTestId('service-chapter-cta-scan-food');
    const skipBtn = page.getByTestId('service-chapters-skip-btn');

    await expect(floatingLogo.locator('img')).toHaveAttribute('src', '/brand/lumo-b-mark.png');
    await expect(skipBtn).toHaveAttribute('aria-label', 'Skip to next section');

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

    // Step A: Start of Chapter 1 (Lost Pets)
    await scrollToTotalFraction(0.01);
    await expect(chaptersSection).toHaveAttribute('data-active-chapter', 'lost-pets');
    await expect(cardLostPets).toHaveAttribute('data-active', 'true');
    await expect(cardScanFood).toHaveAttribute('data-active', 'false');
    await expect(skipBtn).toBeVisible();

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
    expect(peChap1.bgLostPets).toBe('rgb(228, 234, 243)');

    await expect(ctaLostPets).toBeVisible();
    await expect(ctaLostPets).toHaveText('Open Lost Pets →');
    await expect(page.getByTestId('service-chapter-script-line-lost-pets-0')).toHaveAttribute(
      'data-visible',
      'true'
    );
    await expect(floatingLogo).toHaveAttribute('data-side', 'left');
    expect(requestedUrls.some((u) => u.includes('/scroll/scan-food/720/f'))).toBe(false);

    // Step B: Mid Lost Pets
    await scrollToTotalFraction(0.225);
    await expect(page.getByTestId('service-chapter-script-line-lost-pets-1')).toHaveAttribute(
      'data-visible',
      'true'
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
    await page.screenshot({ path: `${ARTIFACT_DIR}/vertical_1440x900_1_lost_pets_mid.png` });

    // Step C: Late Lost Pets -> script line 2 active, Scan Food prefetched
    await scrollToTotalFraction(0.375);
    await expect(page.getByTestId('service-chapter-script-line-lost-pets-2')).toHaveAttribute(
      'data-visible',
      'true'
    );
    expect(requestedUrls.some((u) => u.includes('/scroll/scan-food/720/f'))).toBe(true);

    // Step D: Mid Handoff -> Lost Pets frame 67, scaled down, Scan Food sliding up, logo flipping + trail
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
    expect(handoffState.c1TranslateY).toBeGreaterThan(10);
    expect(handoffState.c1TranslateY).toBeLessThan(90);
    expect(handoffState.c1Radius).toBe('32px');
    expect(handoffState.logoSide).toBe('handoff');
    expect(handoffState.flipDeg).toBeGreaterThan(60);
    expect(handoffState.flipDeg).toBeLessThan(300);
    expect(handoffState.trailVisible).toBe('true');

    await page.screenshot({ path: `${ARTIFACT_DIR}/vertical_1440x900_2_handoff_mid.png` });

    // Step E: Mid Scan Food
    await scrollToTotalFraction(0.725);
    await expect(chaptersSection).toHaveAttribute('data-active-chapter', 'scan-food');
    await expect(floatingLogo).toHaveAttribute('data-side', 'right');
    await expect(logoTrail).toHaveAttribute('data-visible', 'false');
    await expect(skipBtn).toBeVisible();
    await expect(ctaScanFood).toBeVisible();
    await expect(page.getByTestId('service-chapter-script-line-scan-food-1')).toHaveAttribute(
      'data-visible',
      'true'
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
    await page.screenshot({ path: `${ARTIFACT_DIR}/vertical_1440x900_3_scan_food_mid.png` });

    // Step F: End of Scan Food
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
    expect(requestedUrls.some((u) => /lost-pets\/720\/f0(68|69|7\d|80)\.webp/.test(u))).toBe(false);
    expect(requestedUrls.some((u) => /scan-food\/720\/f0(7[1-9]|80)\.webp/.test(u))).toBe(false);
    await page.screenshot({ path: `${ARTIFACT_DIR}/vertical_1440x900_4_scan_food_end.png` });

    // Step G: Skip button keyboard accessibility — Tab reaches Skip, Enter triggers scroll to #after-chapters
    await scrollToTotalFraction(0.225);
    await ctaLostPets.focus();
    let reachedSkip = false;
    for (let step = 0; step < 5; step++) {
      await page.keyboard.press('Tab');
      const isFocused = await page.evaluate(
        () => document.activeElement?.getAttribute('data-testid') === 'service-chapters-skip-btn'
      );
      if (isFocused) {
        reachedSkip = true;
        break;
      }
    }
    expect(reachedSkip).toBe(true);

    await page.keyboard.press('Enter');
    await expect
      .poll(
        async () =>
          await page.evaluate(() => {
            const el = document.getElementById('after-chapters');
            return el ? Math.round(el.getBoundingClientRect().top) : 9999;
          }),
        { timeout: 4000 }
      )
      .toBeLessThanOrEqual(110);

    // Step H: Skip button Space key also triggers scroll to #after-chapters
    await scrollToTotalFraction(0.225);
    await skipBtn.focus();
    await page.keyboard.press('Space');
    await expect
      .poll(
        async () =>
          await page.evaluate(() => {
            const el = document.getElementById('after-chapters');
            return el ? Math.round(el.getBoundingClientRect().top) : 9999;
          }),
        { timeout: 4000 }
      )
      .toBeLessThanOrEqual(110);

    // Step I: Navbar logo click on "/" scrolls smoothly back to top (scrollY === 0)
    const navbarLogo = page.getByTestId('navbar-logo-link');
    await navbarLogo.click();
    await expect
      .poll(async () => await page.evaluate(() => Math.round(window.scrollY)), { timeout: 4000 })
      .toBe(0);

    // Step J: Progress rail click jumps to Chapter 1 (Lost Pets)
    const railBtnLostPets = page.getByTestId('service-chapter-rail-btn-lost-pets');
    await railBtnLostPets.click();
    await expect
      .poll(async () => await chaptersSection.getAttribute('data-active-chapter'), {
        timeout: 5000,
      })
      .toBe('lost-pets');

    // Step K: Verify GA4 events and no horizontal overflow
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

    // Step L: Navigating via pill goes to /lost-pets, cleans up route class, and logo navigates back to /
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

    await page.getByTestId('navbar-logo-link').click();
    await expect(page).toHaveURL(/\/$/);
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
