'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Sparkles, Heart } from 'lucide-react';

export default function MobileCommunityNav() {
  const pathname = usePathname();

  const items = [
    { label: 'City Board', icon: MessageSquare, href: '/city-board' },
    { label: 'Pet Twin', icon: Sparkles, href: '/twin' },
    { label: 'Adoption', icon: Heart, href: '/adoption' },
  ];

  return (
    <div 
      className="md:hidden fixed left-0 right-0 h-[52px] z-40 flex items-center justify-between gap-2 p-2 bg-[#FAF6F0] border-b border-[#E8DDD4] shadow-sm"
      style={{
        top: 'calc(env(safe-area-inset-top, 0px) + 72px)'
      }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl cursor-pointer transition-all ${
              isActive 
                ? 'bg-[#8B5E3C] text-white shadow-sm' 
                : 'bg-white text-[#666666] border border-[#E8DDD4]'
            }`}
            style={{ textDecoration: 'none' }}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#8B5E3C]'}`} />
            <span className="text-xs font-extrabold tracking-tight select-none">
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
