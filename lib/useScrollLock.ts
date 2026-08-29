'use client';

import { useEffect } from 'react';

let lockCount = 0;
let originalOverflow = '';
let originalPaddingRight = '';

/**
 * Universal React hook to lock background page scrolling while a modal/sheet/popup is open.
 * Supports reference counting so stacked modals (e.g. Add Pet inside Request Sitter)
 * maintain the background lock until ALL modals are closed.
 */
export function useScrollLock(isLocked: boolean = true) {
  useEffect(() => {
    if (!isLocked || typeof window === 'undefined') return;

    if (lockCount === 0) {
      originalOverflow = document.body.style.overflow;
      originalPaddingRight = document.body.style.paddingRight;

      // Compensate for scrollbar width to prevent horizontal layout shift on desktop
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-scroll-locked');
    }
    lockCount++;

    return () => {
      lockCount--;
      if (lockCount <= 0) {
        lockCount = 0;
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
        document.body.classList.remove('modal-scroll-locked');
      }
    };
  }, [isLocked]);
}
