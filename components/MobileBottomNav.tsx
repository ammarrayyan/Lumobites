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
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-[#FAF6F0] border-t border-[#E8DDD4] shadow-[0_-4px_12px_rgba(0,0,0,0.03)] z-50 px-2 flex items-center justify-between pb-safe">
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
