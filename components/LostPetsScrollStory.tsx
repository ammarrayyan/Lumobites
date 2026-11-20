'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Capacitor } from '@capacitor/core';
import { ArrowLeft, Footprints, Search } from 'lucide-react';

const TOTAL_FRAMES = 80;

const CHAPTERS = [
  { index: 0, label: ' Chapter 1: A pet goes missing', startFrame: 1, endFrame: 20, progressTarget: 0.02 },
  { index: 1, label: 'Chapter 2: Neighbor spots & snaps a photo', startFrame: 21, endFrame: 40, progressTarget: 0.34 },
  { index: 2, label: 'Chapter 3: Photo search compares reports', startFrame: 41, endFrame: 60, progressTarget: 0.66 },
  { index: 3, label: 'Chapter 4: Neighbors connect to reunite', startFrame: 61, endFrame: 80, progressTarget: 0.96 },
];

type NetworkInformationLike = {
  saveData?: boolean;
  effectiveType?: string;
};

function detectScrollStoryEnv(): { isStaticFallback: boolean; resolvedFrameSet: '480' | '720' } {
  if (typeof window === 'undefined') {
    return { isStaticFallback: false, resolvedFrameSet: '480' };
  }
  const supportsOverflowClip =
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('overflow', 'clip');

  if (!supportsOverflowClip) {
    return { isStaticFallback: true, resolvedFrameSet: '480' };
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
    return { isStaticFallback: true, resolvedFrameSet: '480' };
  }

  const isSmallOr3G = window.innerWidth < 700 || effectiveType === '3g';
  return {
    isStaticFallback: false,
    resolvedFrameSet: isSmallOr3G ? '480' : '720',
  };
}

function fireGaEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  const w = window as any;
  if (typeof w.gtag === 'function') {
    w.gtag('event', eventName, params || {});
  } else if (Array.isArray(w.dataLayer)) {
    w.dataLayer.push({ event: eventName, ...(params || {}) });
  }
}

function formatFramePath(folder: '480' | '720', frameNumber: number): string {
  const padded = String(Math.min(TOTAL_FRAMES, Math.max(1, frameNumber))).padStart(3, '0');
  return `/scroll/lost-pets/${folder}/f${padded}.webp`;
}

