'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, PawPrint, MapPin, Utensils, Users, Globe } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isFoodActive = pathname === '/chat' || pathname === '/scan' || pathname === '/supplies' || pathname === '/recalls';
  const isCommunityActive = pathname === '/city-board' || pathname === '/twin' || pathname.startsWith('/adoption');

  const tabs = [
    { label: 'Home', icon: Home, href: '/', isActive: pathname === '/' },
    { label: 'Sitting', icon: PawPrint, href: '/petsitting', isActive: pathname === '/petsitting' },
    { label: 'Lost Pets', icon: MapPin, href: '/lost-pets', isActive: pathname === '/lost-pets' },
    { label: 'Pet Food', icon: Utensils, href: '/chat', isActive: isFoodActive },
    { label: 'Community', icon: Users, href: '/city-board', isActive: isCommunityActive },
    { label: 'Explore', icon: Globe, href: '/explore', isActive: pathname === '/explore' },
  ];

  const currentActiveIndex = tabs.findIndex(tab => tab.isActive);
  const [tappedIndex, setTappedIndex] = useState<number | null>(null);

  // Synchronize tapped index back to null when pathname updates
  useEffect(() => {
    setTappedIndex(null);
  }, [pathname]);

  const activeIndex = tappedIndex !== null ? tappedIndex : (currentActiveIndex >= 0 ? currentActiveIndex : 0);

  return (
    <div 
      className="lg:hidden px-1.5 flex items-center justify-between w-[calc(100%-24px)] max-w-[430px] h-[66px] relative select-none"
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
        backgroundColor: 'rgba(255, 255, 255, 0.68)',
        backdropFilter: 'blur(28px) saturate(190%)',
        WebkitBackdropFilter: 'blur(28px) saturate(190%)',
        boxShadow: '0 14px 40px -4px rgba(0, 0, 0, 0.09), 0 4px 12px rgba(0, 0, 0, 0.03), inset 0 1px 1.5px rgba(255, 255, 255, 0.85)',
        borderRadius: '38px',
        border: '1px solid rgba(255, 255, 255, 0.7)',
        pointerEvents: 'auto',
      }}
    >
      {/* 🫧 WhatsApp-Style Liquid Glass Active Droplet Bubble */}
      {activeIndex >= 0 && (
        <div 
          className="absolute pointer-events-none transition-all duration-350 ease-[cubic-bezier(0.34,1.48,0.64,1)]"
          style={{
            top: '-5px',
            bottom: '-5px',
            width: `calc(${100 / tabs.length}% + 12px)`,
            left: `calc(${activeIndex * (100 / tabs.length)}% - 6px)`,
            borderRadius: '9999px',
            zIndex: 0,
          }}
        >
          {/* Iridescent / Chromatic Aberration Refraction Edge */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              padding: '1.5px',
              background: 'linear-gradient(135deg, rgba(255, 80, 140, 0.85) 0%, rgba(255, 180, 50, 0.8) 25%, rgba(60, 220, 230, 0.9) 50%, rgba(140, 110, 255, 0.85) 75%, rgba(255, 80, 160, 0.85) 100%)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              filter: 'blur(0.35px)',
              opacity: 0.85,
            }}
          />

          {/* Frosted Glass Droplet Core with Specular Inner Glow */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.52)',
              backdropFilter: 'blur(16px) saturate(180%)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
              boxShadow: '0 10px 24px -2px rgba(0, 0, 0, 0.12), 0 3px 8px rgba(0, 0, 0, 0.04), inset 0 1.5px 2px rgba(255, 255, 255, 0.95), inset 0 -1.5px 2px rgba(0, 0, 0, 0.03)',
            }}
          />

          {/* Top Specular Arc Reflection */}
          <div 
            className="absolute top-0.5 left-2 right-2 h-[45%] rounded-t-full pointer-events-none opacity-80"
            style={{
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.1) 70%, transparent 100%)',
            }}
          />
        </div>
      )}

      {tabs.map((tab, idx) => {
        const Icon = tab.icon;
        const isActive = activeIndex === idx;

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
            className="relative flex flex-col items-center justify-center h-full flex-1 cursor-pointer gap-0.5 group active:scale-90 transition-transform duration-150 select-none"
            style={{ textDecoration: 'none' }}
          >
            {/* Icon with Scale & Spring Movement */}
            <Icon
              className="w-[21px] h-[21px] relative z-10 transition-all duration-300 ease-out"
              style={{
                color: isActive ? '#0A0A0A' : '#78716C',
                fill: isActive ? 'currentColor' : 'none',
                transform: isActive ? 'scale(1.14) translateY(-1px)' : 'scale(1)',
                strokeWidth: isActive ? 2.5 : 1.8,
              }}
            />

            {/* Label */}
            <span
              className="text-[9.5px] tracking-tight select-none relative z-10 transition-all duration-300 ease-out"
              style={{
                color: isActive ? '#0A0A0A' : '#78716C',
                fontWeight: isActive ? 800 : 600,
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

