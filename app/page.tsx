'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnimatedPets from '@/components/AnimatedPets';
import AppDownloadSection from '@/components/AppDownloadSection';
import { Home as HomeIcon, Utensils, Footprints, Globe, ArrowRight, PawPrint, Heart, Building2, X, Sparkles, MessageSquare } from 'lucide-react';
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
  const [btnHover, setBtnHover] = useState(false);
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
    <>
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

      {/* ========================================================================= */}
      {/* 1. MOBILE & TABLET (< lg): FIXED NON-SCROLLING 100DVH SINGLE VIEWPORT      */}
      {/* ========================================================================= */}
      <main
        className="fixed inset-x-0 bottom-0 top-[72px] lg:hidden z-10 bg-[#F7F3EE] flex flex-col justify-between overflow-y-auto select-none px-4 sm:px-6 pb-[84px] pt-2 sm:pt-4"
        style={{
          height: 'calc(100dvh - 72px)',
          maxHeight: 'calc(100dvh - 72px)',
        }}
      >
        <div className="w-full max-w-[540px] mx-auto flex flex-col items-center text-center my-auto py-1">
          {/* Animated Pet Group Illustration */}
          <AnimatedPets />

          {/* Hero Headline */}
          <h1 className="font-[800] leading-[1.15] mb-3.5 sm:mb-4 tracking-[-0.02em] relative z-10 text-[21px] sm:text-[26px]">
            <span className="text-[#191919]">Everything your pet needs, powered by AI</span>
            <br />
            <span className="text-[#C17D3C]">in one place.</span>
          </h1>

          {/* Store Badges */}
          {!isNativeApp && (
            <div className="flex flex-wrap gap-2.5 justify-center items-center mb-4.5 sm:mb-6">
              <a href="https://play.google.com/store/apps/details?id=net.lumobites.app" target="_blank" rel="noopener noreferrer">
                <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" height="36" style={{ height: '36px' }} />
              </a>
              <a href="https://apps.apple.com/app/lumo-bites/id6780612179" target="_blank" rel="noopener noreferrer">
                <img src="/app-store-badge.svg" alt="Download on the App Store" height="36" style={{ height: '36px' }} />
              </a>
            </div>
          )}

          {/* MOBILE 6-HUB QUICK ACCESS LAUNCHER */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 max-w-xs sm:max-w-sm mx-auto w-full mt-1 sm:mt-2">
            {/* 1. Lost Pets */}
            <Link href="/lost-pets" className="group flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-2xl transition-all duration-200 hover:bg-black/[0.04] active:bg-black/[0.08] active:scale-95" style={{ textDecoration: 'none' }}>
              <div 
                className="w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] rounded-[18px] flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #E06D53 0%, #C44D34 100%)',
                  boxShadow: '0 6px 14px -2px rgba(196, 77, 52, 0.32), inset 0 1.5px 2px rgba(255, 255, 255, 0.45)',
                }}
              >
                <Footprints className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.2} />
              </div>
              <span className="mt-1.5 text-[11.5px] font-semibold text-[#2B231D] text-center tracking-tight leading-tight group-hover:text-black">
                Lost Pets
              </span>
            </Link>

            {/* 2. Find Sitter */}
            <Link href="/petsitting" className="group flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-2xl transition-all duration-200 hover:bg-black/[0.04] active:bg-black/[0.08] active:scale-95" style={{ textDecoration: 'none' }}>
              <div 
                className="w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] rounded-[18px] flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #4E9F76 0%, #2E7852 100%)',
                  boxShadow: '0 6px 14px -2px rgba(46, 120, 82, 0.32), inset 0 1.5px 2px rgba(255, 255, 255, 0.45)',
                }}
              >
                <PawPrint className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.2} />
              </div>
              <span className="mt-1.5 text-[11.5px] font-semibold text-[#2B231D] text-center tracking-tight leading-tight group-hover:text-black">
                Find Sitter
              </span>
            </Link>

            {/* 3. Become Sitter */}
            <Link href="/petsitting?tab=become" className="group flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-2xl transition-all duration-200 hover:bg-black/[0.04] active:bg-black/[0.08] active:scale-95" style={{ textDecoration: 'none' }}>
              <div 
                className="w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] rounded-[18px] flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #E5A038 0%, #C47518 100%)',
                  boxShadow: '0 6px 14px -2px rgba(196, 117, 24, 0.32), inset 0 1.5px 2px rgba(255, 255, 255, 0.45)',
                }}
              >
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.2} />
              </div>
              <span className="mt-1.5 text-[11.5px] font-semibold text-[#2B231D] text-center tracking-tight leading-tight group-hover:text-black">
                Become Sitter
              </span>
            </Link>

            {/* 4. Adopt Pet */}
            <Link href="/adoption" className="group flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-2xl transition-all duration-200 hover:bg-black/[0.04] active:bg-black/[0.08] active:scale-95" style={{ textDecoration: 'none' }}>
              <div 
                className="w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] rounded-[18px] flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #DE6B7C 0%, #BF4456 100%)',
                  boxShadow: '0 6px 14px -2px rgba(191, 68, 86, 0.32), inset 0 1.5px 2px rgba(255, 255, 255, 0.45)',
                }}
              >
                <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.2} />
              </div>
              <span className="mt-1.5 text-[11.5px] font-semibold text-[#2B231D] text-center tracking-tight leading-tight group-hover:text-black">
                Adopt Pet
              </span>
            </Link>

            {/* 5. Partner Portal */}
            <button
              type="button"
              onClick={handleOpenPartnerPortal}
              className="group flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-2xl transition-all duration-200 hover:bg-black/[0.04] active:bg-black/[0.08] active:scale-95 cursor-pointer border-none bg-transparent"
              style={{ textDecoration: 'none' }}
            >
              <div 
                className="w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] rounded-[18px] flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #9C6C48 0%, #744A29 100%)',
                  boxShadow: '0 6px 14px -2px rgba(116, 74, 41, 0.32), inset 0 1.5px 2px rgba(255, 255, 255, 0.45)',
                }}
              >
                <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.2} />
              </div>
              <span className="mt-1.5 text-[11.5px] font-semibold text-[#2B231D] text-center tracking-tight leading-tight group-hover:text-black">
                Partner Portal
              </span>
            </button>

            {/* 6. City Board */}
            <Link href="/city-board" className="group flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-2xl transition-all duration-200 hover:bg-black/[0.04] active:bg-black/[0.08] active:scale-95" style={{ textDecoration: 'none' }}>
              <div 
                className="w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] rounded-[18px] flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #5B7E96 0%, #3B5F76 100%)',
                  boxShadow: '0 6px 14px -2px rgba(59, 95, 118, 0.32), inset 0 1.5px 2px rgba(255, 255, 255, 0.45)',
                }}
              >
                <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.2} />
              </div>
              <span className="mt-1.5 text-[11.5px] font-semibold text-[#2B231D] text-center tracking-tight leading-tight group-hover:text-black">
                City Board
              </span>
            </Link>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 2. DESKTOP (lg breakpoint and up): REGULAR NORMAL-SCROLLING PAGE           */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex lg:flex-col w-full min-h-screen font-sans text-[#2B231D] bg-[#F7F3EE]">
        {/* DESKTOP HERO SECTION */}
        <section className="w-full bg-[#F7F3EE] pt-4 pb-6 px-8 lg:px-12">
          <div className="max-w-[850px] mx-auto flex flex-col items-center text-center">
            <AnimatedPets />

            <h1 className="font-[800] leading-[1.15] mb-3 tracking-[-0.02em] relative z-10 text-3xl lg:text-4xl xl:text-[42px]">
              <span className="text-[#191919]">Everything your pet needs, powered by AI</span>
              <br />
              <span className="text-[#C17D3C]">in one place.</span>
            </h1>

            {!isNativeApp && (
              <div className="flex flex-wrap gap-3 justify-center items-center mt-2">
                <a href="https://play.google.com/store/apps/details?id=net.lumobites.app" target="_blank" rel="noopener noreferrer">
                  <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" height="42" style={{ height: '42px' }} />
                </a>
                <a href="https://apps.apple.com/app/lumo-bites/id6780612179" target="_blank" rel="noopener noreferrer">
                  <img src="/app-store-badge.svg" alt="Download on the App Store" height="42" style={{ height: '42px' }} />
                </a>
              </div>
            )}
          </div>
        </section>

        {/* DESKTOP KEY SERVICES GRID */}
        <section className="w-full bg-[#FDFAF7] px-8 lg:px-12 py-10">
          <div className="max-w-[1240px] mx-auto mb-8 text-center">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-[#191919] tracking-tight mb-2">
              Explore Key Services
            </h2>
            <p className="text-base text-[#7A6B5E] max-w-[650px] mx-auto">
              Everything you need for your pet&apos;s daily care, safety, and community &mdash; all in one unified platform.
            </p>
          </div>

          {/* Direct 3x2 Grid Display (All 6 Services Visible At Once) */}
          <div className="max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Find Sitter */}
            <div className="service-card-interactive group bg-white border border-[#E8DDD4] rounded-3xl p-7 shadow-xs hover:shadow-md hover:border-[#D4C3B5] transition-all duration-300 flex flex-col justify-between">
              <div>
                <div 
                  className="w-16 h-16 rounded-[20px] flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #A86B42 0%, #8B5E3C 100%)',
                    boxShadow: '0 8px 20px -3px rgba(139, 94, 60, 0.32), inset 0 1.5px 2px rgba(255, 255, 255, 0.45)',
                  }}
                >
                  <PawPrint className="w-8 h-8 text-white" strokeWidth={2.2} />
                </div>
                <h3 className="text-xl font-extrabold text-[#191919] mt-5 mb-2 group-hover:text-[#8B5E3C] transition-colors tracking-tight">
                  Find a Sitter
                </h3>
                <p className="text-sm text-[#7A6B5E] leading-relaxed">
                  Book trusted, ID-verified local pet sitters, licensed vet boarding, and daycare with instant AI matching.
                </p>
              </div>

              <div className="pt-6">
                <Link href="/petsitting" className="block w-full py-3 rounded-xl bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-center transition-all shadow-xs text-sm hover:scale-[1.01] active:scale-[0.99]" style={{ textDecoration: 'none' }}>
                  Find Sitters &rarr;
                </Link>
              </div>
            </div>

            {/* 2. Become Sitter */}
            <div className="service-card-interactive group bg-white border border-[#E8DDD4] rounded-3xl p-7 shadow-xs hover:shadow-md hover:border-[#D4C3B5] transition-all duration-300 flex flex-col justify-between">
              <div>
                <div 
                  className="w-16 h-16 rounded-[20px] flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #A86B42 0%, #8B5E3C 100%)',
                    boxShadow: '0 8px 20px -3px rgba(139, 94, 60, 0.32), inset 0 1.5px 2px rgba(255, 255, 255, 0.45)',
                  }}
                >
                  <Sparkles className="w-8 h-8 text-white" strokeWidth={2.2} />
                </div>
                <h3 className="text-xl font-extrabold text-[#191919] mt-5 mb-2 group-hover:text-[#8B5E3C] transition-colors tracking-tight">
                  Become a Sitter
                </h3>
                <p className="text-sm text-[#7A6B5E] leading-relaxed">
                  Turn your passion for pets into earnings. Set your own rates, keep 100% of your tips, and connect with neighbors.
                </p>
              </div>

              <div className="pt-6">
                <Link href="/petsitting?tab=become" className="block w-full py-3 rounded-xl bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-center transition-all shadow-xs text-sm hover:scale-[1.01] active:scale-[0.99]" style={{ textDecoration: 'none' }}>
                  Become a Sitter &rarr;
                </Link>
              </div>
            </div>

            {/* 3. Lost & Found Pets */}
            <div className="service-card-interactive group bg-white border border-[#E8DDD4] rounded-3xl p-7 shadow-xs hover:shadow-md hover:border-[#D4C3B5] transition-all duration-300 flex flex-col justify-between">
              <div>
                <div 
                  className="w-16 h-16 rounded-[20px] flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #A86B42 0%, #8B5E3C 100%)',
                    boxShadow: '0 8px 20px -3px rgba(139, 94, 60, 0.32), inset 0 1.5px 2px rgba(255, 255, 255, 0.45)',
                  }}
                >
                  <Footprints className="w-8 h-8 text-white" strokeWidth={2.2} />
                </div>
                <h3 className="text-xl font-extrabold text-[#191919] mt-5 mb-2 group-hover:text-[#8B5E3C] transition-colors tracking-tight">
                  Lost &amp; Found Pets
                </h3>
                <p className="text-sm text-[#7A6B5E] leading-relaxed">
                  Post lost or found pet reports instantly. AI visual recognition matches photos across the community to reunite families faster.
                </p>
              </div>

              <div className="pt-6">
                <Link href="/lost-pets" className="block w-full py-3 rounded-xl bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-center transition-all shadow-xs text-sm hover:scale-[1.01] active:scale-[0.99]" style={{ textDecoration: 'none' }}>
                  Post Lost Pet &rarr;
                </Link>
              </div>
            </div>

            {/* 4. Adopt a Pet */}
            <div className="service-card-interactive group bg-white border border-[#E8DDD4] rounded-3xl p-7 shadow-xs hover:shadow-md hover:border-[#D4C3B5] transition-all duration-300 flex flex-col justify-between">
              <div>
                <div 
                  className="w-16 h-16 rounded-[20px] flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #A86B42 0%, #8B5E3C 100%)',
                    boxShadow: '0 8px 20px -3px rgba(139, 94, 60, 0.32), inset 0 1.5px 2px rgba(255, 255, 255, 0.45)',
                  }}
                >
                  <Heart className="w-8 h-8 text-white" strokeWidth={2.2} />
                </div>
                <h3 className="text-xl font-extrabold text-[#191919] mt-5 mb-2 group-hover:text-[#8B5E3C] transition-colors tracking-tight">
                  Adopt a Pet
                </h3>
                <p className="text-sm text-[#7A6B5E] leading-relaxed">
                  Discover adoptable rescue animals waiting for a home. AI lifestyle matching, visual search, and direct shelter messaging.
                </p>
              </div>

              <div className="pt-6">
                <Link href="/adoption" className="block w-full py-3 rounded-xl bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-center transition-all shadow-xs text-sm hover:scale-[1.01] active:scale-[0.99]" style={{ textDecoration: 'none' }}>
                  Find to Adopt &rarr;
                </Link>
              </div>
            </div>

            {/* 5. Partner Portal */}
            <div className="service-card-interactive group bg-white border border-[#E8DDD4] rounded-3xl p-7 shadow-xs hover:shadow-md hover:border-[#D4C3B5] transition-all duration-300 flex flex-col justify-between">
              <div>
                <div 
                  className="w-16 h-16 rounded-[20px] flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #A86B42 0%, #8B5E3C 100%)',
                    boxShadow: '0 8px 20px -3px rgba(139, 94, 60, 0.32), inset 0 1.5px 2px rgba(255, 255, 255, 0.45)',
                  }}
                >
                  <Building2 className="w-8 h-8 text-white" strokeWidth={2.2} />
                </div>
                <h3 className="text-xl font-extrabold text-[#191919] mt-5 mb-2 group-hover:text-[#8B5E3C] transition-colors tracking-tight">
                  Partner Portal
                </h3>
                <p className="text-sm text-[#7A6B5E] leading-relaxed">
                  Dedicated business portal for rescue shelters, veterinary clinics, and pet daycare facilities to manage listings &amp; client inquiries.
                </p>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={handleOpenPartnerPortal}
                  className="block w-full py-3 rounded-xl bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-center transition-all shadow-xs text-sm hover:scale-[1.01] active:scale-[0.99] cursor-pointer border-none"
                >
                  Partner Portal &rarr;
                </button>
              </div>
            </div>

            {/* 6. City Board */}
            <div className="service-card-interactive group bg-white border border-[#E8DDD4] rounded-3xl p-7 shadow-xs hover:shadow-md hover:border-[#D4C3B5] transition-all duration-300 flex flex-col justify-between">
              <div>
                <div 
                  className="w-16 h-16 rounded-[20px] flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #A86B42 0%, #8B5E3C 100%)',
                    boxShadow: '0 8px 20px -3px rgba(139, 94, 60, 0.32), inset 0 1.5px 2px rgba(255, 255, 255, 0.45)',
                  }}
                >
                  <MessageSquare className="w-8 h-8 text-white" strokeWidth={2.2} />
                </div>
                <h3 className="text-xl font-extrabold text-[#191919] mt-5 mb-2 group-hover:text-[#8B5E3C] transition-colors tracking-tight">
                  City Board
                </h3>
                <p className="text-sm text-[#7A6B5E] leading-relaxed">
                  Connect with local pet owners, ask questions, find vetted groomers and clinics, and share neighborhood recommendations.
                </p>
              </div>

              <div className="pt-6">
                <Link href="/city-board" className="block w-full py-3 rounded-xl bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-center transition-all shadow-xs text-sm hover:scale-[1.01] active:scale-[0.99]" style={{ textDecoration: 'none' }}>
                  Explore Board &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* DESKTOP APP DOWNLOAD SECTION */}
        <AppDownloadSection />

        {/* DESKTOP EXPLORE TEASER BANNER */}
        <section className="w-full bg-[#FCFAF8] px-8 lg:px-12 pb-8 pt-4 text-center">
          <div className="max-w-[700px] mx-auto bg-gradient-to-b from-[#FAF5EE] to-[#FAF1E6] border border-[#E8DDD4] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-[#F5EDE4] flex items-center justify-center mb-3">
              <Globe className="w-6 h-6 text-[#8B5E3C]" />
            </div>
            <h2 className="text-xl font-extrabold text-[#2B231D] mb-1.5">Meet Your Pet Community</h2>
            <p className="text-base text-[#2B231D] leading-relaxed mb-5 font-normal">
              Connect with local pet owners, follow lost pet alerts, and stay in the loop with everything happening in your neighborhood.
            </p>
            <Link 
              href="/explore"
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: btnHover ? '#734A2E' : '#8B5E3C',
                color: 'white',
                padding: '12px 28px',
                borderRadius: '50px',
                fontSize: '15px',
                fontWeight: '600',
                textDecoration: 'none',
                boxShadow: btnHover ? '0 6px 20px rgba(139, 94, 60, 0.45)' : '0 4px 15px rgba(139, 94, 60, 0.3)',
                transform: btnHover ? 'translateY(-1px)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              Explore Community <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* DESKTOP FULL FOOTER */}
        <footer className="w-full px-8 lg:px-[48px] py-10 md:py-12" style={{ backgroundColor: '#191919', color: '#FFFFFF' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', maxWidth: '1200px', margin: '0 auto', marginBottom: '28px' }}>
            <div style={{ flex: '2 1 300px' }}>
              <Link href="/" className="mb-4 inline-block" style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <img src="/Logo.png" alt="Lumo Bites" style={{ height: '80px', width: 'auto', filter: 'brightness(0) invert(1)' }} />
                  <sup style={{ fontSize: '16px', color: '#8B5A2B', fontWeight: 'bold', alignSelf: 'flex-start', marginTop: '14px', marginLeft: '2px', fontFamily: 'sans-serif', userSelect: 'none' }}>™</sup>
                </div>
              </Link>
              <p className="text-sm max-w-sm leading-relaxed mt-2" style={{ color: '#AAAAAA' }}>
                Every pet deserves optimal nutrition without the marketing fluff.
              </p>
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <h4 className="font-bold mb-4" style={{ color: '#FFFFFF' }}>Product</h4>
              <ul className="space-y-3 text-sm" style={{ color: '#AAAAAA', listStyle: 'none', padding: 0, margin: 0 }}>
                <li><Link href="/explore#how" style={{ color: '#AAAAAA', textDecoration: 'none' }}>How it works</Link></li>
                <li><Link href="/chat" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Compare Foods</Link></li>
                <li><Link href="/scan" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Is My Pet&apos;s Food Safe?</Link></li>
                <li><Link href="/supplies" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Pet Supplies Finder</Link></li>
                <li><Link href="/petsitting" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Pet Sitting</Link></li>
                <li><Link href="/lost-pets" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Lost Pets</Link></li>
                <li><Link href="/explore" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Explore Community</Link></li>
                <li><Link href="/city-board" style={{ color: '#AAAAAA', textDecoration: 'none' }}>City Board</Link></li>
              </ul>
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <h4 className="font-bold mb-4" style={{ color: '#FFFFFF' }}>Support</h4>
              <ul className="space-y-3 text-sm" style={{ color: '#AAAAAA', listStyle: 'none', padding: 0, margin: 0 }}>
                <li><Link href="/contact" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Help Center</Link></li>
                <li><Link href="/contact" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Contact Us</Link></li>
                <li className="hidden"><Link href="/affiliate" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Affiliate Program</Link></li>
              </ul>
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <h4 className="font-bold mb-4" style={{ color: '#FFFFFF' }}>Legal</h4>
              <ul className="space-y-3 text-sm" style={{ color: '#AAAAAA', listStyle: 'none', padding: 0, margin: 0 }}>
                <li><Link href="/privacy" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Privacy Policy</Link></li>
                <li><Link href="/terms" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Terms of Service</Link></li>
                <li><Link href="/account-deletion" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Account Deletion</Link></li>
              </ul>
            </div>
          </div>
          <div className="max-w-[1200px] mx-auto pt-8 border-t border-gray-800 text-[#AAAAAA] text-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div>&copy; {new Date().getFullYear()} Premier Pet Nutrition LLC. All rights reserved.</div>
            <div className="flex items-center gap-5 text-base">
              <a href="https://www.instagram.com/lumobites" target="_blank" rel="noopener noreferrer" className="text-[#AAAAAA] hover:text-[#C17D3C] transition-colors" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              </a>
              <a href="https://www.facebook.com/profile.php?id=61590405247212" target="_blank" rel="noopener noreferrer" className="text-[#AAAAAA] hover:text-[#C17D3C] transition-colors" aria-label="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
