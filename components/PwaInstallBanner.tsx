'use client';

import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export default function PwaInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // 1. SSR check
    if (typeof window === 'undefined') return;

    // Check if running as native app
    const isNativeApp = Capacitor.isNativePlatform();
    if (isNativeApp) return;

    // 2. Check if dismissed previously
    const isDismissed = localStorage.getItem('lumo_pwa_dismissed') === 'true';
    if (isDismissed) return;

    // 3. Check if already running in standalone PWA mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (navigator as any).standalone === true;
    if (isStandalone) return;

    // 4. Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const detectIos = /iphone|ipad|ipod/.test(userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIos(detectIos);

    // 5. Handle Android / Chrome beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    if (detectIos) {
      // iOS doesn't support beforeinstallprompt, so we display the banner directly on first visit
      setShowBanner(true);
    } else {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('lumo_pwa_dismissed', 'true');
    setShowBanner(false);
    setShowIosGuide(false);
  };

  const handleAddClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA Installation outcome: ${outcome}`);
      setDeferredPrompt(null);
      setShowBanner(false);
    } else {
      // Fallback fallback: show iOS-like manual installation guide for other browsers
      setShowIosGuide(true);
    }
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Floating Bottom Installation Banner */}
      <div className="fixed bottom-[96px] md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[420px] bg-[#FDFAF7] border border-[#E8DDD4] rounded-2xl p-4 shadow-2xl z-[9999] animate-[slideUp_0.4s_ease-out] font-sans">
        <div className="flex items-center gap-3">
          {/* Logo Icon */}
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-[#E8DDD4] flex-shrink-0 flex items-center justify-center p-1">
            <img src="/lumo-bites-logo.png" alt="Lumo Bites" className="w-full h-full object-contain" />
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-[14px] font-bold text-[#191919] leading-tight">Lumo Bites PWA</h4>
            <p className="text-[12px] text-[#666666] leading-relaxed mt-0.5">
              Add Lumo Bites to your home screen
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleAddClick}
              className="bg-[#8B5E3C] hover:bg-[#724C2F] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
            >
              Add
            </button>
            
            {/* Small X to Dismiss */}
            <button
              onClick={handleDismiss}
              className="w-8 h-8 rounded-full hover:bg-[#F5EDE4] text-[#888888] hover:text-[#191919] transition-all flex items-center justify-center cursor-pointer text-sm font-bold"
              aria-label="Dismiss banner"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* iOS Manual Installation Steps Guide */}
      {showIosGuide && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[10000] flex items-end md:items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div 
            className="w-full max-w-[400px] bg-[#FDFAF7] border border-[#E8DDD4] rounded-3xl p-6 pb-28 md:pb-6 shadow-2xl relative font-sans animate-[scaleIn_0.25s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Cross */}
            <button
              onClick={() => setShowIosGuide(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-[#F5EDE4] text-[#888888] hover:text-[#191919] transition-all flex items-center justify-center cursor-pointer font-bold"
            >
              ✕
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border border-[#E8DDD4] mx-auto mb-3 flex items-center justify-center p-2 shadow-sm">
                <img src="/lumo-bites-logo.png" alt="Lumo Bites" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-[18px] font-extrabold text-[#191919]">Install Lumo Bites</h3>
              <p className="text-xs text-[#666666] mt-1">Get free pet food safety tools on your phone</p>
            </div>

            {/* Instruction Steps */}
            <div className="space-y-4 text-[#444444] text-[14px]">
              <div className="flex gap-3.5 items-start">
                <span className="w-6 h-6 rounded-full bg-[#8B5E3C]/10 text-[#8B5E3C] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <div>
                  Tap the Safari <span className="font-bold">Share</span> button at the bottom of your screen.
                  <div className="mt-2 flex justify-center bg-white border border-[#E8DDD4] rounded-xl p-2.5 w-max">
                    <svg className="w-6 h-6 text-[#007AFF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                      <path d="M17 7l-5-5-5 5" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <span className="w-6 h-6 rounded-full bg-[#8B5E3C]/10 text-[#8B5E3C] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <div>
                  Scroll down the action list and select <span className="font-bold">&ldquo;Add to Home Screen&rdquo;</span>.
                  <div className="mt-2 flex justify-center bg-white border border-[#E8DDD4] rounded-xl p-2.5 w-max">
                    <svg className="w-6 h-6 text-[#191919]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <span className="w-6 h-6 rounded-full bg-[#8B5E3C]/10 text-[#8B5E3C] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <div>
                  Tap <span className="font-bold text-[#8B5E3C]">Add</span> in the top-right corner to complete!
                </div>
              </div>
            </div>

            {/* CTA action */}
            <div className="mt-6 pt-4 border-t border-[#F0E6DD]">
              <button
                onClick={() => setShowIosGuide(false)}
                className="w-full bg-[#8B5E3C] hover:bg-[#724C2F] text-white font-bold text-sm h-12 rounded-xl transition-all cursor-pointer active:scale-[0.98] shadow-md"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded PWA Animations in Global CSS scope */}
      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.92);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
