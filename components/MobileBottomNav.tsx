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
        bottom: '14px',
        left: 0,
        right: 0,
        marginLeft: 'auto',
        marginRight: 'auto',
        transform: 'translate3d(0, 0, 0)',
        WebkitTransform: 'translate3d(0, 0, 0)',
        willChange: 'transform',
        zIndex: 9999,
        background: `
          repeating-linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.04) 0px,
            rgba(255, 255, 255, 0.04) 1px,
            rgba(0, 0, 0, 0.03) 1px,
            rgba(0, 0, 0, 0.03) 2px
          ),
          linear-gradient(
            135deg,
            #8E9AA8 0%,
            #D4DCDE 12%,
            #A2AEBC 24%,
            #F0F4F8 36%,
            #FFFFFF 42%,
            #8592A0 50%,
            #B8C4CE 62%,
            #6E7B8A 74%,
            #E2E8F0 86%,
            #9AA6B4 100%
          )
        `,
        boxShadow: 'inset 0 1.5px 0.5px #FFFFFF, inset 0 -2px 1.5px rgba(30, 41, 59, 0.7), inset 0 0 0 1px rgba(255, 255, 255, 0.75), inset 0 0 14px rgba(100, 116, 139, 0.25), 0 18px 45px -8px rgba(15, 23, 42, 0.35), 0 4px 14px rgba(0, 0, 0, 0.18)',
        borderRadius: '36px',
        border: '1px solid #7E8C9B',
        pointerEvents: 'auto',
      }}
    >
      {/* Sliding Active Pill in Milled Mirror / Polished Chrome */}
      {activeIndex >= 0 && (
        <div 
          className="absolute top-1.5 bottom-1.5 rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
          style={{
            width: `calc(${100 / tabs.length}% - 6px)`,
            left: `calc(${activeIndex * (100 / tabs.length)}% + 3px)`,
            zIndex: 0,
            background: 'linear-gradient(180deg, #FFFFFF 0%, #E2E8F0 25%, #94A3B8 55%, #CBD5E1 85%, #FFFFFF 100%)',
            boxShadow: 'inset 0 1.5px 1px #FFFFFF, inset 0 -1.5px 1px rgba(15, 23, 42, 0.5), 0 3px 10px rgba(0, 0, 0, 0.22)',
            border: '1px solid rgba(255, 255, 255, 0.95)',
          }}
        />
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
              className="w-[20px] h-[20px] relative z-10 transition-all duration-300 ease-out"
              style={{
                color: isActive ? '#0F172A' : '#334155',
                fill: isActive ? 'currentColor' : 'none',
                transform: isActive ? 'scale(1.18) translateY(-1px)' : 'scale(1)',
                strokeWidth: isActive ? 2.5 : 2.0,
                filter: isActive ? 'drop-shadow(0 1px 0 rgba(255, 255, 255, 0.8))' : 'drop-shadow(0 1px 0 rgba(255, 255, 255, 0.4))',
              }}
            />

            {/* Label */}
            <span
              className="text-[9.5px] font-black tracking-tight select-none relative z-10 transition-all duration-300 ease-out"
              style={{
                color: isActive ? '#0F172A' : '#334155',
                textShadow: isActive ? '0 1px 0 rgba(255, 255, 255, 0.8)' : '0 1px 0 rgba(255, 255, 255, 0.4)',
              }}
            >
              {tab.label}
            </span>

            {/* Active Indicator Dot */}
            <span 
              className="w-1.5 h-1.5 rounded-full bg-[#0F172A] absolute bottom-1 transition-all duration-300 ease-out shadow-xs"
              style={{
                opacity: isActive ? 1 : 0,
                transform: isActive ? 'scale(1)' : 'scale(0)',
              }}
            />
          </Link>
        );
      })}
    </div>
  );
}

