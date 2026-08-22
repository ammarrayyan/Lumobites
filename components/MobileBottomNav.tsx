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
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(224, 231, 239, 0.72) 22%, rgba(255, 255, 255, 0.95) 45%, rgba(203, 213, 225, 0.65) 55%, rgba(241, 245, 249, 0.80) 80%, rgba(255, 255, 255, 0.92) 100%)',
        backdropFilter: 'blur(32px) saturate(220%) brightness(104%)',
        WebkitBackdropFilter: 'blur(32px) saturate(220%) brightness(104%)',
        boxShadow: 'inset 0 1.5px 0.5px rgba(255, 255, 255, 0.95), inset 0 -1.5px 1px rgba(100, 116, 139, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.6), 0 16px 44px -8px rgba(15, 23, 42, 0.20), 0 4px 12px rgba(0, 0, 0, 0.08)',
        borderRadius: '36px',
        border: '1px solid rgba(255, 255, 255, 0.75)',
        pointerEvents: 'auto',
      }}
    >
      {/* Sliding Active Pill in Polished Platinum / Chrome */}
      {activeIndex >= 0 && (
        <div 
          className="absolute top-1.5 bottom-1.5 rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
          style={{
            width: `calc(${100 / tabs.length}% - 6px)`,
            left: `calc(${activeIndex * (100 / tabs.length)}% + 3px)`,
            zIndex: 0,
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(226, 232, 240, 0.88) 50%, rgba(241, 245, 249, 0.95) 100%)',
            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 1), inset 0 -1px 1px rgba(148, 163, 184, 0.4), 0 2px 8px rgba(15, 23, 42, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.9)',
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
                color: isActive ? '#0F172A' : '#64748B',
                fill: isActive ? 'currentColor' : 'none',
                transform: isActive ? 'scale(1.18) translateY(-1px)' : 'scale(1)',
                strokeWidth: isActive ? 2.4 : 1.8,
              }}
            />

            {/* Label */}
            <span
              className="text-[9.5px] font-extrabold tracking-tight select-none relative z-10 transition-all duration-300 ease-out"
              style={{
                color: isActive ? '#0F172A' : '#64748B',
                fontWeight: isActive ? 800 : 600,
              }}
            >
              {tab.label}
            </span>

            {/* Active Indicator Dot */}
            <span 
              className="w-1 h-1 rounded-full bg-[#0F172A] absolute bottom-1 transition-all duration-300 ease-out"
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

