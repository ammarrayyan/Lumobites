'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

interface ScrollToTopButtonProps {
  threshold?: number;
  bottomOffset?: string;
  className?: string;
}

export default function ScrollToTopButton({
  threshold = 300,
  bottomOffset,
  className = '',
}: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        setVisible(window.scrollY > threshold);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`fixed z-[9990] right-4 md:right-8 bg-[#8B5E3C] hover:bg-[#734A2E] text-white w-10 h-10 md:w-11 md:h-11 rounded-full shadow-lg border border-[#E8DDD4] flex items-center justify-center transition-all duration-300 transform active:scale-90 animate-fade-in cursor-pointer select-none ${
        bottomOffset ? '' : 'bottom-[146px] md:bottom-8'
      } ${className}`}
      style={bottomOffset ? { bottom: bottomOffset } : {}}
    >
      <ArrowUp className="w-5 h-5 text-white" strokeWidth={2.5} />
    </button>
  );
}
