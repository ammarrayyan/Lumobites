'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, PawPrint, MapPin, Utensils, Users } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isFoodActive = pathname === '/chat' || pathname === '/scan' || pathname === '/supplies';
  const isCommunityActive = pathname === '/city-board' || pathname === '/twin' || pathname.startsWith('/adoption');

  const tabs = [
    { label: 'Sitting', icon: PawPrint, href: '/petsitting', isActive: pathname === '/petsitting' },
    { label: 'Lost Pets', icon: MapPin, href: '/lost-pets', isActive: pathname === '/lost-pets' },
    { label: 'Home', icon: Home, href: '/', isActive: pathname === '/', isRaised: true },
    { label: 'Community', icon: Users, href: '/city-board', isActive: isCommunityActive },
    { label: 'Pet Food', icon: Utensils, href: '/chat', isActive: isFoodActive },
  ];

  const currentActiveIndex = tabs.findIndex(tab => tab.isActive);
  const [tappedIndex, setTappedIndex] = useState<number | null>(null);

  // Synchronize tapped index back to null when pathname updates
  useEffect(() => {
    setTappedIndex(null);
  }, [pathname]);

  // Proactively prefetch all bottom nav tabs in the background when idle so switching is instantaneous
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefetchAll = () => {
      tabs.forEach(tab => {
        if (tab.href && tab.href !== pathname) {
          router.prefetch(tab.href);
        }
      });
    };

    if ('requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(prefetchAll, { timeout: 2000 });
      return () => (window as any).cancelIdleCallback(handle);
    } else {
      const timer = setTimeout(prefetchAll, 600);
      return () => clearTimeout(timer);
    }
  }, [router, pathname]);

  const activeIndex = tappedIndex !== null ? tappedIndex : (currentActiveIndex >= 0 ? currentActiveIndex : 2);
  const isRaisedActive = activeIndex >= 0 && tabs[activeIndex]?.isRaised;

  return (
    <div 
      className="lg:hidden px-1.5 flex items-center justify-between w-[calc(100%-20px)] max-w-[430px] h-[68px] relative select-none"
      style={{
        position: 'fixed',
        bottom: '16px',
        left: 0,
        right: 0,
        marginLeft: 'auto',
        marginRight: 'auto',
        transform: 'translate3d(0, 0, 0)',
        WebkitTransform: 'translate3d(0, 0, 0)',
        willChange: 'transform',
        zIndex: 9999,
        backgroundColor: '#FFFFFF',
        borderRadius: '36px',
        border: '1px solid #E8DDD4',
        pointerEvents: 'auto',
      }}
    >
      {/* Crisp Flat Active Pill */}
      {activeIndex >= 0 && !isRaisedActive && (
        <div 
          className="absolute pointer-events-none transition-all duration-250 ease-out"
          style={{
            top: '5px',
            bottom: '5px',
            width: `calc(${100 / tabs.length}% + 4px)`,
            left: `calc(${activeIndex * (100 / tabs.length)}% - 2px)`,
            borderRadius: '24px',
            backgroundColor: '#F7F3EE',
            border: '1px solid #E8DDD4',
            zIndex: 1,
          }}
        />
      )}

      {tabs.map((tab, idx) => {
        const Icon = tab.icon;
        const isActive = activeIndex === idx;

        if (tab.isRaised) {
          return (
            <Link
              key={tab.label}
              href={tab.href}
              prefetch={true}
              onClick={() => setTappedIndex(idx)}
              onTouchStart={() => {
                setTappedIndex(idx);
                router.prefetch(tab.href);
              }}
              onMouseEnter={() => router.prefetch(tab.href)}
              className="relative flex flex-col items-center justify-center h-full flex-1 cursor-pointer select-none group z-20"
              style={{ textDecoration: 'none' }}
              aria-label="Home"
            >
              {/* Elevated Flat Circular Button */}
              <div 
                className="w-[50px] h-[50px] rounded-full flex items-center justify-center transition-all duration-200 group-active:scale-90"
                style={{
                  transform: 'translateY(-14px)',
                  background: isActive ? '#8B5E3C' : '#FAF5EE',
                  border: isActive ? '3px solid #FFFFFF' : '2px solid #E8DDD4',
                }}
              >
                <Icon
                  className="w-[23px] h-[23px] transition-all duration-200"
                  style={{
                    color: isActive ? '#FFFFFF' : '#8B5E3C',
                    fill: isActive ? 'currentColor' : 'none',
                    strokeWidth: isActive ? 2.5 : 2,
                  }}
                />
              </div>

              {/* Label */}
              <span
                className="text-[11px] sm:text-[11.5px] tracking-tight select-none transition-all duration-200"
                style={{
                  marginTop: '-11px',
                  color: isActive ? '#5C381E' : '#4A3E3D',
                  fontWeight: isActive ? 900 : 700,
                  transform: isActive ? 'scale(1.04)' : 'scale(1)',
                }}
              >
                {tab.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={tab.label}
            href={tab.href}
            prefetch={true}
            onClick={() => setTappedIndex(idx)}
            onTouchStart={() => {
              setTappedIndex(idx);
              router.prefetch(tab.href);
            }}
            onMouseEnter={() => router.prefetch(tab.href)}
            className="relative flex flex-col items-center justify-center h-full flex-1 cursor-pointer gap-1 group active:scale-90 transition-transform duration-150 select-none z-10"
            style={{ textDecoration: 'none' }}
          >
            {/* Icon with Solid Black & Bold Treatment for Active */}
            <Icon
              className="w-[20px] h-[20px] relative z-10 transition-all duration-300 ease-out"
              style={{
                color: isActive ? '#000000' : '#4A3E3D',
                fill: isActive ? 'currentColor' : 'none',
                transform: isActive ? 'scale(1.1) translateY(-1px)' : 'scale(1)',
                strokeWidth: isActive ? 2.5 : 2,
              }}
            />

            {/* Label */}
            <span
              className="text-[11px] sm:text-[11.5px] tracking-tight select-none relative z-10 transition-all duration-300 ease-out truncate max-w-full px-0.5"
              style={{
                color: isActive ? '#000000' : '#4A3E3D',
                fontWeight: isActive ? 900 : 700,
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

