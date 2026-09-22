'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

interface ScrollToTopButtonProps {
  threshold?: number;
  inline?: boolean;
  className?: string;
}

export default function ScrollToTopButton({
  threshold = 300,
  inline = false,
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

  if (!visible && !inline) return null;

  if (inline) {
    return (
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={`pressable flex items-center gap-1.5 bg-[#4A3E3D] hover:bg-[#3A302F] text-white font-bold text-xs py-3 px-3.5 rounded-full shadow-xl border border-white/25 active:scale-95 transition-transform select-none cursor-pointer ${className}`}
      >
        <ArrowUp className="w-4 h-4 text-white" strokeWidth={2.5} />
        <span>Top</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`hidden md:flex fixed z-[9990] right-8 bottom-8 bg-[#4A3E3D] hover:bg-[#3A302F] text-white font-bold text-xs py-3 px-4 rounded-full shadow-xl border border-white/25 items-center gap-1.5 transition-all duration-300 transform active:scale-95 animate-fade-in cursor-pointer select-none ${className}`}
    >
      <ArrowUp className="w-4 h-4 text-white" strokeWidth={2.5} />
      <span>Top</span>
    </button>
  );
}

