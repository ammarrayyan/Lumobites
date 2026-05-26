'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ShareButton from './ShareButton';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [proEmail, setProEmail] = useState('');
  const [showProMenu, setShowProMenu] = useState(false);

  const syncStatus = () => {
    if (typeof window === 'undefined') return;
    const cachedEmail = localStorage.getItem('lumo_pro_email');
    const isAdminBypass = localStorage.getItem('lumo_admin_bypass') === 'true';
    const isOwnerEmail = cachedEmail?.toLowerCase().trim() === 'premierpetnutritionllc@gmail.com';
    
    if (isAdminBypass || isOwnerEmail) {
      setIsPro(true);
      setProEmail(cachedEmail || 'admin@lumobites.com');
    } else if (cachedEmail && cachedEmail !== 'undefined' && cachedEmail !== 'null' && cachedEmail.trim() !== '') {
      setIsPro(true);
      setProEmail(cachedEmail);
    } else {
      setIsPro(false);
      setProEmail('');
    }
  };

  useEffect(() => {
    syncStatus();
    
    const match = document.cookie.match(/(?:^|;)\s*googtrans=([^;]*)/);
    if (match) {
      const parts = match[1].split('/');
      if (parts.length > 2) {
        const langCode = parts[2];
        setCurrentLang(langCode);
        document.documentElement.dir = langCode === 'ar' ? 'rtl' : 'ltr';
      }
    }
    
    // Add listeners for custom state synchronization
    window.addEventListener('lumo-pro-update', syncStatus);
    window.addEventListener('storage', syncStatus);

    // Dynamic database check if cached email exists
    const cachedEmail = localStorage.getItem('lumo_pro_email');
    const isAdminBypass = localStorage.getItem('lumo_admin_bypass') === 'true';
    const isOwnerEmail = cachedEmail?.toLowerCase().trim() === 'premierpetnutritionllc@gmail.com';

    if (cachedEmail && !isAdminBypass && !isOwnerEmail && cachedEmail !== 'undefined' && cachedEmail !== 'null' && cachedEmail.trim() !== '') {
      fetch('/api/stripe/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cachedEmail })
      })
      .then(res => res.json())
      .then(data => {
        if (data.isPro) {
          setIsPro(true);
        } else {
          setIsPro(false);
          localStorage.removeItem('lumo_pro_email');
          window.dispatchEvent(new Event('lumo-pro-update'));
        }
      })
      .catch((err) => {
        console.error('[Lumo Subscription] Failed to sync status with Supabase:', err);
      });
    }

    return () => {
      window.removeEventListener('lumo-pro-update', syncStatus);
      window.removeEventListener('storage', syncStatus);
    };
  }, []);

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lumo_pro_email');
      localStorage.removeItem('lumo_admin_bypass');
    }
    setIsPro(false);
    setProEmail('');
    setShowProMenu(false);
    
    // Broadcast auth change
    window.dispatchEvent(new Event('lumo-pro-update'));
    
    // Force clean page refresh
    window.location.reload();
  };

  return (
    <nav className="bg-white border-b border-[#EEEEEE] relative z-50">
      {/* Desktop & Mobile Header Container */}
      <div className="px-6 md:px-[48px] h-[72px] flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', transform: 'scale(1.4)', transformOrigin: 'left center', margin: '-15px 0' }} className="origin-left">
            <img src="/Logo.png" alt="Lumo Bites" className="h-[40px] w-auto block object-contain" />
            <sup style={{ fontSize: '10px', color: '#8B5A2B', fontWeight: 'bold', alignSelf: 'flex-start', marginTop: '5px', marginLeft: '2px', fontFamily: 'sans-serif', userSelect: 'none' }}>™</sup>
          </div>
        </Link>

        {/* Right: Desktop Links & Share */}
        <div className="hidden md:flex items-center gap-6 ml-auto">

          {/* Pet Sitting - Coming Soon */}
          <div className="relative group" style={{ fontSize: 'var(--text-nav)' }}>
            <span className="text-[#BBBBBB] font-medium flex items-center gap-1.5 cursor-default select-none">
              <svg className="w-4 h-4 inline-block align-middle" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Pet Sitting
              <span className="text-[9px] bg-[#8B5E3C]/10 text-[#8B5E3C] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full">Soon</span>
            </span>
            {/* Tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-[#191919] text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
              Coming Soon!
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-[#191919]" />
            </div>
          </div>

          <Link href="/scan" className="text-[#666666] font-medium hover:text-[#8B5E3C] transition-colors flex items-center nav-link" style={{ fontSize: 'var(--text-nav)' }}>
            <svg className="w-4 h-4 inline-block mr-1.5 align-middle" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Safety Check
          </Link>
          <Link href="/recalls" className="text-[#666666] font-medium hover:text-[#8B5E3C] transition-colors flex items-center nav-link" style={{ fontSize: 'var(--text-nav)' }}>
            <svg className="w-4 h-4 inline-block mr-1.5 align-middle text-[#D97706]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Recalls
          </Link>
          <Link href="/supplies" className="text-[#666666] font-medium hover:text-[#8B5E3C] transition-colors flex items-center nav-link" style={{ fontSize: 'var(--text-nav)' }}>
            <svg className="w-4 h-4 inline-block mr-1.5 align-middle text-[#666666] hover:text-[#8B5E3C]" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="4.5" cy="11.5" r="2.5" />
              <circle cx="9.5" cy="7.5" r="2.5" />
              <circle cx="14.5" cy="7.5" r="2.5" />
              <circle cx="19.5" cy="11.5" r="2.5" />
              <path d="M12 21.5c-3 0-5.5-2.5-5.5-5.5s2.5-4.5 5.5-4.5 5.5 1.5 5.5 4.5-2.5 5.5-5.5 5.5z" />
            </svg>
            Pet Supplies
          </Link>
          <Link href="/twin" className="text-[#8B5E3C] font-bold hover:underline transition-all flex items-center nav-link" style={{ fontSize: 'var(--text-nav)' }}>
            <svg className="w-4 h-4 inline-block mr-1.5 align-middle text-[#8B5E3C]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.096.813zM19.071 4.929l-.244 1.533-.244-1.533L17.05 4.685l1.533-.244.244-1.533.244 1.533 1.533.244-1.533.244z" />
            </svg>
            Pet Twin
          </Link>
          <div className="pl-4 border-l border-[#EEEEEE] flex items-center gap-4">
            <ShareButton />
            
            {isPro && (
              <div className="relative">
                <button
                  onClick={() => setShowProMenu(!showProMenu)}
                  className="flex items-center gap-2.5 bg-white hover:bg-[#FAF8F5] border border-[#E6DFD9] hover:border-[#D6CDC2] px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer select-none shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
                >
                  <div className="bg-gradient-to-r from-[#7C3AED] to-[#DB2777] text-white text-[11px] font-serif italic tracking-wide px-3 py-0.5 rounded-full shadow-sm select-none">
                    Pro ✨
                  </div>
                  <span className="text-xs text-[#4A3E3D] font-bold flex items-center gap-1 select-none">
                    Account
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-[#8B7E7D] transition-transform duration-200" style={{ transform: showProMenu ? 'rotate(180deg)' : 'none' }}>
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                  </span>
                </button>

                {showProMenu && (
                  <>
                    {/* Click outside to close backdrop */}
                    <div 
                      className="fixed inset-0 z-40 bg-transparent cursor-default" 
                      onClick={() => setShowProMenu(false)}
                    />
                    
                    {/* Floating Premium Menu */}
                    <div className="absolute right-0 mt-2.5 w-52 bg-white border border-[#E8DDD4] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-2 z-50 flex flex-col gap-1 animate-fade-in text-left">
                      <div className="px-3 py-2 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate select-none">
                        {proEmail || "Pro Member"}
                      </div>
                      <Link 
                        href="/account"
                        onClick={() => setShowProMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-[#555555] hover:text-[#8B5E3C] font-semibold hover:bg-[#FAF6F4] rounded-xl transition-all"
                        style={{ textDecoration: 'none' }}
                      >
                        ⚙️ Manage Subscription
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 font-semibold hover:bg-red-50 rounded-xl transition-all text-left bg-transparent border-none cursor-pointer"
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile: Share + Lang + PRO badge + Hamburger */}
        <div className="flex md:hidden items-center gap-2 ml-auto">
          <ShareButton />
          
          {isPro && (
            <div className="relative">
              <button
                onClick={() => setShowProMenu(!showProMenu)}
                className="flex items-center gap-2 bg-white hover:bg-[#FAF8F5] border border-[#E6DFD9] px-3 py-1.5 rounded-full transition-all cursor-pointer select-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              >
                <div className="bg-gradient-to-r from-[#7C3AED] to-[#DB2777] text-white text-[11px] font-serif italic tracking-wide px-3 py-0.5 rounded-full shadow-sm select-none">
                  Pro ✨
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-[#8B7E7D] transition-transform duration-200" style={{ transform: showProMenu ? 'rotate(180deg)' : 'none' }}>
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>

              {showProMenu && (
                <>
                  {/* Click outside to close backdrop */}
                  <div 
                    className="fixed inset-0 z-40 bg-transparent cursor-default" 
                    onClick={() => setShowProMenu(false)}
                  />
                  
                  {/* Floating Premium Menu */}
                  <div className="absolute right-0 mt-2.5 w-52 bg-white border border-[#E8DDD4] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-2 z-50 flex flex-col gap-1 animate-fade-in text-left">
                    <div className="px-3 py-2 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate select-none">
                      {proEmail || "Pro Member"}
                    </div>
                    <Link 
                      href="/account"
                      onClick={() => setShowProMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-[#555555] hover:text-[#8B5E3C] font-semibold hover:bg-[#FAF6F4] rounded-xl transition-all"
                      style={{ textDecoration: 'none' }}
                    >
                      ⚙️ Manage Subscription
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 font-semibold hover:bg-red-50 rounded-xl transition-all text-left bg-transparent border-none cursor-pointer"
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

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
        <div className="md:hidden absolute top-[72px] left-0 w-full bg-white border-b border-[#EEEEEE] shadow-lg z-50 animate-fade-in">
          <div className="flex flex-col p-4 gap-2">

            {/* Pet Sitting - Coming Soon (mobile) */}
            <div className="px-4 py-3 text-[#BBBBBB] font-medium flex items-center gap-2 rounded-xl cursor-default">
              <svg className="w-4 h-4 inline-block align-middle" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Pet Sitting
              <span className="text-[9px] bg-[#8B5E3C]/10 text-[#8B5E3C] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full">Coming Soon</span>
            </div>

            <Link 
              href="/scan" 
              className="px-4 py-3 text-[#666666] font-medium hover:bg-[#FDF9F5] hover:text-[#8B5E3C] rounded-xl transition-colors flex items-center animate-fade-in"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-4 h-4 inline-block mr-2.5 align-middle" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Safety Check
            </Link>
            <Link 
              href="/recalls" 
              className="px-4 py-3 text-[#666666] font-medium hover:bg-[#FDF9F5] hover:text-[#8B5E3C] rounded-xl transition-colors flex items-center animate-fade-in"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-4 h-4 inline-block mr-2.5 align-middle text-[#D97706]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Recalls
            </Link>
            <Link 
              href="/supplies" 
              className="px-4 py-3 text-[#666666] font-medium hover:bg-[#FDF9F5] hover:text-[#8B5E3C] rounded-xl transition-colors flex items-center animate-fade-in"
              onClick={() => setIsOpen(false)}
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
              className="px-4 py-3 text-[#8B5E3C] font-bold hover:bg-[#FDF9F5] rounded-xl transition-colors flex items-center animate-fade-in"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-4 h-4 inline-block mr-2.5 align-middle text-[#8B5E3C]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.096.813zM19.071 4.929l-.244 1.533-.244-1.533L17.05 4.685l1.533-.244.244-1.533.244 1.533 1.533.244-1.533.244z" />
              </svg>
              Pet Twin
            </Link>
            
            {isPro && (
              <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-1 animate-fade-in">
                <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate select-none">
                  {proEmail || "Pro Member"}
                </div>
                <Link 
                  href="/account"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3 text-[#555555] font-bold hover:bg-[#FDF9F5] hover:text-[#8B5E3C] rounded-xl transition-colors flex items-center animate-fade-in"
                  style={{ textDecoration: 'none' }}
                >
                  ⚙️ Manage Subscription
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleSignOut();
                  }}
                  className="w-full px-4 py-3 text-left text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors flex items-center bg-transparent border-none cursor-pointer animate-fade-in"
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
