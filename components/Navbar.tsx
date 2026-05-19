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
        <Link href="/" className="flex items-center" style={{ textDecoration: 'none' }}>
          <div className="flex items-center origin-left scale-[1.4] -my-[15px]">
            <img src="/Logo.png" alt="Lumo Bites" className="h-[70px] w-auto block object-contain" />
            <sup className="text-[#8B5A2B] text-[10px] font-bold select-none ml-0.5 self-start mt-3 font-sans">™</sup>
          </div>
        </Link>

        {/* Right: Desktop Links & Share */}
        <div className="hidden md:flex items-center gap-6 ml-auto">
          <Link href="/scan" className="text-[#666666] font-medium text-sm hover:text-[#8B5E3C] transition-colors flex items-center">
            <svg className="w-4 h-4 inline-block mr-1.5 align-middle" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Safety Check
          </Link>
          <Link href="/recalls" className="text-[#666666] font-medium text-sm hover:text-[#8B5E3C] transition-colors flex items-center">
            <svg className="w-4 h-4 inline-block mr-1.5 align-middle text-[#D97706]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Recalls
          </Link>
          <Link href="/supplies" className="text-[#666666] font-medium text-sm hover:text-[#8B5E3C] transition-colors flex items-center">
            <svg className="w-4 h-4 inline-block mr-1.5 align-middle text-[#666666] hover:text-[#8B5E3C]" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="4.5" cy="11.5" r="2.5" />
              <circle cx="9.5" cy="7.5" r="2.5" />
              <circle cx="14.5" cy="7.5" r="2.5" />
              <circle cx="19.5" cy="11.5" r="2.5" />
              <path d="M12 21.5c-3 0-5.5-2.5-5.5-5.5s2.5-4.5 5.5-4.5 5.5 1.5 5.5 4.5-2.5 5.5-5.5 5.5z" />
            </svg>
            Pet Supplies
          </Link>
          <Link href="/twin" className="text-[#8B5E3C] font-bold text-sm hover:underline transition-all flex items-center">
            <svg className="w-4 h-4 inline-block mr-1.5 align-middle text-[#8B5E3C]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.096.813zM19.071 4.929l-.244 1.533-.244-1.533L17.05 4.685l1.533-.244.244-1.533.244 1.533 1.533.244-1.533.244z" />
            </svg>
            Pet Twin
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
              className="px-4 py-3 text-[#666666] font-medium hover:bg-[#FDF9F5] hover:text-[#8B5E3C] rounded-xl transition-colors flex items-center"
            >
              <svg className="w-4 h-4 inline-block mr-2.5 align-middle" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Safety Check
            </Link>
            <Link 
              href="/recalls" 
              className="px-4 py-3 text-[#666666] font-medium hover:bg-[#FDF9F5] hover:text-[#8B5E3C] rounded-xl transition-colors flex items-center"
            >
              <svg className="w-4 h-4 inline-block mr-2.5 align-middle text-[#D97706]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Recalls
            </Link>
            <Link 
              href="/supplies" 
              className="px-4 py-3 text-[#666666] font-medium hover:bg-[#FDF9F5] hover:text-[#8B5E3C] rounded-xl transition-colors flex items-center"
            >
              <svg className="w-4 h-4 inline-block mr-2.5 align-middle" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="4.5" cy="11.5" r="2.5" />
                <circle cx="9.5" cy="7.5" r="2.5" />
                <circle cx="14.5" cy="7.5" r="2.5" />
                <circle cx="19.5" cy="11.5" r="2.5" />
                <path d="M12 21.5c-3 0-5.5-2.5-5.5-5.5s2.5-4.5 5.5-4.5 5.5 1.5 5.5 4.5-2.5 5.5-5.5 5.5z" />
              </svg>
              Pet Supplies
            </Link>
            <Link 
              href="/twin" 
              className="px-4 py-3 text-[#8B5E3C] font-bold hover:bg-[#FDF9F5] rounded-xl transition-colors flex items-center"
            >
              <svg className="w-4 h-4 inline-block mr-2.5 align-middle text-[#8B5E3C]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.096.813zM19.071 4.929l-.244 1.533-.244-1.533L17.05 4.685l1.533-.244.244-1.533.244 1.533 1.533.244-1.533.244z" />
              </svg>
              Pet Twin
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
