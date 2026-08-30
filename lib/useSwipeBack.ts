'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export interface SwipeBackOptions {
  onBack?: () => void;
  fallbackUrl?: string;
  edgeThreshold?: number; // Distance in px from left edge to initiate swipe (default 50px)
  minDistance?: number;   // Minimum horizontal swipe distance to trigger back (default 70px)
  maxVertical?: number;   // Maximum allowed vertical deflection (default 50px)
  enabled?: boolean;
}

export function useSwipeBack(options: SwipeBackOptions = {}) {
  const router = useRouter();
  const {
    onBack,
    fallbackUrl,
    edgeThreshold = 50,
    minDistance = 70,
    maxVertical = 50,
    enabled = true
  } = options;

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;

      // Only initiate gesture if touch starts within edgeThreshold from the left screen edge
      if (x <= edgeThreshold) {
        touchStartXRef.current = x;
        touchStartYRef.current = y;
      } else {
        touchStartXRef.current = null;
        touchStartYRef.current = null;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartXRef.current === null || touchStartYRef.current === null) return;
      if (e.changedTouches.length === 0) return;

      const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
      const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartYRef.current);

      // Trigger back action if swipe moved right past minDistance with minimal vertical displacement
      if (deltaX > minDistance && deltaY < maxVertical) {
        if (onBack) {
          onBack();
        } else if (window.history.length > 1) {
          router.back();
        } else if (fallbackUrl) {
          router.push(fallbackUrl);
        }
      }

      touchStartXRef.current = null;
      touchStartYRef.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, onBack, fallbackUrl, edgeThreshold, minDistance, maxVertical, router]);
}
