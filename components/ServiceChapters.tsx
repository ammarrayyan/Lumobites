'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Capacitor } from '@capacitor/core';

export interface ChapterColorTokens {
  bg: string;
  text: string;
  muted: string;
  accent: string;
  railBg: string;
  railFill: string;
  cardBorder: string;
  pillBg: string;
}

export interface ServiceChapterConfig {
  id: string;
  name: string;
  framesFolder: string;
  totalFrames: number;
  heading: string;
  text: string;
  linkText: string;
  linkHref: string;
  disclaimer: string;
  colors: {
    light: ChapterColorTokens;
    dark: ChapterColorTokens;
  };
}

export const SERVICE_CHAPTERS: ServiceChapterConfig[] = [
  {
    id: 'lost-pets',
    name: 'Lost Pets',
    framesFolder: '/scroll/lost-pets',
    totalFrames: 80,
    heading: 'Lost a pet? Tell the whole block.',
    text: 'Report a lost or found pet and share it with people nearby.',
    linkText: 'Open Lost Pets →',
    linkHref: '/lost-pets',
    disclaimer:
      'Illustration. Lumo helps you search lost and found reports by photo. Matches are not guaranteed.',
    colors: {
      light: {
        bg: '#E4EAF3',
        text: '#101826',
        muted: '#334155',
        accent: '#101826',
        railBg: 'rgba(16, 24, 38, 0.14)',
        railFill: '#101826',
        cardBorder: 'rgba(16, 24, 38, 0.16)',
        pillBg: 'rgba(255, 255, 255, 0.65)',
      },
      dark: {
        bg: '#101826',
        text: '#F1F5F9',
        muted: '#94A3B8',
        accent: '#93C5FD',
        railBg: 'rgba(241, 245, 249, 0.16)',
        railFill: '#F1F5F9',
        cardBorder: 'rgba(241, 245, 249, 0.18)',
        pillBg: 'rgba(255, 255, 255, 0.08)',
      },
    },
  },
  {
    id: 'scan-food',
    name: 'Scan Food',
    framesFolder: '/scroll/scan-food',
    totalFrames: 80,
    heading: 'Scan before you serve.',
    text: 'Point your phone at a pet food label and see what is inside.',
    linkText: 'Open Scan Food →',
    linkHref: '/scan',
    disclaimer:
      'Illustration. Lumo helps you review pet food label ingredients. Always check packaging directly.',
    colors: {
      light: {
        bg: '#F6E6CC',
        text: '#24180D',
        muted: '#4A3520',
        accent: '#24180D',
        railBg: 'rgba(36, 24, 13, 0.14)',
        railFill: '#24180D',
        cardBorder: 'rgba(36, 24, 13, 0.16)',
        pillBg: 'rgba(255, 255, 255, 0.65)',
      },
      dark: {
        bg: '#24180D',
        text: '#FAF0E4',
        muted: '#D6C1A7',
        accent: '#FDBA74',
        railBg: 'rgba(250, 240, 228, 0.16)',
        railFill: '#FAF0E4',
        cardBorder: 'rgba(250, 240, 228, 0.18)',
        pillBg: 'rgba(255, 255, 255, 0.08)',
      },
    },
  },
];

const SCROLL_VH_PER_CHAPTER = 360;
const PLAY_PORTION = 0.85; // 85% play frames 1..80, 15% hold on frame 80
const LINK_REVEAL_THRESHOLD = 0.80; // link visible when video is nearly finished (>= 80% of chapter)

type NetworkInformationLike = {
  saveData?: boolean;
  effectiveType?: string;
};

