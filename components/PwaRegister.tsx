'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Inside native Capacitor app wrapper, bypass service worker completely
    // to prevent WKWebView network process stalls and hung RSC router fetches on app resume
    const isNative = (window as any).Capacitor?.isNativePlatform?.() === true;
    if (isNative) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().catch(() => {});
        }
      }).catch(() => {});
      return;
    }

    const handleRegister = () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('PWA Service Worker successfully registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('PWA Service Worker registration failed:', error);
        });
    };

    // Register after page load to prevent blocking dynamic bundles
    if (document.readyState === 'complete') {
      handleRegister();
    } else {
      window.addEventListener('load', handleRegister);
      return () => window.removeEventListener('load', handleRegister);
    }
  }, []);

  return null;
}
