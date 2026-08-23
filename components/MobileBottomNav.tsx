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
        backgroundColor: 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        boxShadow: '0 12px 36px -4px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.75)',
        borderRadius: '36px',
        border: '1px solid rgba(255, 255, 255, 0.55)',
        pointerEvents: 'auto',
      }}
    >
      {/* 🫧 WhatsApp-Style Liquid Glass Active Droplet Lens */}
      {activeIndex >= 0 && (
        <div 
          className="absolute pointer-events-none transition-all duration-350 ease-[cubic-bezier(0.34,1.45,0.64,1)]"
          style={{
            top: '-6px',
            bottom: '-6px',
            width: `calc(${100 / tabs.length}% + 14px)`,
            left: `calc(${activeIndex * (100 / tabs.length)}% - 7px)`,
            borderRadius: '9999px',
            zIndex: 1,
          }}
        >
          {/* 1. Chromatic / Prismatic Aberration Rainbow Glow along Top & Bottom Curvatures */}
          <div 
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              padding: '2px',
              background: `
                radial-gradient(ellipse at 50% 0%, rgba(255, 75, 130, 0.9) 0%, rgba(255, 200, 60, 0.8) 30%, rgba(0, 220, 255, 0.85) 65%, transparent 85%),
                radial-gradient(ellipse at 50% 100%, rgba(0, 230, 240, 0.85) 0%, rgba(160, 100, 255, 0.85) 40%, rgba(255, 80, 150, 0.8) 75%, transparent 90%),
                conic-gradient(from 180deg at 50% 50%, rgba(255, 80, 140, 0.7), rgba(255, 185, 60, 0.7), rgba(50, 225, 240, 0.8), rgba(150, 100, 255, 0.75), rgba(255, 80, 140, 0.7))
              `,
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              filter: 'blur(0.4px)',
              opacity: 0.92,
            }}
          />

          {/* 2. Frosted Liquid Glass Core with Multi-layered Depth & Caustics */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.42)',
              backdropFilter: 'blur(20px) saturate(200%)',
              WebkitBackdropFilter: 'blur(20px) saturate(200%)',
              boxShadow: `
                0 10px 28px -2px rgba(0, 0, 0, 0.15),
                0 4px 10px rgba(0, 0, 0, 0.06),
                inset 0 1.5px 2px rgba(255, 255, 255, 0.95),
                inset 0 -2px 3px rgba(0, 0, 0, 0.05)
              `,
              border: '0.5px solid rgba(255, 255, 255, 0.65)',
            }}
          />

          {/* 3. Top Curved Specular Glare / Lens Reflection */}
          <div 
            className="absolute top-0.5 left-2.5 right-2.5 h-[42%] rounded-t-full pointer-events-none opacity-90"
            style={{
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 255, 255, 0.2) 65%, transparent 100%)',
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
            {/* Icon with Solid Black & Bold Treatment for Active */}
            <Icon
              className="w-[20px] h-[20px] relative z-10 transition-all duration-300 ease-out"
              style={{
                color: isActive ? '#000000' : '#8E8E93',
                fill: isActive ? 'currentColor' : 'none',
                transform: isActive ? 'scale(1.12) translateY(-1px)' : 'scale(1)',
                strokeWidth: isActive ? 2.5 : 1.8,
              }}
            />

            {/* Label */}
            <span
              className="text-[9.5px] tracking-tight select-none relative z-10 transition-all duration-300 ease-out"
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

