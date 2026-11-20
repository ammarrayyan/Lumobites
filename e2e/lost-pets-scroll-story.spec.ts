import { test, expect } from '@playwright/test';
import { bypassTerms } from './helpers/auth';

test.describe('Lost Pets Scroll-Driven Story (/how-lost-pets-works)', () => {
  test('homepage mobile fixed 100dvh layout & tile measurements are unchanged, and "See how Lost Pets works" link is >=44px tall', async ({ page }) => {
    await bypassTerms(page);
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const mobileMain = page.locator('main.lg\\:hidden').first();
    await expect(mobileMain).toBeVisible();

    const homeHowLink = page.getByTestId('mobile-home-how-lost-pets-link');
    await expect(homeHowLink).toBeVisible();
    await expect(homeHowLink).toHaveText('See how Lost Pets works');
    await expect(homeHowLink).toHaveAttribute('href', '/how-lost-pets-works');

    // Verify link tap target height is at least 44px
    const linkBox = await homeHowLink.boundingBox();
    expect(linkBox).not.toBeNull();
    expect(linkBox!.height).toBeGreaterThanOrEqual(44);

    // Measure mobile main container and all 5 tile bounding boxes WITH the link present,
    // then compare against removing the link wrapper from flow to prove zero movement/resizing of tiles
    const comparison = await page.evaluate(() => {
      const mainEl = document.querySelector('main.lg\\:hidden') as HTMLElement;
      const style = window.getComputedStyle(mainEl);
      const rect = mainEl.getBoundingClientRect();
      const tileLinks = Array.from(mainEl.querySelectorAll('a[href="/scan"], a[href="/petsitting"], a[href="/lost-pets"], a[href="/adoption"], a[href="/city-board"]'));

      const measureTiles = () =>
        tileLinks.map((a) => {
          const r = a.getBoundingClientRect();
          return {
            href: a.getAttribute('href'),
            top: Math.round(r.top * 100) / 100,
            left: Math.round(r.left * 100) / 100,
            width: Math.round(r.width * 100) / 100,
            height: Math.round(r.height * 100) / 100,
          };
        });

      const tilesWithLink = measureTiles();
      const widthWithLink = Math.round(mainEl.getBoundingClientRect().width);
      const heightWithLink = Math.round(mainEl.getBoundingClientRect().height);
      const linkWrapper = document.querySelector('[data-testid="mobile-home-how-lost-pets-link"]')?.parentElement as HTMLElement | null;
      if (linkWrapper) linkWrapper.style.display = 'none';
      const tilesWithoutLink = measureTiles();
      const widthWithoutLink = Math.round(mainEl.getBoundingClientRect().width);
      const heightWithoutLink = Math.round(mainEl.getBoundingClientRect().height);
      if (linkWrapper) linkWrapper.style.display = '';

      return {
        position: style.position,
        top: Math.round(rect.top),
        height: heightWithLink,
        heightWithoutLink,
        width: widthWithLink,
        widthWithoutLink,
        bodyClientWidth: document.body.clientWidth,
        clientHeight: mainEl.clientHeight,
        scrollHeight: mainEl.scrollHeight,
        tilesWithLink,
        tilesWithoutLink,
      };
    });

    // Confirm mobile homepage remains fixed 100dvh-72px and all 5 tiles have identical coordinates/sizes
    expect(comparison.position).toBe('fixed');
    expect(comparison.top).toBe(72);
    expect(comparison.height).toBe(844 - 72);
    expect(comparison.height).toBe(comparison.heightWithoutLink);
    expect(comparison.width).toBe(comparison.bodyClientWidth);
    expect(comparison.width).toBe(comparison.widthWithoutLink);
    expect(comparison.scrollHeight).toBeLessThanOrEqual(comparison.clientHeight);
    expect(comparison.tilesWithLink).toEqual(comparison.tilesWithoutLink);

    // Also verify link at top of /lost-pets
    await page.goto('/lost-pets');
    await page.waitForLoadState('domcontentloaded');
    const lostPetsHowLink = page.getByTestId('lost-pets-how-it-works-link');
    await expect(lostPetsHowLink).toBeVisible();
    await expect(lostPetsHowLink).toHaveText('See how Lost Pets works');
    await expect(lostPetsHowLink).toHaveAttribute('href', '/how-lost-pets-works');
  });

  test('renders section, pins sticky stage via route-scoped overflow:clip, advances canvas frames on scroll, and stays under 2MB on 390px phone', async ({ page }) => {
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

    const section = page.getByTestId('lost-pets-scroll-story');
    await expect(section).toBeVisible();

    const canvas = page.getByTestId('lost-pets-canvas');
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute('data-frame-set', '480');
    await expect(canvas).toHaveAttribute('data-current-frame', '1');

    // Verify honest disclaimer note and absence of prohibited wording
    const disclaimer = page.getByTestId('lost-pets-disclaimer-note');
    await expect(disclaimer).toBeVisible();
    await expect(disclaimer).toHaveText(
      'Illustration. Lumo helps you search lost and found reports by photo. Matches are not guaranteed.'
    );
    const sectionText = (await section.innerText()).toLowerCase();
    expect(sectionText).not.toContain('verified');

    // Verify no horizontal overflow at 390px before scrolling
    const overflowTop = await page.evaluate(() => document.documentElement.scrollWidth <= 390);
    expect(overflowTop).toBe(true);

    // Scroll into the sticky track and verify position: sticky pins the stage at top=80px
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

    // Verify canvas frame advanced from 1 during mid-scroll
    await expect.poll(async () => {
      const val = await canvas.getAttribute('data-current-frame');
      return Number(val || '1');
    }, { timeout: 5000 }).toBeGreaterThan(15);

    // Verify no horizontal overflow at 390px mid-scroll
    const overflowMid = await page.evaluate(() => document.documentElement.scrollWidth <= 390);
    expect(overflowMid).toBe(true);

    // Scroll to the end of the track (>= 90% progress)
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

    // Verify only 480 frames (never 720) were requested on a 390px phone and total bytes < 2MB
    expect(frameRequests.some((u) => u.includes('/scroll/lost-pets/480/'))).toBe(true);
    expect(frameRequests.some((u) => u.includes('/scroll/lost-pets/720/'))).toBe(false);
    expect(totalTransferredBytes).toBeLessThan(2 * 1024 * 1024);
  });

  test('renders static poster.webp fallback and loads zero frames when prefers-reduced-motion is enabled', async ({ page }) => {
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

    await expect(page.getByTestId('lost-pets-canvas')).toHaveCount(0);
    await expect(page.getByTestId('lost-pets-chapter-dots')).toHaveCount(0);
    expect(frameRequests).toHaveLength(0);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= 390);
    expect(overflow).toBe(true);
  });

  test('falls back to static poster.webp with zero frame requests when CSS.supports("overflow", "clip") is false', async ({ page }) => {
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

  test('removes lost-pets-story-route class and restores overflow-x: hidden when navigating away to /', async ({ page }) => {
    await bypassTerms(page);
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/how-lost-pets-works');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByTestId('lost-pets-scroll-story')).toBeVisible();

    await expect.poll(async () => {
      return await page.evaluate(() => document.documentElement.classList.contains('lost-pets-story-route'));
    }, { timeout: 5000 }).toBe(true);

    const onStoryPage = await page.evaluate(() => ({
      htmlHasClass: document.documentElement.classList.contains('lost-pets-story-route'),
      bodyHasClass: document.body.classList.contains('lost-pets-story-route'),
      bodyOverflowX: window.getComputedStyle(document.body).overflowX,
      bodyOverflowY: window.getComputedStyle(document.body).overflowY,
    }));

    expect(onStoryPage.htmlHasClass).toBe(true);
    expect(onStoryPage.bodyHasClass).toBe(true);
    expect(onStoryPage.bodyOverflowX).toBe('clip');
    expect(onStoryPage.bodyOverflowY).toBe('visible');

    // Navigate away via client-side Navbar logo link to /
    const logoLink = page.locator('nav a[href="/"]').first();
    if (await logoLink.isVisible()) {
      await logoLink.click();
    } else {
      await page.goto('/');
    }
    await expect(page).toHaveURL(/\/$/);

    const onHomePage = await page.evaluate(() => ({
      htmlHasClass: document.documentElement.classList.contains('lost-pets-story-route'),
      bodyHasClass: document.body.classList.contains('lost-pets-story-route'),
      htmlOverflowX: window.getComputedStyle(document.documentElement).overflowX,
      bodyOverflowX: window.getComputedStyle(document.body).overflowX,
    }));

    expect(onHomePage.htmlHasClass).toBe(false);
    expect(onHomePage.bodyHasClass).toBe(false);
    expect(onHomePage.htmlOverflowX).toBe('hidden');
    expect(onHomePage.bodyOverflowX).toBe('hidden');
  });
});