function detectChaptersEnv(): { isStaticFallback: boolean; resolvedFrameSet: '480' | '720' } {
  if (typeof window === 'undefined') {
    return { isStaticFallback: false, resolvedFrameSet: '720' };
  }
  const supportsOverflowClip =
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('overflow', 'clip');

  if (!supportsOverflowClip) {
    return { isStaticFallback: true, resolvedFrameSet: '720' };
  }

  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const nav = navigator as Navigator & {
    connection?: NetworkInformationLike;
    mozConnection?: NetworkInformationLike;
    webkitConnection?: NetworkInformationLike;
  };
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
  const prefersReduced = mq.matches;
  const saveData = Boolean(conn?.saveData);
  const effectiveType = (conn?.effectiveType || '').toLowerCase();
  const isVerySlow = effectiveType === 'slow-2g' || effectiveType === '2g';

  if (prefersReduced || saveData || isVerySlow) {
    return { isStaticFallback: true, resolvedFrameSet: '720' };
  }

  const isSmallOr3G = window.innerWidth < 700 || effectiveType === '3g';
  return {
    isStaticFallback: false,
    resolvedFrameSet: isSmallOr3G ? '480' : '720',
  };
}

function fireChapterGaEvent(eventName: string, params: Record<string, any>) {
  if (typeof window === 'undefined') return;
  const w = window as any;
  if (typeof w.gtag === 'function') {
    w.gtag('event', eventName, params);
  } else if (Array.isArray(w.dataLayer)) {
    w.dataLayer.push({ event: eventName, ...params });
  }
}

function formatChapterFramePath(
  framesFolder: string,
  resolution: '480' | '720',
  frameNumber: number,
  totalFrames: number
): string {
  const clamped = Math.min(totalFrames, Math.max(1, frameNumber));
  const padded = String(clamped).padStart(3, '0');
  return `${framesFolder}/${resolution}/f${padded}.webp`;
}

