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
  frostBg: string;
  frostBorder: string;
  pillBg: string;
  pillText: string;
}

export interface ChapterScriptLine {
  at: number;
  text: string;
}

export interface ServiceChapterConfig {
  id: string;
  name: string;
  framesFolder: string;
  totalFrames: number;
  lastFrame: number;
  logoSide: 'left' | 'right';
  heading: string;
  text: string;
  linkText: string;
  linkHref: string;
  disclaimer: string;
  scriptLines: ChapterScriptLine[];
  colors: {
    light: ChapterColorTokens;
  };
}

export const SERVICE_CHAPTERS: ServiceChapterConfig[] = [
  {
    id: 'lost-pets',
    name: 'Lost Pets',
    framesFolder: '/scroll/lost-pets',
    totalFrames: 80,
    lastFrame: 67,
    logoSide: 'left',
    heading: 'Lost a pet? Tell the whole block.',
    text: 'Report a lost or found pet and share it with people nearby.',
    linkText: 'Open Lost Pets →',
    linkHref: '/lost-pets',
    disclaimer:
      'Illustration. Lumo helps you search lost and found reports by photo. Matches are not guaranteed.',
    scriptLines: [
      { at: 0, text: 'A pet goes missing.' },
      { at: 0.35, text: 'Neighbors hear about it.' },
      { at: 0.7, text: 'Share it, and help bring them home.' },
    ],
    colors: {
      light: {
        bg: '#E4EAF3',
        text: '#101826',
        muted: '#334155',
        accent: '#1E40AF',
        railBg: 'rgba(16, 24, 38, 0.14)',
        railFill: '#101826',
        cardBorder: 'rgba(16, 24, 38, 0.16)',
        frostBg: 'rgba(255, 255, 255, 0.78)',
        frostBorder: 'rgba(16, 24, 38, 0.12)',
        pillBg: '#101826',
        pillText: '#FFFFFF',
      },
    },
  },
  {
    id: 'scan-food',
    name: 'Scan Food',
    framesFolder: '/scroll/scan-food',
    totalFrames: 80,
    lastFrame: 70,
    logoSide: 'right',
    heading: 'Scan before you serve.',
    text: 'Point your phone at a pet food label and see what is inside.',
    linkText: 'Open Scan Food →',
    linkHref: '/scan',
    disclaimer:
      'Illustration. Lumo helps you review pet food label ingredients. Always check packaging directly.',
    scriptLines: [
      { at: 0, text: 'Dinner is served.' },
      { at: 0.35, text: 'But is it safe?' },
      { at: 0.62, text: 'Scan the label.' },
      { at: 0.85, text: 'Know what is inside.' },
    ],
    colors: {
      light: {
        bg: '#F6E6CC',
        text: '#24180D',
        muted: '#4A3520',
        accent: '#9A4D1A',
        railBg: 'rgba(36, 24, 13, 0.14)',
        railFill: '#24180D',
        cardBorder: 'rgba(36, 24, 13, 0.16)',
        frostBg: 'rgba(255, 251, 245, 0.82)',
        frostBorder: 'rgba(36, 24, 13, 0.12)',
        pillBg: '#24180D',
        pillText: '#FFFFFF',
      },
    },
  },
];

const SCROLL_VH_PER_CHAPTER = 340;
const PLAY_PORTION = 0.80; // frames 1..lastFrame play over 0..80% of chapter scroll
const HANDOFF_START = 0.84; // stacked slide + logo swoop over last 16% (0.84..1.00)
const TRAIL_DOT_COUNT = 6;

type NetworkInformationLike = {
  saveData?: boolean;
  effectiveType?: string;
};

function easeInOutCubic(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

function getActiveScriptIndex(lines: ChapterScriptLine[], progress: number): number {
  let idx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (progress >= lines[i].at) {
      idx = i;
    }
  }
  return idx;
}

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

function fireChapterGaEvent(eventName: string, params: Record<string, string>) {
  if (typeof window === 'undefined') return;
  const w = window as unknown as {
    gtag?: (cmd: string, name: string, p: Record<string, string>) => void;
    dataLayer?: Record<string, unknown>[];
  };
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
  maxFrame: number
): string {
  const clamped = Math.min(maxFrame, Math.max(1, frameNumber));
  const padded = String(clamped).padStart(3, '0');
  return `${framesFolder}/${resolution}/f${padded}.webp`;
}

