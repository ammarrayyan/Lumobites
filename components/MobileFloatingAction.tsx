'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface MobileFloatingActionProps {
  children: React.ReactNode;
  bottomOffset?: string;
  topThreshold?: number;
}

export default function MobileFloatingAction({ 
  children, 
  bottomOffset = '88px',
  topThreshold = 100
}: MobileFloatingActionProps) {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setMounted(true);

    const checkScroll = () => {
      if (typeof window !== 'undefined') {
        const scrolledAway = window.scrollY > topThreshold;
        setIsVisible(scrolledAway);
      }
    };

    // Check initial scroll position
    checkScroll();

    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', checkScroll);
    };
  }, [topThreshold]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`md:hidden select-none transition-all duration-300 ease-out transform ${
        isVisible 
          ? 'opacity-100 translate-y-0 pointer-events-auto scale-100' 
          : 'opacity-0 translate-y-4 pointer-events-none scale-95'
      }`}
      style={{
        position: 'fixed',
        bottom: bottomOffset,
        right: '16px',
        zIndex: 9990,
      }}
      aria-hidden={!isVisible}
    >
      {children}
    </div>,
    document.body
  );
}