export default function LostPetsScrollStory({
  embeddedOnHomepage = false,
}: {
  embeddedOnHomepage?: boolean;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isNativeApp, setIsNativeApp] = useState(false);
  const [staticFallback, setStaticFallback] = useState(false);
  const [frameSet, setFrameSet] = useState<'480' | '720'>('480');
  const [displayedFrame, setDisplayedFrame] = useState(1);
  const [activeChapter, setActiveChapter] = useState(0);

  // Refs for animation & preloading without re-renders on every rAF tick
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES + 1).fill(null));
  const posterStartImgRef = useRef<HTMLImageElement | null>(null);
  const loadingStartedRef = useRef(false);
  const targetFrameRef = useRef(1);
  const currentFrameFloatRef = useRef(1);
  const drawnFrameRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const viewEventFiredRef = useRef(false);
  const completeEventFiredRef = useRef(false);

  // Draw the requested frame (or nearest loaded frame / poster-start) onto the canvas
  const drawFrameToCanvas = useCallback((frameNumber: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const clamped = Math.min(TOTAL_FRAMES, Math.max(1, Math.round(frameNumber)));
    let imgToDraw = imagesRef.current[clamped];

    // If exact frame is not loaded yet, find nearest loaded frame
    if (!imgToDraw || !imgToDraw.complete || imgToDraw.naturalWidth === 0) {
      imgToDraw = null;
      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        const lower = clamped - offset;
        const higher = clamped + offset;
        if (lower >= 1) {
          const candidate = imagesRef.current[lower];
          if (candidate && candidate.complete && candidate.naturalWidth > 0) {
            imgToDraw = candidate;
            break;
          }
        }
        if (higher <= TOTAL_FRAMES) {
          const candidate = imagesRef.current[higher];
          if (candidate && candidate.complete && candidate.naturalWidth > 0) {
            imgToDraw = candidate;
            break;
          }
        }
      }
    }

    // Fallback to poster-start.webp if no frame is decoded yet
    if (!imgToDraw && posterStartImgRef.current && posterStartImgRef.current.complete && posterStartImgRef.current.naturalWidth > 0) {
      imgToDraw = posterStartImgRef.current;
    }

    if (!imgToDraw) return;

    if (canvas.width !== imgToDraw.naturalWidth || canvas.height !== imgToDraw.naturalHeight) {
      canvas.width = imgToDraw.naturalWidth;
      canvas.height = imgToDraw.naturalHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgToDraw, 0, 0, canvas.width, canvas.height);

    if (drawnFrameRef.current !== clamped) {
      drawnFrameRef.current = clamped;
      setDisplayedFrame(clamped);
      const chapterIdx = clamped <= 20 ? 0 : clamped <= 40 ? 1 : clamped <= 60 ? 2 : 3;
      setActiveChapter(chapterIdx);
    }
  }, []);

  // Add route-scoped class to html/body on mount and always remove on unmount / navigation
  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    const htmlEl = document.documentElement;
    const bodyEl = document.body;

    const syncRouteClass = () => {
      const shouldApply =
        !Capacitor.isNativePlatform() &&
        (!embeddedOnHomepage || window.innerWidth >= 1024);
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
  }, [embeddedOnHomepage]);

  // Detect environment, reduced-motion, Save-Data, overflow:clip support, and screen width
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsNativeApp(Capacitor.isNativePlatform());

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

    const evaluateMode = () => {
      const { isStaticFallback, resolvedFrameSet } = detectScrollStoryEnv();
      setStaticFallback(isStaticFallback);
      setFrameSet(resolvedFrameSet);
    };

    evaluateMode();

    const onMqChange = () => evaluateMode();
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onMqChange);
    }

    return () => {
      if (typeof mq.removeEventListener === 'function') {
        mq.removeEventListener('change', onMqChange);
      }
    };
  }, []);

  // Load initial poster-start.webp for immediate canvas display in interactive mode
  useEffect(() => {
    if (staticFallback || detectScrollStoryEnv().isStaticFallback || typeof window === 'undefined') return;
    const posterImg = new Image();
    posterImg.src = '/scroll/lost-pets/poster-start.webp';
    posterImg.onload = () => {
      posterStartImgRef.current = posterImg;
      if (drawnFrameRef.current <= 1) {
        drawFrameToCanvas(1);
      }
    };
  }, [staticFallback, drawFrameToCanvas]);

  // Progressive frame loader (triggered by IntersectionObserver when section is near viewport)
  const startPreloadingFrames = useCallback(
    (selectedSet: '480' | '720') => {
      if (loadingStartedRef.current || staticFallback || detectScrollStoryEnv().isStaticFallback || typeof window === 'undefined') return;
      loadingStartedRef.current = true;

      // Build priority order: Frame 1 & 80 first, then every 4th keyframe, then all remaining frames
      const priorityQueue: number[] = [];
      const added = new Set<number>();

      const enqueue = (n: number) => {
        if (n >= 1 && n <= TOTAL_FRAMES && !added.has(n)) {
          added.add(n);
          priorityQueue.push(n);
        }
      };

      enqueue(1);
      for (let i = 1; i <= TOTAL_FRAMES; i += 4) enqueue(i);
      enqueue(TOTAL_FRAMES);
      for (let i = 1; i <= TOTAL_FRAMES; i += 2) enqueue(i);
      for (let i = 1; i <= TOTAL_FRAMES; i++) enqueue(i);

      let cursor = 0;
      const MAX_CONCURRENT = 4;

      const loadNext = () => {
        if (cursor >= priorityQueue.length) return;
        const frameNum = priorityQueue[cursor++];
        const img = new Image();
        img.decoding = 'async';
        img.src = formatFramePath(selectedSet, frameNum);
        img.onload = () => {
          imagesRef.current[frameNum] = img;
          if (Math.abs(targetFrameRef.current - frameNum) <= 2 || drawnFrameRef.current === 0) {
            drawFrameToCanvas(Math.round(currentFrameFloatRef.current));
          }
          loadNext();
        };
        img.onerror = () => {
          loadNext();
        };
      };

      for (let c = 0; c < MAX_CONCURRENT; c++) {
        loadNext();
      }
    },
    [staticFallback, drawFrameToCanvas]
  );

  // IntersectionObserver for lazy frame loading + GA4 view event
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sectionEl = sectionRef.current;
    if (!sectionEl) return;

    // 1. Preload observer (rootMargin 600px before viewport)
    const preloadObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const env = detectScrollStoryEnv();
          if (entry.isIntersecting && !env.isStaticFallback) {
            startPreloadingFrames(env.resolvedFrameSet);
            preloadObserver.disconnect();
            break;
          }
        }
      },
      { rootMargin: '600px 0px', threshold: 0.01 }
    );

    // 2. View analytics observer (fires lost_pets_story_view once when visible)
    const viewObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !viewEventFiredRef.current) {
            viewEventFiredRef.current = true;
            fireGaEvent('lost_pets_story_view', {
              frame_set: staticFallback ? 'poster_only' : frameSet,
            });
            viewObserver.disconnect();
            break;
          }
        }
      },
      { threshold: 0.2 }
    );

    preloadObserver.observe(sectionEl);
    viewObserver.observe(sectionEl);

    return () => {
      preloadObserver.disconnect();
      viewObserver.disconnect();
    };
  }, [frameSet, staticFallback, startPreloadingFrames]);

  // Passive scroll listener + light lerp smoothing in requestAnimationFrame
  useEffect(() => {
    if (staticFallback || detectScrollStoryEnv().isStaticFallback || typeof window === 'undefined') return;

    const stepAnimation = () => {
      const target = targetFrameRef.current;
      const current = currentFrameFloatRef.current;
      const diff = target - current;

      if (Math.abs(diff) < 0.05) {
        currentFrameFloatRef.current = target;
        drawFrameToCanvas(Math.round(target));
        rafIdRef.current = null;
        return;
      }

      // Light smoothing factor
      currentFrameFloatRef.current = current + diff * 0.28;
      drawFrameToCanvas(Math.round(currentFrameFloatRef.current));
      rafIdRef.current = window.requestAnimationFrame(stepAnimation);
    };

    const computeScrollProgress = () => {
      const trackEl = trackRef.current;
      const stickyEl = stickyRef.current;
      if (!trackEl) return;

      const trackRect = trackEl.getBoundingClientRect();
      const stickyHeight = stickyEl ? stickyEl.offsetHeight : window.innerHeight * 0.8;
      const stickyTopOffset = stickyEl
        ? parseFloat(window.getComputedStyle(stickyEl).top || '80') || 80
        : 80;

      const scrollableDistance = Math.max(1, trackRect.height - stickyHeight);
      const scrolled = stickyTopOffset - trackRect.top;

      // Runtime safety check: if user has scrolled well into the track (before its bottom)
      // and the sticky stage failed to pin near stickyTopOffset, fall back to static poster
      if (
        stickyEl &&
        scrolled > 60 &&
        scrolled < scrollableDistance - 60 &&
        Math.abs(stickyEl.getBoundingClientRect().top - stickyTopOffset) > 48
      ) {
        setStaticFallback(true);
        return;
      }

      const progress = Math.min(1, Math.max(0, scrolled / scrollableDistance));

      const nextTargetFrame = 1 + progress * (TOTAL_FRAMES - 1);
      targetFrameRef.current = nextTargetFrame;

      // Ensure frames have started loading if user jumped directly via scroll
      if (!loadingStartedRef.current) {
        startPreloadingFrames(frameSet);
      }

      if (progress >= 0.9 && !completeEventFiredRef.current) {
        completeEventFiredRef.current = true;
        fireGaEvent('lost_pets_story_complete', {
          frame_set: frameSet,
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
  }, [staticFallback, frameSet, drawFrameToCanvas, startPreloadingFrames]);

  const handleChapterClick = (progressTarget: number) => {
    const trackEl = trackRef.current;
    const stickyEl = stickyRef.current;
    if (!trackEl || typeof window === 'undefined') return;

    const trackRect = trackEl.getBoundingClientRect();
    const trackTopDocument = window.scrollY + trackRect.top;
    const stickyHeight = stickyEl ? stickyEl.offsetHeight : window.innerHeight * 0.8;
    const stickyTopOffset = stickyEl
      ? parseFloat(window.getComputedStyle(stickyEl).top || '80') || 80
      : 80;
    const scrollableDistance = Math.max(1, trackRect.height - stickyHeight);
    const targetScrollY = Math.max(
      0,
      trackTopDocument - stickyTopOffset + progressTarget * scrollableDistance
    );

    window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
  };

  return (
    <section
      ref={sectionRef}
      data-testid="lost-pets-scroll-story"
      className="w-full bg-[#F7F3EE] text-[#2B231D] py-6 sm:py-10 px-4 sm:px-6"
    >
      {/* Top Heading Block Above Stage */}
      <div className="max-w-2xl mx-auto text-center mb-5 sm:mb-7">
        {!embeddedOnHomepage && (
          <div className="mb-3 flex justify-center">
            <Link
              href="/lost-pets"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8B5E3C] hover:text-[#734A2E] transition-colors"
              style={{ textDecoration: 'none' }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Lost &amp; Found Board</span>
            </Link>
          </div>
        )}

        <div className="inline-flex items-center gap-1.5 bg-[#FAF5EE] border border-[#E8DDD4] text-[#8B5E3C] text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2.5">
          <Footprints className="w-3.5 h-3.5 text-[#8B5E3C]" />
          <span>Lost &amp; Found Story</span>
        </div>

        {embeddedOnHomepage ? (
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#191919] tracking-tight mb-2">
            How Lost Pets Works
          </h2>
        ) : (
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#191919] tracking-tight mb-2">
            How Lost Pets Works
          </h1>
        )}
        <p className="text-xs sm:text-sm text-[#7A6B5E] max-w-md mx-auto leading-relaxed">
          {staticFallback
            ? 'See how a neighborhood photo report helps families search for a missing pet.'
            : 'Scroll down to watch how a photo report helps neighbors search and spot a missing pet nearby.'}
        </p>
      </div>

      {/* Scroll Track + Sticky Portrait Stage */}
      <div
        ref={trackRef}
        data-testid="lost-pets-scroll-track"
        className={staticFallback ? 'relative w-full h-auto' : 'relative w-full h-[450vh] md:h-[380vh]'}
      >
        <div
          ref={stickyRef}
          data-testid="lost-pets-sticky-stage"
          className={
            staticFallback
              ? 'w-full flex flex-col items-center justify-center py-2'
              : 'sticky top-[calc(env(safe-area-inset-top,0px)+80px)] w-full flex flex-col items-center justify-center py-2'
          }
        >
          {/* Portrait Stage + Side Chapter Dots */}
          <div className="flex items-center justify-center gap-2.5 sm:gap-4 w-full max-w-[360px] mx-auto">
            {/* 9:16 Portrait Stage (No overlaid captions inside) */}
            <div
              data-testid="lost-pets-portrait-stage"
              className="w-[min(76vw,290px)] sm:w-[320px] aspect-[9/16] rounded-[28px] overflow-hidden border-2 border-[#E8DDD4] bg-[#191919] relative shrink-0"
              style={{
                backgroundImage: 'url(/scroll/lost-pets/poster-start.webp)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {staticFallback ? (
                <img
                  data-testid="lost-pets-static-poster"
                  src="/scroll/lost-pets/poster.webp"
                  alt="Illustration showing how Lumo Bites Lost Pets photo search works"
                  className="w-full h-full object-cover block"
                />
              ) : (
                <canvas
                  ref={canvasRef}
                  data-testid="lost-pets-canvas"
                  data-current-frame={displayedFrame}
                  data-frame-set={frameSet}
                  width={frameSet === '480' ? 480 : 720}
                  height={frameSet === '480' ? 854 : 1280}
                  aria-label="Interactive scroll animation showing a lost pet story"
                  className="w-full h-full object-cover block"
                />
              )}
            </div>

            {/* Chapter Dots on the Side */}
            {!staticFallback && (
              <div
                data-testid="lost-pets-chapter-dots"
                role="navigation"
                aria-label="Story chapters"
                className="flex flex-col items-center gap-2.5 py-3 px-1.5 rounded-full bg-white/90 border border-[#E8DDD4]"
              >
                {CHAPTERS.map((chapter) => {
                  const isActive = activeChapter === chapter.index;
                  return (
                    <button
                      key={chapter.index}
                      type="button"
                      onClick={() => handleChapterClick(chapter.progressTarget)}
                      aria-label={chapter.label}
                      aria-current={isActive ? 'step' : undefined}
                      data-testid={`chapter-dot-${chapter.index + 1}`}
                      className={`rounded-full transition-all duration-200 cursor-pointer border-0 p-0 ${
                        isActive
                          ? 'w-2.5 h-6 bg-[#8B5E3C]'
                          : 'w-2.5 h-2.5 bg-[#D8C8B8] hover:bg-[#B89F88]'
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Required Honest Disclaimer Note Under the Stage */}
          <p
            data-testid="lost-pets-disclaimer-note"
            className="text-[11px] sm:text-xs text-[#7A6B5E] text-center max-w-[330px] mx-auto mt-3 leading-snug"
          >
            Illustration. Lumo helps you search lost and found reports by photo. Matches are not guaranteed.
          </p>
        </div>
      </div>

      {/* Bottom Copy & CTA Buttons Below the Stage */}
      <div
        data-testid="lost-pets-cta-block"
        className="max-w-lg mx-auto mt-8 sm:mt-10 bg-white border border-[#E8DDD4] rounded-3xl p-6 sm:p-7 text-center"
      >
        <h2 className="text-lg sm:text-xl font-extrabold text-[#191919] mb-2">
          Search or Post a Lost &amp; Found Report
        </h2>
        <p className="text-xs sm:text-sm text-[#666666] leading-relaxed mb-5">
          Post a missing or found pet alert for your neighborhood, or upload a photo to compare against existing community reports nearby.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
          <Link
            href="/lost-pets"
            data-testid="lost-pets-story-primary-cta"
            onClick={() => fireGaEvent('lost_pets_story_cta_click', { cta_target: 'lost_pets_board' })}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition-colors"
            style={{ textDecoration: 'none' }}
          >
            <Search className="w-4 h-4" />
            <span>Open Lost &amp; Found Board</span>
          </Link>

          <Link
            href="/lost-pets/post"
            data-testid="lost-pets-story-post-cta"
            onClick={() => fireGaEvent('lost_pets_story_cta_click', { cta_target: 'post_lost_pet' })}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FAF5EE] hover:bg-[#F0E6DA] text-[#8B5E3C] border border-[#E8DDD4] font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition-colors"
            style={{ textDecoration: 'none' }}
          >
            <Footprints className="w-4 h-4" />
            <span>Post Lost or Found Pet</span>
          </Link>
        </div>

        {/* Existing Homepage App Store & Google Play Badges */}
        {!isNativeApp && (
          <div className="pt-4 border-t border-[#F0E6DC]">
            <p className="text-[11px] font-semibold text-[#7A6B5E] mb-3">
              Get the Lumo Bites mobile app for neighborhood alerts
            </p>
            <div className="flex flex-wrap gap-3 justify-center items-center">
              <a
                href="https://play.google.com/store/apps/details?id=net.lumobites.app"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="lost-pets-story-google-play"
                onClick={() => fireGaEvent('lost_pets_story_cta_click', { cta_target: 'google_play' })}
              >
                <img
                  src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
                  alt="Get it on Google Play"
                  height="40"
                  style={{ height: '40px' }}
                />
              </a>
              <a
                href="https://apps.apple.com/app/lumo-bites/id6780612179"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="lost-pets-story-app-store"
                onClick={() => fireGaEvent('lost_pets_story_cta_click', { cta_target: 'app_store' })}
              >
                <img
                  src="/app-store-badge.svg"
                  alt="Download on the App Store"
                  height="40"
                  style={{ height: '40px' }}
                />
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
