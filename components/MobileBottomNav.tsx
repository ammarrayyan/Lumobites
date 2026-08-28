'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, PawPrint, MapPin, Utensils, Users, Globe } from 'lucide-react';

// Paw-in-ID-card icon for Pet Profiles matching Lucide icon styling
function PetProfileIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke={style?.color || 'currentColor'}
      strokeWidth={style?.strokeWidth || 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ ...style, fill: 'none' }}
    >
      {/* ID Badge Card Outline */}
      <rect width="18" height="18" x="3" y="3" rx="4" fill="none" />
      {/* ID Lanyard Slot */}
      <line x1="9.5" x2="14.5" y1="6" y2="6" strokeWidth={2} />
      {/* Paw Print Inside ID Badge */}
      <circle cx="9.5" cy="11.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="11.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="8" cy="14" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="16" cy="14" r="0.9" fill="currentColor" stroke="none" />
      <path
        d="M12 17.5c-1.5 0-2.5-.8-2.5-1.7 0-.6.5-1 1.2-1 .6 0 .8.4 1.3.4s.7-.4 1.3-.4c.7 0 1.2.4 1.2 1 0 .9-1 1.7-2.5 1.7z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isFoodActive = pathname === '/chat' || pathname === '/scan' || pathname === '/supplies' || pathname === '/recalls';
  const isCommunityActive = pathname === '/city-board' || pathname === '/twin' || pathname.startsWith('/adoption');
  const isPetsActive = pathname === '/account' || pathname === '/pet-access' || pathname.startsWith('/pets/');

  const tabs = [
    { label: 'Sitting', icon: PawPrint, href: '/petsitting', isActive: pathname === '/petsitting' },
    { label: 'Lost Pets', icon: MapPin, href: '/lost-pets', isActive: pathname === '/lost-pets' },
    { label: 'My Pets', icon: PetProfileIcon, href: '/account?tab=pets', isActive: isPetsActive },
    { label: 'Home', icon: Home, href: '/', isActive: pathname === '/', isRaised: true },
    { label: 'Community', icon: Users, href: '/city-board', isActive: isCommunityActive },
    { label: 'Pet Food', icon: Utensils, href: '/chat', isActive: isFoodActive },
    { label: 'Explore', icon: Globe, href: '/explore', isActive: pathname === '/explore' },
  ];

  const currentActiveIndex = tabs.findIndex(tab => tab.isActive);
  const [tappedIndex, setTappedIndex] = useState<number | null>(null);

  // Synchronize tapped index back to null when pathname updates
  useEffect(() => {
    setTappedIndex(null);
  }, [pathname]);

  const activeIndex = tappedIndex !== null ? tappedIndex : (currentActiveIndex >= 0 ? currentActiveIndex : 3);
  const isRaisedActive = activeIndex >= 0 && tabs[activeIndex]?.isRaised;

  return (
    <div 
      className="lg:hidden px-1 flex items-center justify-between w-[calc(100%-20px)] max-w-[430px] h-[66px] relative select-none"
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
        backgroundColor: 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        boxShadow: '0 12px 36px -4px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.75)',
        borderRadius: '36px',
        border: '1px solid rgba(255, 255, 255, 0.65)',
        pointerEvents: 'auto',
      }}
    >
      {/* 🫧 WhatsApp-Style Liquid Glass Rounded Rectangle Active Pill (For Flat Items) */}
      {activeIndex >= 0 && !isRaisedActive && (
        <div 
          className="absolute pointer-events-none transition-all duration-350 ease-[cubic-bezier(0.34,1.45,0.64,1)]"
          style={{
            top: '4px',
            bottom: '4px',
            width: `calc(${100 / tabs.length}% + 4px)`,
            left: `calc(${activeIndex * (100 / tabs.length)}% - 2px)`,
            borderRadius: '24px',
            zIndex: 1,
          }}
        >
          {/* 1. Subtle Pastel Shimmer / Iridescent Prismatic Fringe */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: '24px',
              padding: '1.5px',
              background: `
                radial-gradient(ellipse at 50% 0%, rgba(255, 120, 160, 0.45) 0%, rgba(255, 195, 110, 0.40) 30%, rgba(100, 220, 245, 0.45) 65%, transparent 85%),
                radial-gradient(ellipse at 50% 100%, rgba(100, 220, 245, 0.45) 0%, rgba(185, 145, 250, 0.40) 40%, rgba(255, 130, 170, 0.40) 75%, transparent 90%),
                conic-gradient(from 180deg at 50% 50%, rgba(255, 130, 170, 0.35) 0%, rgba(255, 195, 110, 0.35) 25%, rgba(100, 220, 245, 0.40) 50%, rgba(185, 145, 250, 0.35) 75%, rgba(255, 130, 170, 0.35) 100%)
              `,
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              filter: 'blur(0.3px)',
              opacity: 0.55,
            }}
          />

          {/* 2. Frosted Liquid Glass Core with Caustic Bevel & Depth */}
          <div 
            className="absolute inset-0"
            style={{
              borderRadius: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.52)',
              backdropFilter: 'blur(20px) saturate(200%)',
              WebkitBackdropFilter: 'blur(20px) saturate(200%)',
              boxShadow: `
                0 8px 24px -2px rgba(0, 0, 0, 0.16),
                0 3px 8px rgba(0, 0, 0, 0.08),
                inset 0 1.5px 2px rgba(255, 255, 255, 0.95),
                inset 0 -1.5px 2px rgba(0, 0, 0, 0.06)
              `,
              border: '0.5px solid rgba(255, 255, 255, 0.65)',
            }}
          />

          {/* 3. Top Curved Specular Glare / Lens Reflection */}
          <div 
            className="absolute top-0.5 left-1.5 right-1.5 h-[40%] pointer-events-none opacity-90"
            style={{
              borderRadius: '22px 22px 10px 10px',
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.25) 60%, transparent 100%)',
            }}
          />
        </div>
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
              {/* Elevated Floating Circular Button */}
              <div 
                className="w-[50px] h-[50px] rounded-full flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.34,1.45,0.64,1)] group-active:scale-90"
                style={{
                  transform: 'translateY(-14px)',
                  background: isActive
                    ? 'linear-gradient(135deg, #9C6C48 0%, #8B5E3C 50%, #744A29 100%)'
                    : 'linear-gradient(135deg, #FFFFFF 0%, #FAF5EE 100%)',
                  boxShadow: isActive
                    ? '0 12px 28px -2px rgba(139, 94, 60, 0.50), 0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1.5px 2px rgba(255, 255, 255, 0.40)'
                    : '0 8px 20px -2px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.05), inset 0 1.5px 2px rgba(255, 255, 255, 0.90)',
                  border: isActive
                    ? '3px solid #FFFFFF'
                    : '2.5px solid rgba(255, 255, 255, 0.95)',
                }}
              >
                <Icon
                  className="w-[23px] h-[23px] transition-all duration-300"
                  style={{
                    color: isActive ? '#FFFFFF' : '#8B5E3C',
                    fill: isActive ? 'currentColor' : 'none',
                    strokeWidth: isActive ? 2.5 : 2,
                    filter: isActive ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))' : 'none',
                  }}
                />
              </div>

              {/* Label */}
              <span
                className="text-[8.5px] tracking-tight select-none transition-all duration-300"
                style={{
                  marginTop: '-11px',
                  color: isActive ? '#8B5E3C' : '#8E8E93',
                  fontWeight: isActive ? 800 : 600,
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
            className="relative flex flex-col items-center justify-center h-full flex-1 cursor-pointer gap-0.5 group active:scale-90 transition-transform duration-150 select-none z-10"
            style={{ textDecoration: 'none' }}
          >
            {/* Icon with Solid Black & Bold Treatment for Active */}
            <Icon
              className="w-[18px] h-[18px] relative z-10 transition-all duration-300 ease-out"
              style={{
                color: isActive ? '#000000' : '#8E8E93',
                fill: isActive ? 'currentColor' : 'none',
                transform: isActive ? 'scale(1.12) translateY(-1px)' : 'scale(1)',
                strokeWidth: isActive ? 2.5 : 1.8,
              }}
            />

            {/* Label */}
            <span
              className="text-[8.5px] sm:text-[9px] tracking-tight select-none relative z-10 transition-all duration-300 ease-out truncate max-w-full px-0.5"
              style={{
                color: isActive ? '#000000' : '#8E8E93',
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