export default function ServiceChapters() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);

  // One canvas + stacked card element per chapter
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>(SERVICE_CHAPTERS.map(() => null));
  const cardRefs = useRef<(HTMLDivElement | null)[]>(SERVICE_CHAPTERS.map(() => null));
  const cardDimRefs = useRef<(HTMLDivElement | null)[]>(SERVICE_CHAPTERS.map(() => null));
  const cardShadowStripRefs = useRef<(HTMLDivElement | null)[]>(SERVICE_CHAPTERS.map(() => null));

  // Floating logo + dotted trail refs
  const logoRef = useRef<HTMLDivElement | null>(null);
  const trailContainerRef = useRef<HTMLDivElement | null>(null);
  const trailDotRefs = useRef<(HTMLSpanElement | null)[]>(new Array(TRAIL_DOT_COUNT).fill(null));

  const [staticFallback, setStaticFallback] = useState(false);
  const [frameSet, setFrameSet] = useState<'480' | '720'>('720');
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const [chapterProgress, setChapterProgress] = useState(0);
  const [activeScriptIndices, setActiveScriptIndices] = useState<number[]>(
    SERVICE_CHAPTERS.map(() => 0)
  );
  const [displayedFrames, setDisplayedFrames] = useState<number[]>(
    SERVICE_CHAPTERS.map(() => 1)
  );

  // Per-chapter image caches and loading state
  const chapterFramesRef = useRef<(HTMLImageElement | null)[][]>(
    SERVICE_CHAPTERS.map((c) => new Array(c.lastFrame + 1).fill(null))
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
  const targetFramesRef = useRef<number[]>(SERVICE_CHAPTERS.map(() => 1));
  const currentFramesFloatRef = useRef<number[]>(SERVICE_CHAPTERS.map(() => 1));
  const drawnFramesRef = useRef<number[]>(SERVICE_CHAPTERS.map(() => 0));
  const rafIdRef = useRef<number | null>(null);
  const sectionInViewRef = useRef(false);
  const scriptIndicesRef = useRef<number[]>(SERVICE_CHAPTERS.map(() => 0));

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

  // Draw frame `frameNumber` of chapter `chapterIdx` onto its own canvas
  const drawChapterFrame = useCallback((chapterIdx: number, frameNumber: number) => {
    const canvas = canvasRefs.current[chapterIdx];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const chapter = SERVICE_CHAPTERS[chapterIdx];
    if (!chapter) return;

    const clamped = Math.min(chapter.lastFrame, Math.max(1, Math.round(frameNumber)));
    const framesArr = chapterFramesRef.current[chapterIdx] || [];
    let imgToDraw = framesArr[clamped];

    // Fall back to nearest already-loaded frame in this chapter
    if (!imgToDraw || !imgToDraw.complete || imgToDraw.naturalWidth === 0) {
      imgToDraw = null;
      for (let offset = 1; offset < chapter.lastFrame; offset++) {
        const lower = clamped - offset;
        const higher = clamped + offset;
        if (lower >= 1) {
          const candidate = framesArr[lower];
          if (candidate && candidate.complete && candidate.naturalWidth > 0) {
            imgToDraw = candidate;
            break;
          }
        }
        if (higher <= chapter.lastFrame) {
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

    if (drawnFramesRef.current[chapterIdx] !== clamped) {
      drawnFramesRef.current[chapterIdx] = clamped;
      setDisplayedFrames((prev) => {
        if (prev[chapterIdx] === clamped) return prev;
        const next = prev.slice();
        next[chapterIdx] = clamped;
        return next;
      });
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
          for (let f = 1; f <= chapter.lastFrame; f++) {
            arr[f] = null;
          }
        }
      }
    });
  }, []);

  // Start progressive loading for frames 1..chapter.lastFrame of a specific chapter
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
      const maxFrame = chapter.lastFrame;

      // Load poster-start.webp immediately for this chapter
      if (!chapterPostersRef.current[chapterIdx]) {
        const posterImg = new Image();
        posterImg.decoding = 'async';
        posterImg.src = `${chapter.framesFolder}/poster-start.webp`;
        posterImg.onload = () => {
          if (chapterGenerationRef.current[chapterIdx] !== gen) return;
          chapterPostersRef.current[chapterIdx] = posterImg;
          if (drawnFramesRef.current[chapterIdx] <= 1) {
            drawChapterFrame(chapterIdx, 1);
          }
        };
      }

      // Priority queue: frame 1, keyframes every 4 frames, lastFrame, even frames, remaining frames
      const priorityQueue: number[] = [];
      const added = new Set<number>();
      const enqueue = (n: number) => {
        if (n >= 1 && n <= maxFrame && !added.has(n)) {
          added.add(n);
          priorityQueue.push(n);
        }
      };

      enqueue(1);
      for (let i = 1; i <= maxFrame; i += 4) enqueue(i);
      enqueue(maxFrame);
      for (let i = 1; i <= maxFrame; i += 2) enqueue(i);
      for (let i = 1; i <= maxFrame; i++) enqueue(i);

      let cursor = 0;
      const MAX_CONCURRENT = 4;

      const loadNext = () => {
        if (chapterGenerationRef.current[chapterIdx] !== gen) return;
        if (cursor >= priorityQueue.length) return;
        const frameNum = priorityQueue[cursor++];
        const img = new Image();
        img.decoding = 'async';
        img.src = formatChapterFramePath(chapter.framesFolder, selectedSet, frameNum, maxFrame);
        img.onload = () => {
          if (chapterGenerationRef.current[chapterIdx] !== gen) return;
          chapterFramesRef.current[chapterIdx][frameNum] = img;
          if (
            Math.abs(targetFramesRef.current[chapterIdx] - frameNum) <= 2 ||
            drawnFramesRef.current[chapterIdx] === 0
          ) {
            drawChapterFrame(chapterIdx, Math.round(currentFramesFloatRef.current[chapterIdx]));
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

  // Apply stacked card transforms and floating logo + dotted trail transforms directly to DOM
  const applyVisualTransforms = useCallback(
    (activeIdx: number, localProgress: number, stageWidth: number) => {
      const numChapters = SERVICE_CHAPTERS.length;
      const hasNext = activeIdx < numChapters - 1;
      const rawHandoff =
        hasNext && localProgress > HANDOFF_START
          ? (localProgress - HANDOFF_START) / (1 - HANDOFF_START)
          : 0;
      const handoffT = Math.min(1, Math.max(0, rawHandoff));
      const easedHandoff = easeInOutCubic(handoffT);

      // 1. Update each stacked card's transform, radius, dimming overlay, and top gradient strip
      for (let i = 0; i < numChapters; i++) {
        const cardEl = cardRefs.current[i];
        if (!cardEl) continue;
        const dimEl = cardDimRefs.current[i];
        const stripEl = cardShadowStripRefs.current[i];

        if (i < activeIdx) {
          // Already covered by a later chapter
          cardEl.style.transform = 'translate3d(0, 0, 0) scale(0.95)';
          cardEl.style.borderTopLeftRadius = '0px';
          cardEl.style.borderTopRightRadius = '0px';
          cardEl.dataset.scale = '0.95';
          cardEl.dataset.translateY = '0';
          if (dimEl) dimEl.style.opacity = '0.12';
          if (stripEl) stripEl.style.opacity = '0';
        } else if (i === activeIdx) {
          const scale = 1 - easedHandoff * 0.05;
          cardEl.style.transform = `translate3d(0, 0, 0) scale(${scale.toFixed(4)})`;
          cardEl.style.borderTopLeftRadius = '0px';
          cardEl.style.borderTopRightRadius = '0px';
          cardEl.dataset.scale = scale.toFixed(3);
          cardEl.dataset.translateY = '0';
          if (dimEl) dimEl.style.opacity = (easedHandoff * 0.12).toFixed(3);
          if (stripEl) stripEl.style.opacity = '0';
        } else if (i === activeIdx + 1) {
          // Incoming card slides up from 100% -> 0% during handoff
          const translatePct = (1 - easedHandoff) * 100;
          const topRadius = easedHandoff > 0.01 && easedHandoff < 0.99 ? 32 : 0;
          cardEl.style.transform = `translate3d(0, ${translatePct.toFixed(2)}%, 0)`;
          cardEl.style.borderTopLeftRadius = `${topRadius}px`;
          cardEl.style.borderTopRightRadius = `${topRadius}px`;
          cardEl.dataset.scale = '1.000';
          cardEl.dataset.translateY = translatePct.toFixed(1);
          if (dimEl) dimEl.style.opacity = '0';
          if (stripEl) {
            const stripOpacity = easedHandoff > 0.01 && easedHandoff < 0.99 ? 1 : 0;
            stripEl.style.opacity = String(stripOpacity);
          }
        } else {
          // Future cards parked below
          cardEl.style.transform = 'translate3d(0, 100%, 0)';
          cardEl.style.borderTopLeftRadius = '32px';
          cardEl.style.borderTopRightRadius = '32px';
          cardEl.dataset.scale = '1.000';
          cardEl.dataset.translateY = '100.0';
          if (dimEl) dimEl.style.opacity = '0';
          if (stripEl) stripEl.style.opacity = '0';
        }
      }

      // 2. Update floating logo + dotted trail (CSS transforms only, scroll-tied)
      const logoEl = logoRef.current;
      if (logoEl) {
        const currentSide = SERVICE_CHAPTERS[activeIdx]?.logoSide || 'left';
        const nextSide = hasNext ? SERVICE_CHAPTERS[activeIdx + 1].logoSide : currentSide;
        const sideOffset = Math.min(340, Math.max(230, stageWidth * 0.25));
        const startX = currentSide === 'left' ? -sideOffset : sideOffset;
        const endX = nextSide === 'left' ? -sideOffset : sideOffset;

        const bobY = Math.sin(localProgress * Math.PI * 4) * 6;
        const restTilt = Math.cos(localProgress * Math.PI * 3) * 4;

        let xPx = startX;
        let yPx = bobY;
        let flipDeg = 0;
        let tiltDeg = restTilt;
        let scale = 1;
        let sideAttr: 'left' | 'right' | 'handoff' = currentSide;

        if (handoffT > 0 && hasNext && startX !== endX) {
          xPx = startX + (endX - startX) * easedHandoff;
          const arcLift = -Math.sin(Math.PI * easedHandoff) * 68;
          yPx = bobY * (1 - easedHandoff) + arcLift;
          flipDeg = easedHandoff * 360;
          tiltDeg = restTilt * (1 - Math.sin(Math.PI * easedHandoff)) + Math.sin(Math.PI * easedHandoff) * 10;
          scale = 1 + Math.sin(Math.PI * easedHandoff) * 0.12;
          sideAttr = handoffT >= 0.05 && handoffT <= 0.95 ? 'handoff' : handoffT < 0.05 ? currentSide : nextSide;
        }

        logoEl.style.transform = `translate3d(calc(-50% + ${xPx.toFixed(1)}px), calc(-50% + ${yPx.toFixed(1)}px), 0) perspective(900px) rotateY(${flipDeg.toFixed(1)}deg) rotateZ(${tiltDeg.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
        logoEl.dataset.side = sideAttr;
        logoEl.dataset.flipDeg = String(Math.round(flipDeg));
        logoEl.dataset.handoffProgress = handoffT.toFixed(2);

        // Update dotted swoop trail
        const trailEl = trailContainerRef.current;
        const showTrail = handoffT > 0.02 && handoffT < 0.98 && hasNext && startX !== endX;
        if (trailEl) {
          trailEl.dataset.visible = showTrail ? 'true' : 'false';
        }
        for (let k = 0; k < TRAIL_DOT_COUNT; k++) {
          const dot = trailDotRefs.current[k];
          if (!dot) continue;
          if (!showTrail) {
            dot.style.opacity = '0';
            continue;
          }
          const dotT = Math.max(0, easedHandoff - (k + 1) * 0.055);
          const dotX = startX + (endX - startX) * dotT;
          const dotY = -Math.sin(Math.PI * dotT) * 68;
          const dotOpacity =
            dotT <= 0.005 ? 0 : Math.sin(Math.PI * easedHandoff) * (1 - k / (TRAIL_DOT_COUNT + 1)) * 0.65;
          dot.style.transform = `translate3d(calc(-50% + ${dotX.toFixed(1)}px), calc(-50% + ${dotY.toFixed(1)}px), 0)`;
          dot.style.opacity = dotOpacity.toFixed(3);
        }
      }
    },
    []
  );

  // Scroll listener + light lerp smoothing across all chapters
  useEffect(() => {
    if (staticFallback || detectChaptersEnv().isStaticFallback || typeof window === 'undefined') {
      return;
    }

    const stepAnimation = () => {
      let anyMoving = false;
      for (let i = 0; i < SERVICE_CHAPTERS.length; i++) {
        const target = targetFramesRef.current[i];
        const current = currentFramesFloatRef.current[i];
        const diff = target - current;

        if (Math.abs(diff) < 0.05) {
          if (current !== target) {
            currentFramesFloatRef.current[i] = target;
            drawChapterFrame(i, Math.round(target));
          }
        } else {
          currentFramesFloatRef.current[i] = current + diff * 0.3;
          drawChapterFrame(i, Math.round(currentFramesFloatRef.current[i]));
          anyMoving = true;
        }
      }

      if (anyMoving) {
        rafIdRef.current = window.requestAnimationFrame(stepAnimation);
      } else {
        rafIdRef.current = null;
      }
    };

    const computeScrollProgress = () => {
      const trackEl = trackRef.current;
      const stickyEl = stickyRef.current;
      if (!trackEl) return;

      const trackRect = trackEl.getBoundingClientRect();
      const stickyHeight = stickyEl ? stickyEl.offsetHeight : window.innerHeight - 72;
      const stickyWidth = stickyEl ? stickyEl.offsetWidth : window.innerWidth;
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

      // Frame targets: play frames 1..lastFrame over first 80%, then hold on lastFrame
      const playProgress = Math.min(1, localProgress / PLAY_PORTION);
      const nextTargetFrame = 1 + playProgress * (chapter.lastFrame - 1);

      for (let i = 0; i < numChapters; i++) {
        if (i < nextChapterIdx) {
          targetFramesRef.current[i] = SERVICE_CHAPTERS[i].lastFrame;
          currentFramesFloatRef.current[i] = SERVICE_CHAPTERS[i].lastFrame;
        } else if (i === nextChapterIdx) {
          targetFramesRef.current[i] = nextTargetFrame;
        } else {
          targetFramesRef.current[i] = 1;
          currentFramesFloatRef.current[i] = 1;
        }
      }

      if (activeChapterIdxRef.current !== nextChapterIdx) {
        activeChapterIdxRef.current = nextChapterIdx;
        currentFramesFloatRef.current[nextChapterIdx] = nextTargetFrame;
        setActiveChapterIdx(nextChapterIdx);
        releaseDistantChapters(nextChapterIdx);
        drawChapterFrame(nextChapterIdx, Math.round(nextTargetFrame));

        if (sectionInViewRef.current && !viewedChaptersRef.current.has(chapter.id)) {
          viewedChaptersRef.current.add(chapter.id);
          fireChapterGaEvent('service_chapter_view', {
            chapter_id: chapter.id,
          });
        }
      }

      // Ensure incoming chapter's frame 1 is painted before/during handoff
      if (localProgress >= HANDOFF_START && nextChapterIdx + 1 < numChapters) {
        if (drawnFramesRef.current[nextChapterIdx + 1] === 0) {
          drawChapterFrame(nextChapterIdx + 1, 1);
        }
      }

      // Update active script line index only when threshold crossed
      const nextScriptIdx = getActiveScriptIndex(chapter.scriptLines, localProgress);
      if (scriptIndicesRef.current[nextChapterIdx] !== nextScriptIdx) {
        scriptIndicesRef.current[nextChapterIdx] = nextScriptIdx;
        setActiveScriptIndices(scriptIndicesRef.current.slice());
      }

      // Direct DOM transforms for stacked cards + floating logo + trail
      applyVisualTransforms(nextChapterIdx, localProgress, stickyWidth);
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
  }, [
    staticFallback,
    drawChapterFrame,
    startLoadingChapter,
    releaseDistantChapters,
    applyVisualTransforms,
  ]);

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

  // Skip past the chapters stage to the next section (#after-chapters)
  const handleSkipClick = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targetEl = document.getElementById('after-chapters');
    if (targetEl) {
      const targetY = Math.max(0, window.scrollY + targetEl.getBoundingClientRect().top - 72);
      window.scrollTo({
        top: targetY,
        behavior: prefersReduced ? 'auto' : 'smooth',
      });
      return;
    }
    const trackEl = trackRef.current;
    if (trackEl) {
      const fallbackY = Math.max(0, window.scrollY + trackEl.getBoundingClientRect().bottom - 72);
      window.scrollTo({
        top: fallbackY,
        behavior: prefersReduced ? 'auto' : 'smooth',
      });
    }
  };

  // Reduced-motion / Save-Data / slow network / no overflow:clip static poster fallback
  if (staticFallback) {
    return (
      <section
        ref={sectionRef}
        data-testid="service-chapters-section"
        data-static-fallback="true"
        className="w-full"
      >
        {SERVICE_CHAPTERS.map((chapter, idx) => {
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
                    0{idx + 1} / 0{SERVICE_CHAPTERS.length} · {chapter.name}
                  </span>
                  <h2
                    style={{ color: palette.text }}
                    className="font-[800] tracking-[-0.02em] leading-[1.15] text-3xl lg:text-4xl mb-3"
                  >
                    {chapter.heading}
                  </h2>
                  <p
                    style={{ color: palette.muted }}
                    className="text-base lg:text-lg leading-relaxed mb-5 max-w-md"
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
                    style={{
                      backgroundColor: palette.pillBg,
                      color: palette.pillText,
                      textDecoration: 'none',
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-bold transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
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
  const activePalette = activeChapter.colors.light;

  return (
    <section
      ref={sectionRef}
      data-testid="service-chapters-section"
      data-active-chapter={activeChapter.id}
      className="w-full"
    >
      {/* Scroll Track: 340vh per chapter */}
      <div
        ref={trackRef}
        data-testid="service-chapters-track"
        style={{ height: `${SERVICE_CHAPTERS.length * SCROLL_VH_PER_CHAPTER}vh` }}
        className="relative w-full"
      >
        {/* Single Pinned Sticky Stage (z-10, strictly below fixed z-50 Navbar) */}
        <div
          ref={stickyRef}
          data-testid="service-chapters-sticky-stage"
          className="sticky top-[calc(env(safe-area-inset-top,0px)+72px)] h-[calc(100vh-72px)] w-full overflow-hidden z-10"
        >
          {/* Top Keyboard-Accessible Progress Rail (2 segments, z-30 above stacked cards) */}
          <div
            data-testid="service-chapters-progress-rail"
            role="navigation"
            aria-label="Service story chapters"
            className="absolute top-0 left-0 right-0 z-30 px-8 lg:px-14 pt-2 pb-1.5"
          >
            <div className="w-full max-w-[1180px] mx-auto flex items-center gap-4">
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
                    style={{ color: activePalette.text }}
                    className="group flex-1 flex flex-col gap-1 text-left bg-transparent border-0 p-1 rounded-lg cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <div className="flex items-center justify-between text-xs font-extrabold tracking-wide">
                      <span className={isCurrent ? 'opacity-100' : 'opacity-60 group-hover:opacity-90'}>
                        0{idx + 1} · {chap.name}
                      </span>
                      <span className="text-[11px] font-bold opacity-60">{segFill}%</span>
                    </div>
                    <div
                      style={{ backgroundColor: activePalette.railBg }}
                      className="w-full h-1.5 rounded-full overflow-hidden"
                    >
                      <div
                        data-testid={`service-chapter-rail-fill-${chap.id}`}
                        style={{
                          width: `${segFill}%`,
                          backgroundColor: activePalette.railFill,
                          transition: 'width 0.12s linear, background-color 0.4s ease',
                        }}
                        className="h-full rounded-full"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stacked Full-Width Chapter Cards */}
          {SERVICE_CHAPTERS.map((chapter, idx) => {
            const palette = chapter.colors.light;
            const isActive = idx === activeChapterIdx;
            const currentScriptIdx = activeScriptIndices[idx] ?? 0;

            return (
              <div
                key={chapter.id}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                data-testid={`service-chapter-card-${chapter.id}`}
                data-active={isActive ? 'true' : 'false'}
                data-scale="1.000"
                data-translate-y={idx === 0 ? '0' : '100.0'}
                aria-hidden={!isActive}
                style={{
                  backgroundColor: palette.bg,
                  color: palette.text,
                  zIndex: 10 + idx * 5,
                  pointerEvents: isActive ? 'auto' : 'none',
                  transform: idx === 0 ? 'translate3d(0, 0, 0)' : 'translate3d(0, 100%, 0)',
                  willChange: 'transform',
                }}
                className="absolute inset-0 w-full h-full flex flex-col items-center justify-between pt-[60px] pb-[14px] px-6 lg:px-10"
              >
                {/* Soft top gradient edge for incoming stacked card (avoids global box-shadow strip) */}
                {idx > 0 && (
                  <div
                    ref={(el) => {
                      cardShadowStripRefs.current[idx] = el;
                    }}
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: '-36px',
                      height: '36px',
                      opacity: 0,
                      pointerEvents: 'none',
                      background:
                        'linear-gradient(to top, rgba(16, 24, 38, 0.16) 0%, rgba(16, 24, 38, 0.05) 55%, rgba(16, 24, 38, 0) 100%)',
                    }}
                  />
                )}

                {/* Subtle dimming veil while this card is being covered by the next card */}
                <div
                  ref={(el) => {
                    cardDimRefs.current[idx] = el;
                  }}
                  aria-hidden="true"
                  style={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-0 bg-black z-30"
                />

                {/* Top Centered Header Block: Heading -> One-liner -> Inline Script + Pill CTA */}
                <div
                  data-testid={`service-chapter-header-${chapter.id}`}
                  className="shrink-0 w-full max-w-[780px] mx-auto flex flex-col items-center text-center relative z-10"
                >
                  <h2
                    data-testid={
                      isActive ? 'service-chapter-heading' : `service-chapter-heading-${chapter.id}`
                    }
                    style={{
                      color: palette.text,
                      fontSize: 'clamp(30px, 3.2vw, 46px)',
                    }}
                    className="font-[800] tracking-[-0.02em] leading-[1.12] m-0"
                  >
                    {chapter.heading}
                  </h2>

                  <p
                    data-testid={
                      isActive ? 'service-chapter-text' : `service-chapter-text-${chapter.id}`
                    }
                    style={{ color: palette.muted }}
                    className="text-sm lg:text-[15px] leading-snug mt-1.5 mb-0 max-w-xl"
                  >
                    {chapter.text}
                  </p>

                  {/* Script line (in chapter accent color) next to compact pill button */}
                  <div className="mt-2.5 flex items-center justify-center gap-3 flex-wrap">
                    <div
                      data-testid={`service-chapter-script-${chapter.id}`}
                      data-active-line-index={currentScriptIdx}
                      aria-hidden="true"
                      className="hidden min-[900px]:inline-grid items-center pointer-events-none"
                    >
                      {chapter.scriptLines.map((line, lineIdx) => {
                        const isLineActive = lineIdx === currentScriptIdx;
                        return (
                          <span
                            key={line.text}
                            data-testid={`service-chapter-script-line-${chapter.id}-${lineIdx}`}
                            data-visible={isLineActive ? 'true' : 'false'}
                            style={{
                              color: palette.accent,
                              opacity: isLineActive ? 1 : 0,
                              transform: isLineActive ? 'translateY(0px)' : 'translateY(5px)',
                              transition: 'opacity 0.35s ease, transform 0.35s ease',
                            }}
                            className="col-start-1 row-start-1 font-bold tracking-[-0.01em] text-sm lg:text-[15px] whitespace-nowrap"
                          >
                            {line.text}
                          </span>
                        );
                      })}
                    </div>

                    <Link
                      href={chapter.linkHref}
                      data-testid={`service-chapter-cta-${chapter.id}`}
                      tabIndex={isActive ? 0 : -1}
                      onClick={() =>
                        fireChapterGaEvent('service_chapter_cta_click', {
                          chapter_id: chapter.id,
                          link_href: chapter.linkHref,
                        })
                      }
                      style={{
                        backgroundColor: palette.pillBg,
                        color: palette.pillText,
                        textDecoration: 'none',
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs lg:text-sm font-bold transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      {chapter.linkText}
                    </Link>
                  </div>
                </div>

                {/* Centered 9:16 Video Canvas — flex-fit so it never clips inside 100vh - 72px stage */}
                <div className="flex-1 min-h-0 w-full flex items-center justify-center my-2.5 relative z-10">
                  <div
                    data-testid={
                      isActive
                        ? 'service-chapters-video-stage'
                        : `service-chapters-video-stage-${chapter.id}`
                    }
                    style={{
                      height: 'min(calc(100svh - 250px), 920px)',
                      maxHeight: '100%',
                      aspectRatio: '9 / 16',
                      borderColor: palette.cardBorder,
                      backgroundImage: `url(${chapter.framesFolder}/poster-start.webp)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                    className="rounded-[28px] overflow-hidden border-2 bg-[#191919] relative shrink-0"
                  >
                    <canvas
                      ref={(el) => {
                        canvasRefs.current[idx] = el;
                      }}
                      data-testid={
                        isActive ? 'service-chapters-canvas' : `service-chapters-canvas-${chapter.id}`
                      }
                      data-chapter-id={chapter.id}
                      data-active-chapter={activeChapter.id}
                      data-current-frame={displayedFrames[idx] ?? 1}
                      data-last-frame={chapter.lastFrame}
                      data-frame-set={frameSet}
                      width={frameSet === '480' ? 480 : 720}
                      height={frameSet === '480' ? 854 : 1280}
                      aria-label={`${chapter.name}: ${chapter.heading}`}
                      className="w-full h-full object-cover block"
                    />
                  </div>
                </div>

                {/* Small one-line disclaimer at bottom of column */}
                <p
                  data-testid={
                    isActive
                      ? 'service-chapter-disclaimer'
                      : `service-chapter-disclaimer-${chapter.id}`
                  }
                  style={{ color: palette.muted }}
                  className="shrink-0 text-[11px] leading-tight opacity-75 m-0 text-center max-w-lg relative z-10"
                >
                  {chapter.disclaimer}
                </p>
              </div>
            );
          })}

          {/* Single Floating Logo Layer above all cards (pointer-events-none, aria-hidden, hidden < 900px width) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-30 hidden min-[900px]:block overflow-hidden"
          >
            {/* Short dotted trail along the handoff arc */}
            <div
              ref={trailContainerRef}
              data-testid="service-chapters-logo-trail"
              data-visible="false"
              className="absolute inset-0"
            >
              {Array.from({ length: TRAIL_DOT_COUNT }).map((_, k) => {
                const dotSize = Math.max(4, 9 - k);
                return (
                  <span
                    key={k}
                    ref={(el) => {
                      trailDotRefs.current[k] = el;
                    }}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '60%',
                      width: `${dotSize}px`,
                      height: `${dotSize}px`,
                      borderRadius: '9999px',
                      backgroundColor: '#C56A34',
                      opacity: 0,
                      willChange: 'transform, opacity',
                    }}
                  />
                );
              })}
            </div>

            {/* Real transparent B emblem mark (positioned lower beside video so it never overlaps heading/script) */}
            <div
              ref={logoRef}
              data-testid="service-chapters-floating-logo"
              data-side="left"
              data-flip-deg="0"
              data-handoff-progress="0.00"
              style={{
                position: 'absolute',
                left: '50%',
                top: '60%',
                width: 'clamp(72px, 6.4vw, 104px)',
                aspectRatio: '400 / 512',
                transformStyle: 'preserve-3d',
                willChange: 'transform',
              }}
            >
              <img
                src="/brand/lumo-b-mark.png"
                alt=""
                draggable={false}
                style={{ backfaceVisibility: 'visible', WebkitBackfaceVisibility: 'visible' }}
                className="w-full h-full object-contain block select-none"
              />
            </div>
          </div>

          {/* Skip Button — pinned bottom-right of sticky stage, left of the fixed QR button */}
          <button
            type="button"
            data-testid="service-chapters-skip-btn"
            aria-label="Skip to next section"
            onClick={handleSkipClick}
            style={{
              backgroundColor: activePalette.frostBg,
              borderColor: activePalette.cardBorder,
              color: activePalette.text,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
            className="absolute bottom-6 right-24 z-30 rounded-full border px-4 py-2 text-xs font-bold cursor-pointer transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          >
            Skip ↓
          </button>
        </div>
      </div>
    </section>
  );
}
