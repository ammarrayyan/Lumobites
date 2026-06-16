'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PawPrint, MapPin, Search, Globe, Utensils, Scan, ShoppingBag, MessageSquare, Sparkles, AlertTriangle } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [showFoodMenu, setShowFoodMenu] = useState(false);

  const isFoodActive = pathname === '/chat' || pathname === '/scan' || pathname === '/supplies' || pathname === '/recalls';

  const tabs = [
    { label: 'Home', icon: Home, href: '/', isActive: pathname === '/' },
    { label: 'Sitting', icon: PawPrint, href: '/petsitting', isActive: pathname === '/petsitting' },
    { label: 'Lost Pets', icon: MapPin, href: '/lost-pets', isActive: pathname === '/lost-pets' },
    { label: 'Pet Food', icon: Search, href: '#food-menu', isActive: isFoodActive, isMenu: true },
    { label: 'City Board', icon: MessageSquare, href: '/city-board', isActive: pathname === '/city-board' },
    { label: 'Pet Twin', icon: Sparkles, href: '/twin', isActive: pathname === '/twin' },
    { label: 'Explore', icon: Globe, href: '/explore', isActive: pathname === '/explore' },
  ];

  return (
    <>
      {/* Backdrop for Food Menu */}
      {showFoodMenu && (
        <div 
          className="fixed inset-0 z-40 bg-black/5 md:hidden" 
          onClick={() => setShowFoodMenu(false)}
        />
      )}

      {/* Upward Food Menu Popup */}
      {showFoodMenu && (
        <div 
          className="md:hidden fixed bottom-[76px] left-[50%] translate-x-[-50%] w-[190px] bg-[#FAF6F0] border border-[#E8DDD4] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] z-50 flex flex-col p-2 gap-1 animate-fade-in"
          style={{
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <Link
            href="/chat"
            onClick={() => setShowFoodMenu(false)}
            className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold text-[#666666] hover:text-[#8B5E3C] hover:bg-[#F5EDE4] rounded-xl transition-all cursor-pointer text-decoration-none"
          >
            <Utensils className="w-4 h-4 text-[#8B5E3C]" />
            Find Food
          </Link>
          <Link
            href="/scan"
            onClick={() => setShowFoodMenu(false)}
            className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold text-[#666666] hover:text-[#8B5E3C] hover:bg-[#F5EDE4] rounded-xl transition-all cursor-pointer text-decoration-none"
          >
            <Scan className="w-4 h-4 text-[#8B5E3C]" />
            Scan Label
          </Link>
          <Link
            href="/supplies"
            onClick={() => setShowFoodMenu(false)}
            className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold text-[#666666] hover:text-[#8B5E3C] hover:bg-[#F5EDE4] rounded-xl transition-all cursor-pointer text-decoration-none"
          >
            <ShoppingBag className="w-4 h-4 text-[#8B5E3C]" />
            Pet Supplies
          </Link>
          <Link
            href="/recalls"
            onClick={() => setShowFoodMenu(false)}
            className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold text-[#666666] hover:text-[#8B5E3C] hover:bg-[#F5EDE4] rounded-xl transition-all cursor-pointer text-decoration-none"
          >
            <AlertTriangle className="w-4 h-4 text-[#8B5E3C]" />
            FDA Recalls
          </Link>
        </div>
      )}

      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-[#FAF6F0] border-t border-[#E8DDD4] shadow-[0_-4px_12px_rgba(0,0,0,0.03)] z-50 px-1 flex items-center justify-between pb-safe">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.isActive;

          if (tab.isMenu) {
            return (
              <button
                key={tab.label}
                onClick={() => setShowFoodMenu(!showFoodMenu)}
                className="flex flex-col items-center justify-center flex-1 h-full text-center gap-1 cursor-pointer bg-transparent border-none outline-none px-0.5"
              >
                <Icon
                  className="w-4.5 h-4.5 transition-transform duration-200"
                  style={{
                    color: isActive ? '#8B5E3C' : '#9CA3AF',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  }}
                />
                <span
                  className="text-[8.5px] font-bold tracking-tighter select-none"
                  style={{
                    color: isActive ? '#8B5E3C' : '#9CA3AF',
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className="flex flex-col items-center justify-center flex-1 h-full text-center gap-1 cursor-pointer px-0.5"
              style={{ textDecoration: 'none' }}
            >
              <Icon
                className="w-4.5 h-4.5 transition-transform duration-200"
                style={{
                  color: isActive ? '#8B5E3C' : '#9CA3AF',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                }}
              />
              <span
                className="text-[8.5px] font-bold tracking-tighter select-none"
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </>
  );
}
