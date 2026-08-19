'use client';

import React, { useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const SECTION_ROUTES = [
  '/',
  '/petsitting',
  '/lost-pets',
  '/chat',
  '/city-board',
  '/explore',
];

interface SectionSwipeProviderProps {
  children: React.ReactNode;
}

export default function SectionSwipeProvider({ children }: SectionSwipeProviderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number | null>(null);

  // Match root section route exactly
  const currentSectionIdx = SECTION_ROUTES.findIndex(route => route === pathname);
  const isRootSectionPage = currentSectionIdx !== -1;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isRootSectionPage) return;
    if (e.touches.length > 1) return; // Ignore multi-finger gestures

    const target = e.target as HTMLElement | null;
    if (target && target.closest('input, textarea, select, [data-no-swipe="true"]')) {
      return;
    }

    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchStartTimeRef.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (
      !isRootSectionPage ||
      touchStartXRef.current === null ||
      touchStartYRef.current === null ||
      touchStartTimeRef.current === null
    ) {
      return;
    }

    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartYRef.current);
    const duration = Date.now() - touchStartTimeRef.current;

    const startX = touchStartXRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchStartTimeRef.current = null;

    // Strict validation: horizontal movement >= 80px, vertical movement <= 45px, duration <= 450ms
    if (Math.abs(deltaX) >= 80 && deltaY <= 45 && duration <= 450) {
      // Don't trigger if starting right at the very left edge (x < 30px) to preserve edge swipe gestures if any
      if (startX < 30) return;

      if (deltaX < 0) {
        // Swiped Left -> Go to Next Tab
        if (currentSectionIdx < SECTION_ROUTES.length - 1) {
          const nextRoute = SECTION_ROUTES[currentSectionIdx + 1];
          if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            try { navigator.vibrate(10); } catch (e) {}
          }
          router.push(nextRoute);
        }
      } else {
        // Swiped Right -> Go to Previous Tab
        if (currentSectionIdx > 0) {
          const prevRoute = SECTION_ROUTES[currentSectionIdx - 1];
          if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            try { navigator.vibrate(10); } catch (e) {}
          }
          router.push(prevRoute);
        }
      }
    }
  };

  return (
    <div
      className="w-full min-h-screen flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}
