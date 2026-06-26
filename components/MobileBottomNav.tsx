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
      className="md:hidden fixed bottom-[24px] left-[50%] -translate-x-1/2 h-[68px] z-50 px-2 flex items-center justify-evenly w-[calc(100%-32px)] max-w-[420px]"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        borderRadius: '40px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.isActive;

        return (
          <Link
            key={tab.label}
            href={tab.href}
            className="relative flex items-center justify-center h-full flex-1 cursor-pointer"
            style={{ textDecoration: 'none' }}
          >
            {/* Active Oval Highlight */}
            {isActive && (
              <div 
                className="absolute inset-0 m-auto w-[48px] h-[48px] bg-black/5 rounded-full"
                style={{ zIndex: 0 }}
              />
            )}
            
            {/* Icon */}
            <Icon
              className="w-[24px] h-[24px] relative z-10 transition-all duration-200"
              style={{
                color: isActive ? '#000000' : '#4b5563', // Solid black for active, dark gray for inactive
                fill: isActive ? '#000000' : 'none',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                strokeWidth: isActive ? 2.5 : 2,
              }}
            />
          </Link>
        );
      })}
    </div>
  );
}