export default function ServiceChapters() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [staticFallback, setStaticFallback] = useState(false);
  const [frameSet, setFrameSet] = useState<'480' | '720'>('720');
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const [chapterProgress, setChapterProgress] = useState(0);
  const [displayedFrame, setDisplayedFrame] = useState(1);
  const [linkFocused, setLinkFocused] = useState(false);

  // Per-chapter image caches and loading state
  const chapterFramesRef = useRef<(HTMLImageElement | null)[][]>(
    SERVICE_CHAPTERS.map((c) => new Array(c.totalFrames + 1).fill(null))
  );
  const chapterPostersRef = useRef<(HTMLImageElement | null)[]>(
    SERVICE_CHAPTERS.map(() => null)
  );
  const chapterLoadingStartedRef = useRef<boolean[]>(
    SERVICE_CHAPTERS.map(() => false)
  );
  const chapterGenerationRef = useRef<number[]>(
    SERVICE_CHAPTERS.map(() => 0)
  );

  // Animation refs
  const activeChapterIdxRef = useRef(0);
  const targetFrameRef = useRef(1);
  const currentFrameFloatRef = useRef(1);
  const drawnChapterRef = useRef(-1);
  const drawnFrameRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const sectionInViewRef = useRef(false);

  // Analytics tracking refs (once per chapter)
  const viewedChaptersRef = useRef<Set<string>>(new Set());
  const completedChaptersRef = useRef<Set<string>>(new Set());

  // Add route-scoped overflow-x: clip class on desktop mount, remove on unmount
  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    const htmlEl = document.documentElement;
    const bodyEl = document.body;

    const syncRouteClass = () => {
      const shouldApply = !Capacitor.isNativePlatform() && window.innerWidth >= 1024;
      if (shouldApply) {
        htmlEl.classList.add('lost-pets-story-route');
        bodyEl.classList.add('lost-pets-story-route');
      } else {
        htmlEl.classList.remove('lost-pets-story-route');
        bodyEl.classList.remove('lost-pets-story-route');
      }
    };

    syncRouteClass();
    window.addEventListener('resize', syncRouteClass, { passive: true });

    return () => {
      window.removeEventListener('resize', syncRouteClass);
      htmlEl.classList.remove('lost-pets-story-route');
      bodyEl.classList.remove('lost-pets-story-route');
    };
  }, []);

  // Evaluate reduced-motion / Save-Data / slow network / resolution
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

    const evaluateMode = () => {
      const { isStaticFallback, resolvedFrameSet } = detectChaptersEnv();
      setStaticFallback(isStaticFallback);
      setFrameSet(resolvedFrameSet);
    };

    evaluateMode();
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', evaluateMode);
    }
    return () => {
      if (typeof mq.removeEventListener === 'function') {
        mq.removeEventListener('change', evaluateMode);
      }
    };
  }, []);

  // Draw frame `frameNumber` of chapter `chapterIdx` onto the canvas
  const drawChapterFrame = useCallback((chapterIdx: number, frameNumber: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const chapter = SERVICE_CHAPTERS[chapterIdx];
    if (!chapter) return;

    const clamped = Math.min(chapter.totalFrames, Math.max(1, Math.round(frameNumber)));
    const framesArr = chapterFramesRef.current[chapterIdx] || [];
    let imgToDraw = framesArr[clamped];

    // Fall back to nearest already-loaded frame in this chapter
    if (!imgToDraw || !imgToDraw.complete || imgToDraw.naturalWidth === 0) {
      imgToDraw = null;
      for (let offset = 1; offset < chapter.totalFrames; offset++) {
        const lower = clamped - offset;
        const higher = clamped + offset;
        if (lower >= 1) {
          const candidate = framesArr[lower];
          if (candidate && candidate.complete && candidate.naturalWidth > 0) {
            imgToDraw = candidate;
            break;
          }
        }
        if (higher <= chapter.totalFrames) {
          const candidate = framesArr[higher];
          if (candidate && candidate.complete && candidate.naturalWidth > 0) {
            imgToDraw = candidate;
            break;
          }
        }
      }
    }

    // Fall back to chapter's poster-start.webp
    const posterImg = chapterPostersRef.current[chapterIdx];
    if (!imgToDraw && posterImg && posterImg.complete && posterImg.naturalWidth > 0) {
      imgToDraw = posterImg;
    }

    if (!imgToDraw) return;

    if (canvas.width !== imgToDraw.naturalWidth || canvas.height !== imgToDraw.naturalHeight) {
      canvas.width = imgToDraw.naturalWidth;
      canvas.height = imgToDraw.naturalHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgToDraw, 0, 0, canvas.width, canvas.height);

    if (drawnChapterRef.current !== chapterIdx || drawnFrameRef.current !== clamped) {
      drawnChapterRef.current = chapterIdx;
      drawnFrameRef.current = clamped;
      setDisplayedFrame(clamped);
    }
  }, []);

  // Release decoded images for chapters >= 2 steps away from current chapter
  const releaseDistantChapters = useCallback((currentChapterIdx: number) => {
    SERVICE_CHAPTERS.forEach((chapter, idx) => {
      if (Math.abs(idx - currentChapterIdx) >= 2 && chapterLoadingStartedRef.current[idx]) {
        chapterGenerationRef.current[idx] += 1;
        chapterLoadingStartedRef.current[idx] = false;
        const arr = chapterFramesRef.current[idx];
        if (arr) {
          for (let f = 1; f <= chapter.totalFrames; f++) {
            arr[f] = null;
          }
        }
      }
    });
  }, []);

  // Start progressive loading for a specific chapter index
  const startLoadingChapter = useCallback(
    (chapterIdx: number, selectedSet: '480' | '720') => {
      if (
        chapterIdx < 0 ||
        chapterIdx >= SERVICE_CHAPTERS.length ||
        chapterLoadingStartedRef.current[chapterIdx] ||
        staticFallback ||
        detectChaptersEnv().isStaticFallback ||
        typeof window === 'undefined'
      ) {
        return;
      }

      chapterLoadingStartedRef.current[chapterIdx] = true;
      const gen = (chapterGenerationRef.current[chapterIdx] += 1);
      const chapter = SERVICE_CHAPTERS[chapterIdx];

      // Load poster-start.webp immediately for this chapter
      if (!chapterPostersRef.current[chapterIdx]) {
        const posterImg = new Image();
        posterImg.decoding = 'async';
        posterImg.src = `${chapter.framesFolder}/poster-start.webp`;
        posterImg.onload = () => {
          if (chapterGenerationRef.current[chapterIdx] !== gen) return;
          chapterPostersRef.current[chapterIdx] = posterImg;
          if (activeChapterIdxRef.current === chapterIdx && drawnFrameRef.current <= 1) {
            drawChapterFrame(chapterIdx, 1);
          }
        };
      }

      // Priority queue: frame 1, keyframes every 4 frames, frame 80, even frames, remaining frames
      const priorityQueue: number[] = [];
      const added = new Set<number>();
      const enqueue = (n: number) => {
        if (n >= 1 && n <= chapter.totalFrames && !added.has(n)) {
          added.add(n);
          priorityQueue.push(n);
        }
      };

      enqueue(1);
      for (let i = 1; i <= chapter.totalFrames; i += 4) enqueue(i);
      enqueue(chapter.totalFrames);
      for (let i = 1; i <= chapter.totalFrames; i += 2) enqueue(i);
      for (let i = 1; i <= chapter.totalFrames; i++) enqueue(i);

      let cursor = 0;
      const MAX_CONCURRENT = 4;

      const loadNext = () => {
        if (chapterGenerationRef.current[chapterIdx] !== gen) return;
        if (cursor >= priorityQueue.length) return;
        const frameNum = priorityQueue[cursor++];
        const img = new Image();
        img.decoding = 'async';
        img.src = formatChapterFramePath(
          chapter.framesFolder,
          selectedSet,
          frameNum,
          chapter.totalFrames
        );
        img.onload = () => {
          if (chapterGenerationRef.current[chapterIdx] !== gen) return;
          chapterFramesRef.current[chapterIdx][frameNum] = img;
          if (
            activeChapterIdxRef.current === chapterIdx &&
            (Math.abs(targetFrameRef.current - frameNum) <= 2 || drawnChapterRef.current !== chapterIdx)
          ) {
            drawChapterFrame(chapterIdx, Math.round(currentFrameFloatRef.current));
          }
          loadNext();
        };
        img.onerror = () => {
          if (chapterGenerationRef.current[chapterIdx] !== gen) return;
          loadNext();
        };
      };

      for (let c = 0; c < MAX_CONCURRENT; c++) {
        loadNext();
      }
    },
    [staticFallback, drawChapterFrame]
  );

  // IntersectionObserver: lazy-load Chapter 0 when approaching viewport + fire service_chapter_view
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sectionEl = sectionRef.current;
    if (!sectionEl) return;

    const preloadObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const env = detectChaptersEnv();
          if (entry.isIntersecting && !env.isStaticFallback) {
            startLoadingChapter(activeChapterIdxRef.current, env.resolvedFrameSet);
            preloadObserver.disconnect();
            break;
          }
        }
      },
      { rootMargin: '600px 0px', threshold: 0.01 }
    );

    const viewObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          sectionInViewRef.current = entry.isIntersecting;
          if (entry.isIntersecting) {
            const currentChapter = SERVICE_CHAPTERS[activeChapterIdxRef.current];
            if (currentChapter && !viewedChaptersRef.current.has(currentChapter.id)) {
              viewedChaptersRef.current.add(currentChapter.id);
              fireChapterGaEvent('service_chapter_view', {
                chapter_id: currentChapter.id,
              });
            }
          }
        }
      },
      { threshold: 0.01 }
    );

    preloadObserver.observe(sectionEl);
    viewObserver.observe(sectionEl);

    return () => {
      preloadObserver.disconnect();
      viewObserver.disconnect();
    };
  }, [startLoadingChapter]);

  // Scroll listener + light lerp smoothing across all chapters
  useEffect(() => {
    if (staticFallback || detectChaptersEnv().isStaticFallback || typeof window === 'undefined') {
      return;
    }

    const stepAnimation = () => {
      const target = targetFrameRef.current;
      const current = currentFrameFloatRef.current;
      const diff = target - current;
      const activeIdx = activeChapterIdxRef.current;

      if (Math.abs(diff) < 0.05) {
        currentFrameFloatRef.current = target;
        drawChapterFrame(activeIdx, Math.round(target));
        rafIdRef.current = null;
        return;
      }

      currentFrameFloatRef.current = current + diff * 0.28;
      drawChapterFrame(activeIdx, Math.round(currentFrameFloatRef.current));
      rafIdRef.current = window.requestAnimationFrame(stepAnimation);
    };

    const computeScrollProgress = () => {
      const trackEl = trackRef.current;
      const stickyEl = stickyRef.current;
      if (!trackEl) return;

      const trackRect = trackEl.getBoundingClientRect();
      const stickyHeight = stickyEl ? stickyEl.offsetHeight : window.innerHeight - 72;
      const stickyTopOffset = stickyEl
        ? parseFloat(window.getComputedStyle(stickyEl).top || '72') || 72
        : 72;

      const scrollableDistance = Math.max(1, trackRect.height - stickyHeight);
      const scrolled = stickyTopOffset - trackRect.top;

      // Runtime safety fallback if sticky fails to pin while inside the track
      if (
        stickyEl &&
        scrolled > 80 &&
        scrolled < scrollableDistance - 80 &&
        Math.abs(stickyEl.getBoundingClientRect().top - stickyTopOffset) > 48
      ) {
        setStaticFallback(true);
        return;
      }

      const totalProgress = Math.min(1, Math.max(0, scrolled / scrollableDistance));
      const numChapters = SERVICE_CHAPTERS.length;
      const scaled = totalProgress * numChapters;
      const nextChapterIdx = Math.min(numChapters - 1, Math.max(0, Math.floor(scaled)));
      const localProgress =
        nextChapterIdx === numChapters - 1 && totalProgress >= 1
          ? 1
          : Math.min(1, Math.max(0, scaled - nextChapterIdx));

      const chapter = SERVICE_CHAPTERS[nextChapterIdx];
      const env = detectChaptersEnv();
      const isSectionVisibleInViewport =
        trackRect.top < window.innerHeight * 0.85 && trackRect.bottom > stickyTopOffset + 80;
      sectionInViewRef.current = isSectionVisibleInViewport;

      if (isSectionVisibleInViewport && !viewedChaptersRef.current.has(chapter.id)) {
        viewedChaptersRef.current.add(chapter.id);
        fireChapterGaEvent('service_chapter_view', {
          chapter_id: chapter.id,
        });
      }

      // Ensure current chapter is loading if user scrolled directly into it
      if (!chapterLoadingStartedRef.current[nextChapterIdx]) {
        startLoadingChapter(nextChapterIdx, env.resolvedFrameSet);
      }

      // Prefetch next chapter when current chapter reaches ~50%
      if (localProgress >= 0.5 && nextChapterIdx + 1 < numChapters) {
        startLoadingChapter(nextChapterIdx + 1, env.resolvedFrameSet);
      }

      // If chapter changed, snap currentFrameFloat to the new chapter's target frame and release chapters >= 2 steps away
      const playProgress = Math.min(1, localProgress / PLAY_PORTION);
      const nextTargetFrame = 1 + playProgress * (chapter.totalFrames - 1);

      if (activeChapterIdxRef.current !== nextChapterIdx) {
        activeChapterIdxRef.current = nextChapterIdx;
        currentFrameFloatRef.current = nextTargetFrame;
        targetFrameRef.current = nextTargetFrame;
        setActiveChapterIdx(nextChapterIdx);
        releaseDistantChapters(nextChapterIdx);
        drawChapterFrame(nextChapterIdx, Math.round(nextTargetFrame));

        if (sectionInViewRef.current && !viewedChaptersRef.current.has(chapter.id)) {
          viewedChaptersRef.current.add(chapter.id);
          fireChapterGaEvent('service_chapter_view', {
            chapter_id: chapter.id,
          });
        }
      } else {
        targetFrameRef.current = nextTargetFrame;
      }

      setChapterProgress(localProgress);

      // Fire service_chapter_complete when chapter reaches >= 90%
      if (localProgress >= 0.9 && !completedChaptersRef.current.has(chapter.id)) {
        completedChaptersRef.current.add(chapter.id);
        fireChapterGaEvent('service_chapter_complete', {
          chapter_id: chapter.id,
        });
      }

      if (rafIdRef.current === null) {
        rafIdRef.current = window.requestAnimationFrame(stepAnimation);
      }
    };

    computeScrollProgress();

    window.addEventListener('scroll', computeScrollProgress, { passive: true });
    window.addEventListener('resize', computeScrollProgress, { passive: true });

    return () => {
      window.removeEventListener('scroll', computeScrollProgress);
      window.removeEventListener('resize', computeScrollProgress);
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [staticFallback, drawChapterFrame, startLoadingChapter, releaseDistantChapters]);

  // Jump to the start of a chapter when clicking a rail segment
  const handleRailClick = (targetChapterIdx: number) => {
    const trackEl = trackRef.current;
    const stickyEl = stickyRef.current;
    if (!trackEl || typeof window === 'undefined') return;

    const trackRect = trackEl.getBoundingClientRect();
    const trackTopDocument = window.scrollY + trackRect.top;
    const stickyHeight = stickyEl ? stickyEl.offsetHeight : window.innerHeight - 72;
    const stickyTopOffset = stickyEl
      ? parseFloat(window.getComputedStyle(stickyEl).top || '72') || 72
      : 72;
    const scrollableDistance = Math.max(1, trackRect.height - stickyHeight);

    // Scroll slightly inside the target chapter (1% into the chapter) so Math.floor(scaled) lands cleanly on targetChapterIdx
    const chapterFraction = (targetChapterIdx + 0.01) / SERVICE_CHAPTERS.length;
    const targetScrollY = Math.max(
      0,
      trackTopDocument - stickyTopOffset + chapterFraction * scrollableDistance
    );

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
      top: targetScrollY,
      behavior: prefersReduced ? 'auto' : 'smooth',
    });
  };

  // Reduced-motion / Save-Data / no overflow:clip static poster fallback
  if (staticFallback) {
    return (
      <section
        ref={sectionRef}
        data-testid="service-chapters-section"
        data-static-fallback="true"
        className="w-full"
      >
        {SERVICE_CHAPTERS.map((chapter) => {
          const palette = chapter.colors.light;
          return (
            <div
              key={chapter.id}
              data-testid={`service-chapter-static-${chapter.id}`}
              style={{ backgroundColor: palette.bg, color: palette.text }}
              className="w-full py-12 px-8 lg:px-12 border-t border-black/10"
            >
              <div className="max-w-[1160px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 text-left">
                  <span
                    style={{ color: palette.muted }}
                    className="inline-block text-xs font-extrabold uppercase tracking-[0.14em] mb-2"
                  >
                    {chapter.name}
                  </span>
                  <h2
                    style={{ color: palette.text }}
                    className="text-3xl lg:text-4xl font-black tracking-tight leading-[1.12] mb-3"
                  >
                    {chapter.heading}
                  </h2>
                  <p
                    style={{ color: palette.muted }}
                    className="text-base lg:text-lg leading-relaxed mb-4 max-w-md"
                  >
                    {chapter.text}
                  </p>
                  <Link
                    href={chapter.linkHref}
                    data-testid={`service-chapter-link-${chapter.id}`}
                    onClick={() =>
                      fireChapterGaEvent('service_chapter_cta_click', {
                        chapter_id: chapter.id,
                        link_href: chapter.linkHref,
                      })
                    }
                    style={{ color: palette.accent, textDecoration: 'none' }}
                    className="inline-flex items-center gap-1 text-sm font-extrabold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    {chapter.linkText}
                  </Link>
                  <p
                    data-testid={`service-chapter-disclaimer-${chapter.id}`}
                    style={{ color: palette.muted }}
                    className="text-[11px] leading-snug opacity-75 mt-3 max-w-sm"
                  >
                    {chapter.disclaimer}
                  </p>
                </div>

                <div className="lg:col-span-6 flex justify-center">
                  <div
                    style={{ borderColor: palette.cardBorder }}
                    className="w-[300px] aspect-[9/16] rounded-[28px] overflow-hidden border-2 bg-[#191919]"
                  >
                    <img
                      data-testid={`service-chapter-static-poster-${chapter.id}`}
                      src={`${chapter.framesFolder}/poster.webp`}
                      alt={chapter.heading}
                      className="w-full h-full object-cover block"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    );
  }

  const activeChapter = SERVICE_CHAPTERS[activeChapterIdx] || SERVICE_CHAPTERS[0];
  const palette = activeChapter.colors.light;
  const isLinkVisible = chapterProgress >= LINK_REVEAL_THRESHOLD || linkFocused;

  return (
    <section
      ref={sectionRef}
      data-testid="service-chapters-section"
      data-active-chapter={activeChapter.id}
      className="w-full"
    >
      {/* Scroll Track: 360vh per chapter */}
      <div
        ref={trackRef}
        data-testid="service-chapters-track"
        style={{ height: `${SERVICE_CHAPTERS.length * SCROLL_VH_PER_CHAPTER}vh` }}
        className="relative w-full"
      >
        {/* Pinned Sticky Stage */}
        <div
          ref={stickyRef}
          data-testid="service-chapters-sticky-stage"
          style={{
            backgroundColor: palette.bg,
            color: palette.text,
            transition: 'background-color 0.9s cubic-bezier(0.22, 1, 0.36, 1), color 0.9s ease',
          }}
          className="sticky top-[calc(env(safe-area-inset-top,0px)+72px)] h-[calc(100vh-72px)] w-full flex flex-col justify-between px-8 lg:px-14 py-2 overflow-hidden"
        >
          {/* Top Progress Rail: one labeled segment per chapter */}
          <div
            data-testid="service-chapters-progress-rail"
            role="navigation"
            aria-label="Service story chapters"
            className="w-full max-w-[1180px] mx-auto pt-1 pb-1.5 shrink-0 flex items-center gap-4"
          >
            {SERVICE_CHAPTERS.map((chap, idx) => {
              const segFill =
                idx < activeChapterIdx
                  ? 100
                  : idx === activeChapterIdx
                  ? Math.round(chapterProgress * 100)
                  : 0;
              const isCurrent = idx === activeChapterIdx;

              return (
                <button
                  key={chap.id}
                  type="button"
                  data-testid={`service-chapter-rail-btn-${chap.id}`}
                  aria-label={`Jump to ${chap.name} chapter`}
                  aria-current={isCurrent ? 'step' : undefined}
                  onClick={() => handleRailClick(idx)}
                  style={{ color: palette.text }}
                  className="group flex-1 flex flex-col gap-1 text-left bg-transparent border-0 p-1 rounded-lg cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <div className="flex items-center justify-between text-xs font-extrabold tracking-wide">
                    <span className={isCurrent ? 'opacity-100' : 'opacity-60 group-hover:opacity-90'}>
                      0{idx + 1} · {chap.name}
                    </span>
                    <span className="text-[11px] font-bold opacity-60">{segFill}%</span>
                  </div>
                  <div
                    style={{ backgroundColor: palette.railBg }}
                    className="w-full h-1.5 rounded-full overflow-hidden"
                  >
                    <div
                      data-testid={`service-chapter-rail-fill-${chap.id}`}
                      style={{
                        width: `${segFill}%`,
                        backgroundColor: palette.railFill,
                        transition: 'width 0.12s linear, background-color 0.9s ease',
                      }}
                      className="h-full rounded-full"
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Split Stage Content: Left Text + Link, Right Large 9:16 Video */}
          <div className="flex-1 min-h-0 w-full max-w-[1180px] mx-auto grid grid-cols-12 gap-8 items-center">
            {/* Left Column: Heading, One-Line Text, End-of-Chapter Text Link, Muted Disclaimer */}
            <div className="col-span-5 flex flex-col items-start text-left pr-4">
              <span
                data-testid="service-chapter-eyebrow"
                style={{ color: palette.muted }}
                className="text-xs font-extrabold uppercase tracking-[0.16em] mb-2.5"
              >
                0{activeChapterIdx + 1} / 0{SERVICE_CHAPTERS.length} · {activeChapter.name}
              </span>

              <h2
                data-testid="service-chapter-heading"
                style={{ color: palette.text }}
                className="text-3xl lg:text-4xl xl:text-[44px] font-black tracking-tight leading-[1.12] mb-3.5"
              >
                {activeChapter.heading}
              </h2>

              <p
                data-testid="service-chapter-text"
                style={{ color: palette.muted }}
                className="text-base lg:text-lg leading-relaxed mb-5 max-w-md"
              >
                {activeChapter.text}
              </p>

              {/* Small text link: visible only when chapter video is nearly finished (>=80%) or on keyboard focus */}
              <Link
                href={activeChapter.linkHref}
                data-testid="service-chapter-active-link"
                data-visible={isLinkVisible ? 'true' : 'false'}
                onFocus={() => setLinkFocused(true)}
                onBlur={() => setLinkFocused(false)}
                onClick={() =>
                  fireChapterGaEvent('service_chapter_cta_click', {
                    chapter_id: activeChapter.id,
                    link_href: activeChapter.linkHref,
                  })
                }
                style={{
                  color: palette.accent,
                  textDecoration: 'none',
                  opacity: isLinkVisible ? 1 : 0,
                  pointerEvents: isLinkVisible ? 'auto' : 'none',
                  transform: isLinkVisible ? 'translateY(0)' : 'translateY(6px)',
                  transition: 'opacity 0.35s ease, transform 0.35s ease',
                }}
                className="inline-flex items-center gap-1.5 text-sm lg:text-base font-extrabold underline underline-offset-4 rounded-md px-1 -ml-1 focus:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                {activeChapter.linkText}
              </Link>

              {/* Short, small, muted disclaimer line under the link */}
              <p
                data-testid="service-chapter-disclaimer"
                style={{ color: palette.muted }}
                className="text-[11px] leading-snug opacity-70 mt-3 max-w-xs"
              >
                {activeChapter.disclaimer}
              </p>
            </div>

            {/* Right Column: Large Portrait Video Stage at min(calc(100vh - 150px), 900px) with aspect 9:16 */}
            <div className="col-span-7 flex items-center justify-center h-full">
              <div
                data-testid="service-chapters-video-stage"
                style={{
                  height: 'min(calc(100vh - 150px), 900px)',
                  aspectRatio: '9 / 16',
                  borderColor: palette.cardBorder,
                  backgroundImage: `url(${activeChapter.framesFolder}/poster-start.webp)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
                className="rounded-[28px] overflow-hidden border-2 bg-[#191919] relative shrink-0"
              >
                <canvas
                  ref={canvasRef}
                  data-testid="service-chapters-canvas"
                  data-active-chapter={activeChapter.id}
                  data-current-frame={displayedFrame}
                  data-frame-set={frameSet}
                  width={frameSet === '480' ? 480 : 720}
                  height={frameSet === '480' ? 854 : 1280}
                  aria-label={`${activeChapter.name}: ${activeChapter.heading}`}
                  className="w-full h-full object-cover block"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
