'use client';

import React, { useState, useEffect } from 'react';

export default function PwaSplashScreen() {
  const [showSplash, setShowSplash] = useState(false);
  const [fadeAway, setFadeAway] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running in standalone mode (installed app)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (navigator as any).standalone === true;

    // Check if already shown in the current app session
    const isSplashShown = sessionStorage.getItem('lumo_splash_shown') === 'true';

    if (isStandalone && !isSplashShown) {
      setShowSplash(true);

      // Trigger fade out after 1.5 seconds
      const fadeTimer = setTimeout(() => {
        setFadeAway(true);
      }, 1500);

      // Fully unmount from DOM after 2.0 seconds (allowing fade transition)
      const removeTimer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem('lumo_splash_shown', 'true');
      }, 2000);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, []);

  if (!showSplash) return null;

  return (
    <div 
      className={`fixed inset-0 bg-[#FDFAF7] z-[99999] flex flex-col items-center justify-center transition-all duration-500 ease-in-out ${
        fadeAway ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100 scale-100'
      }`}
    >
      <div className="flex flex-col items-center animate-[pulseAndScale_1.8s_infinite_ease-in-out]">
        {/* Centered Lumo Bites Brand Logo */}
        <div className="w-[180px] h-[180px] flex items-center justify-center p-3 relative">
          <img 
            src="/Logo.png" 
            alt="Lumo Bites Logo" 
            className="w-full h-auto object-contain" 
          />
          {/* TM Symbol */}
          <sup className="text-[11px] color-[#8B5E3C] font-extrabold absolute top-2 right-1 select-none">™</sup>
        </div>

        {/* Small Elegant Loader */}
        <div className="mt-8 flex flex-col items-center">
          <div className="w-10 h-10 border-[3.5px] border-[#8B5E3C]/20 border-t-[#8B5E3C] rounded-full animate-spin"></div>
          <span className="text-[12px] font-bold text-[#8B5E3C] uppercase tracking-widest mt-4 opacity-75">
            Lumo Bites
          </span>
        </div>
      </div>

      {/* Splash Specific CSS Animations in Global CSS scope */}
      <style jsx global>{`
        @keyframes pulseAndScale {
          0%, 100% {
            transform: scale(0.97);
            opacity: 0.95;
          }
          50% {
            transform: scale(1.03);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
