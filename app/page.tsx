'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnimatedPets from '@/components/AnimatedPets';
import { Footprints, PawPrint, Heart, Building2, X, Sparkles, MessageSquare, ArrowRight } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useScrollLock } from '@/lib/useScrollLock';

export default function Home() {
  const router = useRouter();
  const [petSittingModalOpen, setPetSittingModalOpen] = useState(false);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [daycareNoticeOpen, setDaycareNoticeOpen] = useState(false);
  useScrollLock(petSittingModalOpen || partnerModalOpen || daycareNoticeOpen);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySubmitted, setNotifySubmitted] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    setIsNativeApp(Capacitor.isNativePlatform());
    const cachedEmail = localStorage.getItem('lumo_pro_email');
    const cachedSitter = localStorage.getItem('lumo_sitter_email');
    if (cachedEmail || cachedSitter) {
      setIsSignedIn(true);
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('partnerModal') === 'true' || params.get('partner') === 'true') {
        setPartnerModalOpen(true);
      }
    }

    const syncStatus = () => {
      const cachedEmail = localStorage.getItem('lumo_pro_email');
      const cachedSitter = localStorage.getItem('lumo_sitter_email');
      setIsSignedIn(!!(cachedEmail || cachedSitter));
    };

    window.addEventListener('lumo-pro-update', syncStatus);
    window.addEventListener('storage', syncStatus);
    return () => {
      window.removeEventListener('lumo-pro-update', syncStatus);
      window.removeEventListener('storage', syncStatus);
    };
  }, []);

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (notifyEmail) setNotifySubmitted(true);
  };

  const handleOpenPartnerPortal = () => {
    setPartnerModalOpen(true);
  };

  const handleSelectShelter = async (e: React.MouseEvent) => {
    e.preventDefault();
    setPartnerModalOpen(false);
    const activeEmail = (
      localStorage.getItem('lumo_pro_email') ||
      localStorage.getItem('lumo_sitter_email') ||
      ''
    ).trim();

    if (activeEmail) {
      try {
        const res = await fetch(`/api/adoption/shelter?email=${encodeURIComponent(activeEmail)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.shelter && data.shelter.status === 'approved') {
            router.push('/adoption/shelter/dashboard');
            return;
          }
        }
      } catch (e) {
        console.error('Shelter check error:', e);
      }
    }
    router.push('/adoption?register=shelter');
  };

  const handleSelectVet = async (e: React.MouseEvent) => {
    e.preventDefault();
    setPartnerModalOpen(false);
    const activeEmail = (
      localStorage.getItem('lumo_pro_email') ||
      localStorage.getItem('lumo_sitter_email') ||
      ''
    ).trim();

    if (activeEmail) {
      try {
        const res = await fetch(`/api/vet-boarding?email=${encodeURIComponent(activeEmail)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.clinic && data.clinic.status === 'approved') {
            router.push('/vet-boarding/dashboard');
            return;
          }
        }
      } catch (e) {
        console.error('Vet clinic check error:', e);
      }
    }
    router.push('/vet-boarding');
  };

  const handleSelectDaycare = async (e: React.MouseEvent) => {
    e.preventDefault();
    setPartnerModalOpen(false);
    const activeEmail = (
      localStorage.getItem('lumo_pro_email') ||
      localStorage.getItem('lumo_sitter_email') ||
      ''
    ).trim();

    if (activeEmail) {
      try {
        const res = await fetch(`/api/pet-daycare?email=${encodeURIComponent(activeEmail)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.daycare && data.daycare.status === 'approved') {
            router.push('/pet-daycare/dashboard');
            return;
          }
        }
      } catch (e) {
        console.error('Daycare check error:', e);
      }
    }
    router.push('/pet-daycare');
  };

  return (
    <main
      className="fixed inset-x-0 bottom-0 top-[72px] z-10 bg-[#F7F3EE] flex flex-col justify-between overflow-y-auto select-none px-4 sm:px-6 lg:px-8 pb-[84px] lg:pb-5 pt-2 sm:pt-4"
      style={{
        height: 'calc(100dvh - 72px)',
        maxHeight: 'calc(100dvh - 72px)',
      }}
    >
      {/* PET SITTING COMING SOON MODAL */}
      {petSittingModalOpen && (
        <div className="modal-overlay fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4" onClick={() => setPetSittingModalOpen(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-[420px] w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPetSittingModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="w-14 h-14 bg-[#F5EDE4] rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-[#8B5E3C]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <p className="text-[#8B5E3C] text-xs font-bold tracking-[0.15em] uppercase text-center mb-2">Coming Soon</p>
            <h3 className="text-xl font-black text-[#191919] text-center mb-3">Pet Sitting is on its way!</h3>
            <p className="text-[#666666] text-sm text-center leading-relaxed mb-6">
              We&apos;re building a trusted marketplace for local pet sitters — completely free, no commission. Join our founding member list to be the first to know when it launches.
            </p>
            {!notifySubmitted ? (
              <form onSubmit={handleNotifySubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  required
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#8B5E3C] transition-colors"
                />
                <button type="submit" className="w-full py-3 rounded-xl bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-sm transition-colors cursor-pointer border-none shadow-sm">
                  Notify Me
                </button>
              </form>
            ) : (
              <div className="bg-[#FAF5EE] border border-[#E8DDD4] rounded-xl p-4 text-center">
                <p className="text-[#8B5E3C] font-bold text-sm">You&apos;re on the list! 🎉</p>
                <p className="text-[#666666] text-xs mt-1">We&apos;ll notify you the moment Pet Sitting goes live.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PARTNER PORTAL SELECTION MODAL */}
      {partnerModalOpen && (
        <div
          className="modal-overlay fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPartnerModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-[440px] w-full shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setPartnerModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors border-none cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4 border border-indigo-200">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>

            <h3 className="text-xl font-black text-[#4A3E3D] mb-1">
              Partner Portals
            </h3>
            <p className="text-[#8B7E7D] text-xs leading-relaxed mb-5">
              Select your service type to access your dedicated dashboard.
            </p>

            <div className="space-y-3">
              <Link href="/vet-boarding" onClick={handleSelectVet} className="block p-4 rounded-2xl border-2 border-blue-100 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 transition-all group" style={{ textDecoration: 'none' }}>
                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-sm text-blue-900 group-hover:text-blue-950 flex items-center gap-1.5">🏥 Veterinary Boarding</p>
                  <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              <Link href="/pet-daycare" onClick={handleSelectDaycare} className="block p-4 rounded-2xl border-2 border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-300 transition-all group" style={{ textDecoration: 'none' }}>
                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-sm text-emerald-900 group-hover:text-emerald-950 flex items-center gap-1.5">🐕 Pet Daycare</p>
                  <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              <Link href="/adoption?register=shelter" onClick={handleSelectShelter} className="block p-4 rounded-2xl border-2 border-orange-100 bg-orange-50/50 hover:bg-orange-50 hover:border-orange-300 transition-all group" style={{ textDecoration: 'none' }}>
                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-sm text-orange-900 group-hover:text-orange-950 flex items-center gap-1.5">🏛️ Shelter or Rescue</p>
                  <ArrowRight className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* CORE HERO & LAUNCHER HUB CONTAINER (Vertically Centered in Viewport) */}
      <div className="w-full max-w-[850px] mx-auto flex flex-col items-center text-center my-auto py-1">
        {/* Animated Pet Group Illustration */}
        <AnimatedPets />

        {/* Hero Headline */}
        <h1 className="font-[800] leading-[1.15] mb-2 sm:mb-3 tracking-[-0.02em] relative z-10" style={{ fontSize: 'clamp(20px, 2.8vw, 34px)' }}>
          <span className="text-[#191919]">Everything your pet needs, powered by AI</span>
          <br />
          <span className="text-[#C17D3C]">in one place.</span>
        </h1>

        {/* Store Badges */}
        {!isNativeApp && (
          <div className="flex flex-wrap gap-2.5 justify-center items-center mb-3 sm:mb-5">
            {/* Google Play Badge */}
            <a 
              href="https://play.google.com/store/apps/details?id=net.lumobites.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img 
                src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
                alt="Get it on Google Play"
                height="36"
                style={{ height: '36px' }}
              />
            </a>

            {/* App Store Badge */}
            <a 
              href="https://apps.apple.com/app/lumo-bites/id6780612179"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img 
                src="/app-store-badge.svg"
                alt="Download on the App Store"
                height="36"
                style={{ height: '36px' }}
              />
            </a>
          </div>
        )}

        {/* UNIFIED 6-HUB QUICK ACCESS LAUNCHER */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3.5 max-w-xs sm:max-w-2xl lg:max-w-3xl mx-auto w-full">
          {/* 1. Lost Pets */}
          <Link href="/lost-pets" className="group flex flex-col items-center justify-center p-1.5 sm:p-2.5 rounded-2xl transition-all duration-200 hover:bg-black/[0.04] active:bg-black/[0.08] active:scale-95" style={{ textDecoration: 'none' }}>
            <div 
              className="w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] rounded-[18px] flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #E06D53 0%, #C44D34 100%)',
                boxShadow: '0 6px 14px -2px rgba(196, 77, 52, 0.32), inset 0 1.5px 2px rgba(255, 255, 255, 0.45)',
              }}
            >
              <Footprints className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.2} />
            </div>
            <span className="mt-1.5 text-[11.5px] sm:text-[12.5px] font-semibold text-[#2B231D] text-center tracking-tight leading-tight group-hover:text-black">
              Lost Pets
            </span>
          </Link>

          {/* 2. Find Sitter */}
          <Link href="/petsitting" className="group flex flex-col items-center justify-center p-1.5 sm:p-2.5 rounded-2xl transition-all duration-200 hover:bg-black/[0.04] active:bg-black/[0.08] active:scale-95" style={{ textDecoration: 'none' }}>
            <div 
              className="w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] rounded-[18px] flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #4E9F76 0%, #2E7852 100%)',
                boxShadow: '0 6px 14px -2px rgba(46, 120, 82, 0.32), inset 0 1.5px 2px rgba(255, 255, 255, 0.45)',
              }}
            >
              <PawPrint className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.2} />
            </div>
            <span className="mt-1.5 text-[11.5px] sm:text-[12.5px] font-semibold text-[#2B231D] text-center tracking-tight leading-tight group-hover:text-black">
              Find Sitter
            </span>
          </Link>

          {/* 3. Become Sitter */}
          <Link href="/petsitting?tab=become" className="group flex flex-col items-center justify-center p-1.5 sm:p-2.5 rounded-2xl transition-all duration-200 hover:bg-black/[0.04] active:bg-black/[0.08] active:scale-95" style={{ textDecoration: 'none' }}>
            <div 
              className="w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] rounded-[18px] flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #E5A038 0%, #C47518 100%)',
                boxShadow: '0 6px 14px -2px rgba(196, 117, 24, 0.32), inset 0 1.5px 2px rgba(255, 255, 255, 0.45)',
              }}
            >
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.2} />
            </div>
            <span className="mt-1.5 text-[11.5px] sm:text-[12.5px] font-semibold text-[#2B231D] text-center tracking-tight leading-tight group-hover:text-black">
              Become Sitter
            </span>
          </Link>

          {/* 4. Adopt Pet */}
          <Link href="/adoption" className="group flex flex-col items-center justify-center p-1.5 sm:p-2.5 rounded-2xl transition-all duration-200 hover:bg-black/[0.04] active:bg-black/[0.08] active:scale-95" style={{ textDecoration: 'none' }}>
            <div 
              className="w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] rounded-[18px] flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #DE6B7C 0%, #BF4456 100%)',
                boxShadow: '0 6px 14px -2px rgba(191, 68, 86, 0.32), inset 0 1.5px 2px rgba(255, 255, 255, 0.45)',
              }}
            >
              <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.2} />
            </div>
            <span className="mt-1.5 text-[11.5px] sm:text-[12.5px] font-semibold text-[#2B231D] text-center tracking-tight leading-tight group-hover:text-black">
              Adopt Pet
            </span>
          </Link>

          {/* 5. Partner Portal */}
          <button
            type="button"
            onClick={handleOpenPartnerPortal}
            className="group flex flex-col items-center justify-center p-1.5 sm:p-2.5 rounded-2xl transition-all duration-200 hover:bg-black/[0.04] active:bg-black/[0.08] active:scale-95 cursor-pointer border-none bg-transparent"
            style={{ textDecoration: 'none' }}
          >
            <div 
              className="w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] rounded-[18px] flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #9C6C48 0%, #744A29 100%)',
                boxShadow: '0 6px 14px -2px rgba(116, 74, 41, 0.32), inset 0 1.5px 2px rgba(255, 255, 255, 0.45)',
              }}
            >
              <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.2} />
            </div>
            <span className="mt-1.5 text-[11.5px] sm:text-[12.5px] font-semibold text-[#2B231D] text-center tracking-tight leading-tight group-hover:text-black">
              Partner Portal
            </span>
          </button>

          {/* 6. City Board */}
          <Link href="/city-board" className="group flex flex-col items-center justify-center p-1.5 sm:p-2.5 rounded-2xl transition-all duration-200 hover:bg-black/[0.04] active:bg-black/[0.08] active:scale-95" style={{ textDecoration: 'none' }}>
            <div 
              className="w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] rounded-[18px] flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #5B7E96 0%, #3B5F76 100%)',
                boxShadow: '0 6px 14px -2px rgba(59, 95, 118, 0.32), inset 0 1.5px 2px rgba(255, 255, 255, 0.45)',
              }}
            >
              <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.2} />
            </div>
            <span className="mt-1.5 text-[11.5px] sm:text-[12.5px] font-semibold text-[#2B231D] text-center tracking-tight leading-tight group-hover:text-black">
              City Board
            </span>
          </Link>
        </div>
      </div>

      {/* DESKTOP COMPACT FOOTER STRIP */}
      <div className="hidden lg:flex items-center justify-between text-xs text-[#8B7E7D] max-w-4xl mx-auto w-full pt-2 border-t border-[#E8DDD4] shrink-0">
        <span>© {new Date().getFullYear()} Lumo Bites. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="text-[#8B7E7D] hover:text-[#8B5E3C] transition-colors" style={{ textDecoration: 'none' }}>Privacy Policy</Link>
          <Link href="/terms" className="text-[#8B7E7D] hover:text-[#8B5E3C] transition-colors" style={{ textDecoration: 'none' }}>Terms of Service</Link>
          <Link href="/contact" className="text-[#8B7E7D] hover:text-[#8B5E3C] transition-colors" style={{ textDecoration: 'none' }}>Contact Us</Link>
        </div>
      </div>
    </main>
  );
}
