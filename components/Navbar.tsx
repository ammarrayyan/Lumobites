'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ShareButton from './ShareButton';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-[#EEEEEE] relative z-50">
      {/* Desktop & Mobile Header Container */}
      <div className="px-6 md:px-[48px] h-[72px] flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center">
          <img src="/Logo.png" alt="Lumo Bites" className="h-[70px] w-auto block object-contain scale-[1.4] origin-left -my-[15px]" />
        </Link>

        {/* Right: Desktop Links & Share */}
        <div className="hidden md:flex items-center gap-6 ml-auto">
          <Link href="/scan" className="text-[#666666] font-medium text-sm hover:text-[#8B5E3C] transition-colors">
            🔍 Safety Check
          </Link>
          <Link href="/recalls" className="text-[#666666] font-medium text-sm hover:text-[#8B5E3C] transition-colors">
            ⚠️ Recalls
          </Link>
          <Link href="/supplies" className="text-[#8B5E3C] font-bold text-sm hover:underline transition-all">
            🐾 Pet Supplies
          </Link>
          <div className="pl-4 border-l border-[#EEEEEE]">
            <ShareButton />
          </div>
        </div>

        {/* Mobile: Share + Hamburger */}
        <div className="flex md:hidden items-center gap-4 ml-auto">
          <ShareButton />
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="text-[#191919] p-2 hover:bg-[#FDF9F5] rounded-lg transition-colors"
            aria-label="Toggle Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden absolute top-[72px] left-0 w-full bg-white border-b border-[#EEEEEE] shadow-lg animate-fade-in">
          <div className="flex flex-col p-4 gap-2">
            <Link 
              href="/scan" 
              className="px-4 py-3 text-[#666666] font-medium hover:bg-[#FDF9F5] hover:text-[#8B5E3C] rounded-xl transition-colors flex items-center gap-2"
            >
              <span>🔍</span> Safety Check
            </Link>
            <Link 
              href="/recalls" 
              className="px-4 py-3 text-[#666666] font-medium hover:bg-[#FDF9F5] hover:text-[#8B5E3C] rounded-xl transition-colors flex items-center gap-2"
            >
              <span>⚠️</span> Recalls
            </Link>
            <Link 
              href="/supplies" 
              className="px-4 py-3 text-[#8B5E3C] font-bold hover:bg-[#FDF9F5] rounded-xl transition-colors flex items-center gap-2"
            >
              <span>🐾</span> Pet Supplies
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
