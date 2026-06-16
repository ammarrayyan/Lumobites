'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PawPrint, MapPin, Search, Globe } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();

  const tabs = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Pet Sitting', icon: PawPrint, href: '/petsitting' },
    { label: 'Lost Pets', icon: MapPin, href: '/lost-pets' },
    { label: 'Pet Food', icon: Search, href: '/chat' },
    { label: 'Explore', icon: Globe, href: '/explore' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-[#FAF6F0] border-t border-[#E8DDD4] shadow-[0_-4px_12px_rgba(0,0,0,0.03)] z-50 px-2 flex items-center justify-around pb-safe">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className="flex flex-col items-center justify-center flex-1 h-full text-center gap-1 cursor-pointer"
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
              className="text-[10px] font-bold tracking-tight select-none"
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
