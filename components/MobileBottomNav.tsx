'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PawPrint, MapPin, Utensils, Users, Globe } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();

  const isFoodActive = pathname === '/chat' || pathname === '/scan' || pathname === '/supplies' || pathname === '/recalls';
  const isCommunityActive = pathname === '/city-board' || pathname === '/twin';

  const tabs = [
    { label: 'Home', icon: Home, href: '/', isActive: pathname === '/' },
    { label: 'Sitting', icon: PawPrint, href: '/petsitting', isActive: pathname === '/petsitting' },
    { label: 'Lost Pets', icon: MapPin, href: '/lost-pets', isActive: pathname === '/lost-pets' },
    { label: 'Pet Food', icon: Utensils, href: '/chat', isActive: isFoodActive },
    { label: 'Community', icon: Users, href: '/city-board', isActive: isCommunityActive },
    { label: 'Explore', icon: Globe, href: '/explore', isActive: pathname === '/explore' },
  ];

  return (
    <div 
      className="md:hidden fixed bottom-[20px] left-[50%] -translate-x-1/2 h-[64px] z-50 px-4 flex items-center justify-between"
      style={{
        width: '90%',
        maxWidth: '420px',
        backgroundColor: 'rgba(250, 246, 240, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.15)',
        borderRadius: '50px',
        border: '1px solid rgba(139, 94, 60, 0.12)',
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.isActive;

        return (
          <Link
            key={tab.label}
            href={tab.href}
            className="flex flex-col items-center justify-center flex-1 h-full text-center gap-1 cursor-pointer px-0.5"
            style={{ textDecoration: 'none' }}
          >
            <Icon
              className="w-5 h-5 transition-transform duration-200"
              style={{
                color: isActive ? '#8B5E3C' : '#9CA3AF',
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
              }}
            />
            <span
              className="text-[9px] font-bold tracking-tighter select-none"
              style={{
                color: isActive ? '#8B5E3C' : '#9CA3AF',
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
