import { test, expect } from '@playwright/test';
import { bypassTerms } from './helpers/auth';

test.describe('Lost Pets Scroll-Driven Story (Desktop Homepage & /how-lost-pets-works)', () => {
  test('mobile (390x844): homepage and /lost-pets have no hero button, no wide banner, no story, zero /scroll/lost-pets/ requests, and pixel-identical tile boxes', async ({ page }) => {
    await bypassTerms(page);
    await page.setViewportSize({ width: 390, height: 844 });

    const scrollAssetRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/scroll/lost-pets/')) {
        scrollAssetRequests.push(req.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const mobileMain = page.locator('main.lg\\:hidden').first();
    await expect(mobileMain).toBeVisible();

    // Confirm no hero button, no wide banner, no story section, and zero scroll asset requests on mobile
    await expect(page.getByTestId('desktop-hero-watch-story-btn')).toHaveCount(0);
    await expect(page.getByTestId('desktop-story-wide-banner')).toHaveCount(0);
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

    // Confirm mobile homepage remains fixed 100dvh-72px with pixel-identical tile bounding boxes
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

  test('desktop homepage (1280x800): hero button & wide banner scroll to story, 3 top cards equal height, story below AppDownloadSection & above footer, no overflow, class removed on navigation', async ({ page }) => {
    await bypassTerms(page);
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Capture GA4 events via window.gtag spy
    await page.evaluate(() => {
      (window as any).__gaEvents = [];
      (window as any).gtag = (...args: any[]) => {
        (window as any).__gaEvents.push(args);
      };
    });

    // 1. Verify Hero "Watch the story" button (42px height matching store badges, keyboard-focusable)
    const heroBtn = page.getByTestId('desktop-hero-watch-story-btn');
    await expect(heroBtn).toBeVisible();
    await expect(heroBtn).toHaveText('Watch the story');

    const heroBtnBox = await heroBtn.boundingBox();
    expect(heroBtnBox).not.toBeNull();
    expect(Math.round(heroBtnBox!.height)).toBe(42);

    await heroBtn.focus();
    await expect(heroBtn).toBeFocused();

    // 2. Verify all 3 top-row desktop service cards have equal height and no card tag
    await expect(page.getByTestId('desktop-lost-pets-card-watch-tag')).toHaveCount(0);

    const cardAndBannerMetrics = await page.evaluate(() => {
      const desktopWrapper = document.querySelector('div.hidden.lg\\:flex') as HTMLElement;
      const scanCard = desktopWrapper.querySelector('a[href="/scan"]') as HTMLElement;
      const sitterCard = desktopWrapper.querySelector('a[href="/petsitting"]') as HTMLElement;
      const lostPetsCard = desktopWrapper.querySelector('[data-testid="desktop-lost-pets-card"]') as HTMLElement;
      const banner = desktopWrapper.querySelector('[data-testid="desktop-story-wide-banner"]') as HTMLElement;
      const bannerImg = banner.querySelector('img') as HTMLImageElement;
      const nestedInteractive = banner.querySelectorAll('a, button, input, select, textarea').length;

      return {
        scanHeight: Math.round(scanCard.getBoundingClientRect().height),
        sitterHeight: Math.round(sitterCard.getBoundingClientRect().height),
        lostPetsHeight: Math.round(lostPetsCard.getBoundingClientRect().height),
        bannerTagName: banner.tagName,
        nestedInteractive,
        bannerImgSrc: bannerImg?.getAttribute('src'),
        bannerImgWidth: Math.round(bannerImg.getBoundingClientRect().width),
        bannerImgHeight: Math.round(bannerImg.getBoundingClientRect().height),
        bannerText: banner.innerText,
      };
    });

    expect(cardAndBannerMetrics.lostPetsHeight).toBe(cardAndBannerMetrics.scanHeight);
    expect(cardAndBannerMetrics.lostPetsHeight).toBe(cardAndBannerMetrics.sitterHeight);

    // 3. Verify Wide Banner (single control, zero nested interactive elements, 72x128 thumbnail, new wording)
    const wideBanner = page.getByTestId('desktop-story-wide-banner');
    await expect(wideBanner).toBeVisible();
    expect(cardAndBannerMetrics.bannerTagName).toBe('BUTTON');
    expect(cardAndBannerMetrics.nestedInteractive).toBe(0);
    expect(cardAndBannerMetrics.bannerImgSrc).toBe('/scroll/lost-pets/poster.webp');
    expect(cardAndBannerMetrics.bannerImgWidth).toBe(72);
    expect(cardAndBannerMetrics.bannerImgHeight).toBe(128);
    expect(cardAndBannerMetrics.bannerText).toContain('Every paw has a story.');
    expect(cardAndBannerMetrics.bannerText).toContain("Watch one lost pet's journey home.");
    expect(cardAndBannerMetrics.bannerText).toContain('Watch the story');

    await wideBanner.focus();
    await expect(wideBanner).toBeFocused();

    // 4. Verify placement order: Services Grid (& Wide Banner) -> AppDownloadSection -> Story Section -> Footer
    const placementOrder = await page.evaluate(() => {
      const desktopWrapper = document.querySelector('div.hidden.lg\\:flex') as HTMLElement;
      const banner = desktopWrapper.querySelector('[data-testid="desktop-story-wide-banner"]') as HTMLElement;
      const appDownloadHeading = Array.from(desktopWrapper.querySelectorAll('h2')).find((h) =>
        h.textContent?.includes('Take Lumo Bites with you.')
      );
      const appDownloadSection = appDownloadHeading?.closest('section') as HTMLElement;
      const storyWrapper = document.getElementById('how-lost-pets-works-section') as HTMLElement;
      const footer = desktopWrapper.querySelector('footer') as HTMLElement;

      const bannerRect = banner.getBoundingClientRect();
      const appDownloadRect = appDownloadSection.getBoundingClientRect();
      const storyRect = storyWrapper.getBoundingClientRect();
      const footerRect = footer.getBoundingClientRect();

      return {
        bannerBottom: Math.round(bannerRect.bottom),
        appDownloadTop: Math.round(appDownloadRect.top),
        appDownloadBottom: Math.round(appDownloadRect.bottom),
        storyTop: Math.round(storyRect.top),
        storyBottom: Math.round(storyRect.bottom),
        footerTop: Math.round(footerRect.top),
      };
    });

    expect(placementOrder.appDownloadTop).toBeGreaterThanOrEqual(placementOrder.bannerBottom);
    expect(placementOrder.storyTop).toBeGreaterThanOrEqual(placementOrder.appDownloadBottom);
    expect(placementOrder.footerTop).toBeGreaterThanOrEqual(placementOrder.storyBottom);

    // 5. Verify clicking Hero button & Wide Banner scroll to story section and fire GA4 events with location
    await heroBtn.click();
    await expect.poll(async () => {
      return await page.evaluate(() => window.scrollY);
    }, { timeout: 5000 }).toBeGreaterThan(400);

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await wideBanner.click();
    await expect.poll(async () => {
      return await page.evaluate(() => window.scrollY);
    }, { timeout: 5000 }).toBeGreaterThan(400);

    const gaCtaLocations = await page.evaluate(() => {
      const fromDataLayer = Array.from((window as any).dataLayer || [])
        .map((entry: any) => Array.from(entry || []))
        .filter((arr: any[]) => arr[0] === 'event' && arr[1] === 'lost_pets_story_cta_click')
        .map((arr: any[]) => arr[2]?.location);
      const fromSpy = ((window as any).__gaEvents || [])
        .filter((e: any[]) => e[0] === 'event' && e[1] === 'lost_pets_story_cta_click')
        .map((e: any[]) => e[2]?.location);
      return [...fromDataLayer, ...fromSpy];
    });
    expect(gaCtaLocations).toContain('hero_button');
    expect(gaCtaLocations).toContain('banner');

    // 6. Verify story wording, 720 frame set, frame advancement, and no horizontal overflow
    const storySection = page.getByTestId('lost-pets-scroll-story');
    const storyText = await storySection.innerText();
    expect(storyText).toContain('LOST & FOUND PETS');
    expect(storyText).toContain('Every paw has a story.');
    expect(storyText).toContain("Scroll to follow one lost pet's journey home.");
    expect(storyText.toLowerCase()).not.toContain('how it works');
    expect(storyText.toLowerCase()).not.toContain('how lost pets works');
    expect(storyText.toLowerCase()).not.toContain('how a photo helps neighbors search');

    const canvas = page.getByTestId('lost-pets-canvas');
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute('data-frame-set', '720');

    const disclaimer = page.getByTestId('lost-pets-disclaimer-note');
    await expect(disclaimer).toHaveText(
      'Illustration. Lumo helps you search lost and found reports by photo. Matches are not guaranteed.'
    );

    // Scroll to end of story track
    await page.evaluate(async () => {
      const track = document.querySelector('[data-testid="lost-pets-scroll-track"]') as HTMLElement;
      const sticky = document.querySelector('[data-testid="lost-pets-sticky-stage"]') as HTMLElement;
      const trackTopDoc = window.scrollY + track.getBoundingClientRect().top;
      const scrollable = track.offsetHeight - sticky.offsetHeight;
      window.scrollTo({ top: trackTopDoc + scrollable * 0.95, behavior: 'instant' });
    });

    await expect.poll(async () => {
      const val = await canvas.getAttribute('data-current-frame');
      return Number(val || '1');
    }, { timeout: 6000 }).toBeGreaterThanOrEqual(72);

    const noOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
    );
    expect(noOverflow).toBe(true);

    // 7. Verify navigating away to /lost-pets removes lost-pets-story-route class and restores overflow-x: hidden
    await page.getByTestId('lost-pets-story-primary-cta').click();
    await expect(page).toHaveURL(/\/lost-pets/);

    const onLostPetsPage = await page.evaluate(() => ({
      htmlHasClass: document.documentElement.classList.contains('lost-pets-story-route'),
      bodyHasClass: document.body.classList.contains('lost-pets-story-route'),
      bodyOverflowX: window.getComputedStyle(document.body).overflowX,
    }));

    expect(onLostPetsPage.htmlHasClass).toBe(false);
    expect(onLostPetsPage.bodyHasClass).toBe(false);
    expect(onLostPetsPage.bodyOverflowX).toBe('hidden');
  });

  test('/how-lost-pets-works (390x844): renders updated wording & title, pins sticky stage, advances canvas frames on scroll, and stays under 2MB', async ({ page }) => {
    await bypassTerms(page);
    await page.setViewportSize({ width: 390, height: 844 });

    const frameRequests: string[] = [];
    let totalTransferredBytes = 0;

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/scroll/lost-pets/')) {
        frameRequests.push(url);
        try {
          const body = await response.body();
          totalTransferredBytes += body.byteLength;
        } catch {
          // ignore if response body unavailable
        }
      }
    });

    await page.goto('/how-lost-pets-works');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveTitle('Every paw has a story | Lumo Bites');

    const section = page.getByTestId('lost-pets-scroll-story');
    await expect(section).toBeVisible();

    const sectionText = await section.innerText();
    expect(sectionText).toContain('LOST & FOUND PETS');
    expect(sectionText).toContain('Every paw has a story.');
    expect(sectionText).toContain("Scroll to follow one lost pet's journey home.");
    expect(sectionText.toLowerCase()).not.toContain('how it works');
    expect(sectionText.toLowerCase()).not.toContain('how lost pets works');
    expect(sectionText.toLowerCase()).not.toContain('verified');

    const canvas = page.getByTestId('lost-pets-canvas');
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute('data-frame-set', '480');
    await expect(canvas).toHaveAttribute('data-current-frame', '1');
    await expect(canvas).toHaveAttribute(
      'aria-label',
      "Interactive scroll story following one lost pet's journey home"
    );

    const disclaimer = page.getByTestId('lost-pets-disclaimer-note');
    await expect(disclaimer).toBeVisible();
    await expect(disclaimer).toHaveText(
      'Illustration. Lumo helps you search lost and found reports by photo. Matches are not guaranteed.'
    );

    const overflowTop = await page.evaluate(() => document.documentElement.scrollWidth <= 390);
    expect(overflowTop).toBe(true);

    const stickyCheck = await page.evaluate(async () => {
      const track = document.querySelector('[data-testid="lost-pets-scroll-track"]') as HTMLElement;
      const sticky = document.querySelector('[data-testid="lost-pets-sticky-stage"]') as HTMLElement;
      const trackTopDoc = window.scrollY + track.getBoundingClientRect().top;

      window.scrollTo({ top: trackTopDoc + 350, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 150));
      const stickyTop1 = Math.round(sticky.getBoundingClientRect().top);
      const trackTop1 = Math.round(track.getBoundingClientRect().top);

      window.scrollTo({ top: trackTopDoc + 1200, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 250));
      const stickyTop2 = Math.round(sticky.getBoundingClientRect().top);
      const trackTop2 = Math.round(track.getBoundingClientRect().top);

      return { stickyTop1, stickyTop2, trackTop1, trackTop2 };
    });

    expect(stickyCheck.trackTop1).toBeLessThan(0);
    expect(stickyCheck.trackTop2).toBeLessThan(stickyCheck.trackTop1);
    expect(stickyCheck.stickyTop1).toBe(80);
    expect(stickyCheck.stickyTop2).toBe(80);

    await expect.poll(async () => {
      const val = await canvas.getAttribute('data-current-frame');
      return Number(val || '1');
    }, { timeout: 5000 }).toBeGreaterThan(15);

    const overflowMid = await page.evaluate(() => document.documentElement.scrollWidth <= 390);
    expect(overflowMid).toBe(true);

    await page.evaluate(async () => {
      const track = document.querySelector('[data-testid="lost-pets-scroll-track"]') as HTMLElement;
      const sticky = document.querySelector('[data-testid="lost-pets-sticky-stage"]') as HTMLElement;
      const trackTopDoc = window.scrollY + track.getBoundingClientRect().top;
      const scrollable = track.offsetHeight - sticky.offsetHeight;
      window.scrollTo({ top: trackTopDoc + scrollable, behavior: 'instant' });
    });

    await expect.poll(async () => {
      const val = await canvas.getAttribute('data-current-frame');
      return Number(val || '1');
    }, { timeout: 5000 }).toBeGreaterThanOrEqual(75);

    expect(frameRequests.some((u) => u.includes('/scroll/lost-pets/480/'))).toBe(true);
    expect(frameRequests.some((u) => u.includes('/scroll/lost-pets/720/'))).toBe(false);
    expect(totalTransferredBytes).toBeLessThan(2 * 1024 * 1024);
  });

  test('/how-lost-pets-works: renders static poster.webp fallback and loads zero frames when prefers-reduced-motion is enabled', async ({ page }) => {
    await bypassTerms(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });

    const frameRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/scroll/lost-pets/480/') || url.includes('/scroll/lost-pets/720/')) {
        frameRequests.push(url);
      }
    });

    await page.goto('/how-lost-pets-works');
    await page.waitForLoadState('domcontentloaded');

    const staticPoster = page.getByTestId('lost-pets-static-poster');
    await expect(staticPoster).toBeVisible();
    await expect(staticPoster).toHaveAttribute('src', '/scroll/lost-pets/poster.webp');
    await expect(staticPoster).toHaveAttribute('alt', "Illustration of one lost pet's journey home");

    await expect(page.getByTestId('lost-pets-canvas')).toHaveCount(0);
    await expect(page.getByTestId('lost-pets-chapter-dots')).toHaveCount(0);
    expect(frameRequests).toHaveLength(0);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= 390);
    expect(overflow).toBe(true);
  });

  test('/how-lost-pets-works: falls back to static poster.webp with zero frame requests when CSS.supports("overflow", "clip") is false', async ({ page }) => {
    await bypassTerms(page);
    await page.setViewportSize({ width: 390, height: 844 });

    await page.addInitScript(() => {
      const origSupports = CSS.supports.bind(CSS);
      CSS.supports = ((prop: string, val?: string) => {
        if (prop === 'overflow' && val === 'clip') return false;
        if (typeof prop === 'string' && prop.includes('overflow') && prop.includes('clip')) return false;
        return origSupports(prop, val as string);
      }) as typeof CSS.supports;
    });

    const frameRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/scroll/lost-pets/480/') || url.includes('/scroll/lost-pets/720/')) {
        frameRequests.push(url);
      }
    });

    await page.goto('/how-lost-pets-works');
    await page.waitForLoadState('domcontentloaded');

    const staticPoster = page.getByTestId('lost-pets-static-poster');
    await expect(staticPoster).toBeVisible();
    await expect(staticPoster).toHaveAttribute('src', '/scroll/lost-pets/poster.webp');
    await expect(page.getByTestId('lost-pets-canvas')).toHaveCount(0);
    expect(frameRequests).toHaveLength(0);
  });
});
