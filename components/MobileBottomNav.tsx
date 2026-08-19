'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PawPrint, MapPin, Utensils, Users, Globe } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();

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

  const activeIndex = tabs.findIndex(tab => tab.isActive);

  return (
    <div 
      className="lg:hidden px-1.5 flex items-center justify-between w-[calc(100%-24px)] max-w-[430px] h-[66px] relative"
      style={{
        position: 'fixed',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)',
        left: 0,
        right: 0,
        marginLeft: 'auto',
        marginRight: 'auto',
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
        zIndex: 9999,
        backgroundColor: 'rgba(255, 255, 255, 0.52)',
        backdropFilter: 'blur(24px) saturate(200%)',
        WebkitBackdropFilter: 'blur(24px) saturate(200%)',
        boxShadow: '0 10px 36px rgba(0, 0, 0, 0.09), inset 0 1px 1px rgba(255, 255, 255, 0.8)',
        borderRadius: '36px',
        border: '1px solid rgba(255, 255, 255, 0.65)',
        pointerEvents: 'auto',
      }}
    >
      {/* Sliding Active Pill Background Indicator */}
      {activeIndex >= 0 && (
        <div 
          className="absolute top-1.5 bottom-1.5 rounded-full bg-black/[0.07] border border-black/[0.04] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            width: `calc(${100 / tabs.length}% - 6px)`,
            left: `calc(${activeIndex * (100 / tabs.length)}% + 3px)`,
            zIndex: 0,
          }}
        />
      )}

      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.isActive;

        return (
          <Link
            key={tab.label}
            href={tab.href}
            className="relative flex flex-col items-center justify-center h-full flex-1 cursor-pointer gap-0.5 group active:scale-90 transition-transform duration-150"
            style={{ textDecoration: 'none' }}
          >
            {/* Icon with Scale & Movement */}
            <Icon
              className="w-[20px] h-[20px] relative z-10 transition-all duration-300 ease-out"
              style={{
                color: isActive ? '#1F1712' : '#6B635B',
                fill: isActive ? '#1F1712' : 'none',
                transform: isActive ? 'scale(1.15) translateY(-1px)' : 'scale(1)',
                strokeWidth: isActive ? 2.5 : 1.8,
              }}
            />

            {/* Label */}
            <span
              className="text-[9.5px] font-extrabold tracking-tight select-none relative z-10 transition-all duration-300 ease-out"
              style={{
                color: isActive ? '#1F1712' : '#6B635B',
                fontWeight: isActive ? 800 : 600,
              }}
            >
              {tab.label}
            </span>

            {/* Active Indicator Dot */}
            <span 
              className="w-1 h-1 rounded-full bg-[#8B5E3C] absolute bottom-1 transition-all duration-300 ease-out"
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
