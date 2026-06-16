'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Utensils, Scan, ShoppingBag, AlertTriangle } from 'lucide-react';

export default function MobileFoodNav() {
  const pathname = usePathname();

  const items = [
    { label: 'Find Food', icon: Utensils, href: '/chat' },
    { label: 'Scan Label', icon: Scan, href: '/scan' },
    { label: 'Pet Supplies', icon: ShoppingBag, href: '/supplies' },
    { label: 'FDA Recalls', icon: AlertTriangle, href: '/recalls' },
  ];

  return (
    <div className="md:hidden fixed top-[72px] left-0 right-0 h-[52px] z-40 flex items-center justify-between gap-1.5 p-2 bg-[#FAF6F0] border-b border-[#E8DDD4] shadow-sm">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex-1 flex flex-col items-center gap-1 py-1.5 px-0.5 rounded-xl text-center cursor-pointer transition-all ${
              isActive 
                ? 'bg-[#8B5E3C] text-white shadow-sm' 
                : 'bg-white text-[#666666] border border-[#E8DDD4]'
            }`}
            style={{ textDecoration: 'none' }}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#8B5E3C]'}`} />
            <span className="text-[9px] font-extrabold tracking-tight select-none">
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
