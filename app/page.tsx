'use client';

import { useState } from 'react';
import Link from 'next/link';
import AnimatedPets from '@/components/AnimatedPets';
import BrandMarquee from '@/components/BrandMarquee';
import Navbar from '@/components/Navbar';
import LostPetsPreview from '@/components/LostPetsPreview';

export default function Home() {
  const [petSittingModalOpen, setPetSittingModalOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySubmitted, setNotifySubmitted] = useState(false);

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (notifyEmail) setNotifySubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-[#555555] bg-[#FDFAF7]">

      {/* PET SITTING COMING SOON MODAL */}
      {petSittingModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4" onClick={() => setPetSittingModalOpen(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-[420px] w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPetSittingModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
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
                  onChange={e => setNotifyEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-[#FDFAF7] border border-[#E8DDD4] rounded-full px-5 py-3 text-sm outline-none focus:border-[#8B5E3C] transition-colors"
                />
                <button type="submit" className="w-full bg-[#8B5E3C] text-white font-bold py-3 rounded-full hover:bg-[#7A5234] transition-colors">
                  Notify Me When It Launches
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-center gap-2 text-green-600 font-semibold py-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                You&apos;re on the list! We&apos;ll notify you at launch.
              </div>
            )}
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <Navbar />

      {/* HERO SECTION */}
      <section className="w-full bg-[#FDFAF7] pt-[32px] pb-16 px-6">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center gap-12">
          
          {/* LEFT COLUMN - 60% */}
          <div className="flex-[1.5] flex flex-col items-center md:items-start text-center md:text-left">
            <AnimatedPets />
            
            <div className="text-[#8B5E3C] font-[700] tracking-[0.15em] uppercase mb-6 relative z-10 select-none" style={{ fontSize: 'var(--text-badge)' }}>
              Free &middot; No Sign-up Required
            </div>
            
            <h1 className="font-[800] leading-[1.1] mb-6 tracking-[-0.02em] relative z-10" style={{ fontSize: 'clamp(34px, 4.5vw, 54px)' }}>
              <span className="text-[#191919]">Everything your pet needs</span>
              <br />
              <span className="text-[#C17D3C]">— in one place.</span>
            </h1>
            
            <p className="text-[#666666] mb-10 leading-[1.65] max-w-[460px] relative z-10" style={{ fontSize: 'var(--text-hero-sub)' }}>
              Tell us your pet&apos;s age, breed and health needs. We&apos;ll find the perfect food that fits your budget.
            </p>

            <style>{`
              @keyframes heartbeat {
                0% { transform: scale(1); }
                14% { transform: scale(1.05); box-shadow: 0 10px 25px rgba(139, 94, 60, 0.4); }
                28% { transform: scale(1); box-shadow: 0 4px 15px rgba(139, 94, 60, 0.2); }
                42% { transform: scale(1.05); box-shadow: 0 10px 25px rgba(139, 94, 60, 0.4); }
                70% { transform: scale(1); box-shadow: 0 4px 15px rgba(139, 94, 60, 0.2); }
              }
              .btn-heartbeat {
                animation: heartbeat 2.5s infinite cubic-bezier(0.25, 0.8, 0.25, 1);
                box-shadow: 0 4px 15px rgba(139, 94, 60, 0.2);
                transition: all 0.3s ease;
              }
              .btn-heartbeat:hover {
                animation: none;
                transform: scale(1.03) translateY(-2px);
                box-shadow: 0 15px 30px rgba(139, 94, 60, 0.4);
              }
            `}</style>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: '#999', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#8B5E3C', fontWeight: 700 }}>&#10003;</span> Free to use
              </span>
              <span style={{ color: '#DDD', fontSize: '16px' }}>&#183;</span>
              <span style={{ fontSize: '13px', color: '#999', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#8B5E3C', fontWeight: 700 }}>&#10003;</span> No sign-up needed
              </span>
              <span style={{ color: '#DDD', fontSize: '16px' }}>&#183;</span>
              <span style={{ fontSize: '13px', color: '#999', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#8B5E3C', fontWeight: 700 }}>&#10003;</span> Results in seconds
              </span>
            </div>

          </div>

          {/* RIGHT COLUMN - 40% - SERVICE CARDS */}
          <div className="flex-1 w-full max-w-[400px] flex flex-col gap-4">

            {/* NEW Card - Find Pet Food */}
            <Link href="/chat" className="bg-[#F5EDE4] border border-[#E8D5C0] rounded-3xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] text-decoration-none">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <span className="text-[#8B5E3C] text-lg">🍽️</span>
                </div>
                <h3 className="text-[#191919] font-bold" style={{ fontSize: 'var(--text-hero-sub)' }}>Find Pet Food</h3>
              </div>
              <p className="text-[#666666] leading-relaxed" style={{ fontSize: 'var(--text-card-desc)' }}>
                Tell us your pet&apos;s age, breed and health needs. We&apos;ll find the perfect food that fits your budget.
              </p>
              <div className="w-full py-2.5 rounded-xl border-2 border-[#8B5E3C] text-[#8B5E3C] font-bold text-center hover:bg-[#8B5E3C] hover:text-white transition-all" style={{ fontSize: 'var(--text-btn)' }}>
                Find Food &rarr;
              </div>
            </Link>

            {/* NEW Card - Find Food by Photo */}
            <Link href="/photo" className="bg-[#F5EDE4] border border-[#E8D5C0] rounded-3xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] text-decoration-none">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <span className="text-[#8B5E3C] text-lg">📷</span>
                </div>
                <h3 className="text-[#191919] font-bold" style={{ fontSize: 'var(--text-hero-sub)' }}>Find Food by your pet Photo</h3>
              </div>
              <p className="text-[#666666] leading-relaxed" style={{ fontSize: 'var(--text-card-desc)' }}>
                Upload a photo of your pet and we&apos;ll instantly find the best food matched to their breed.
              </p>
              <div className="w-full py-2.5 rounded-xl border-2 border-[#8B5E3C] text-[#8B5E3C] font-bold text-center hover:bg-[#8B5E3C] hover:text-white transition-all" style={{ fontSize: 'var(--text-btn)' }}>
                Upload Photo &rarr;
              </div>
            </Link>

            {/* Card 1 - Pet Sitting (Coming Soon) */}
            <div
              className="relative bg-[#F5EDE4] border border-[#E8D5C0] rounded-3xl p-5 flex flex-col gap-3 shadow-sm cursor-pointer group opacity-80 hover:opacity-90 transition-all"
              onClick={() => setPetSittingModalOpen(true)}
            >
              {/* Coming Soon badge */}
              <span className="absolute top-3 right-3 bg-[#8B5E3C] text-white text-[10px] font-black uppercase tracking-[0.12em] px-2.5 py-1 rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Coming Soon
              </span>
              {/* Greyed overlay */}
              <div className="absolute inset-0 rounded-3xl bg-white/30 backdrop-grayscale-[20%] pointer-events-none" />
              <div className="flex items-center gap-3 relative">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <svg className="w-4 h-4 text-[#8B5E3C]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <h3 className="text-[#191919] font-bold" style={{ fontSize: 'var(--text-hero-sub)' }}>Pet Sitting</h3>
              </div>
              <p className="text-[#666666] leading-relaxed relative" style={{ fontSize: 'var(--text-card-desc)' }}>
                Connect with trusted, local pet sitters in your neighborhood or become a sitter yourself.
              </p>
              <div className="w-full py-2.5 rounded-xl border-2 border-[#8B5E3C]/40 text-[#8B5E3C]/60 font-bold text-center select-none" style={{ fontSize: 'var(--text-btn)' }}>
                Notify Me &rarr;
              </div>
            </div>

            {/* Card 1.5 - Lost Pets */}
            <Link href="/lost-pets" className="bg-[#F5EDE4] border border-[#E8D5C0] rounded-3xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] text-decoration-none">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <span className="text-[#8B5E3C] text-lg">🐾</span>
                </div>
                <h3 className="text-[#191919] font-bold" style={{ fontSize: 'var(--text-hero-sub)' }}>Lost Pets</h3>
              </div>
              <p className="text-[#666666] leading-relaxed" style={{ fontSize: 'var(--text-card-desc)' }}>
                A community board to help reunite lost pets with their families. Free to post and browse.
              </p>
              <div className="w-full py-2.5 rounded-xl border-2 border-[#8B5E3C] text-[#8B5E3C] font-bold text-center hover:bg-[#8B5E3C] hover:text-white transition-all" style={{ fontSize: 'var(--text-btn)' }}>
                View Board &rarr;
              </div>
            </Link>

            {/* Card 2 - Pet Twin */}
            <div className="bg-[#F5EDE4] border border-[#E8D5C0] rounded-3xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all hover:scale-[1.01]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <svg className="w-4 h-4 text-[#8B5E3C]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.096.813zM19.071 4.929l-.244 1.533-.244-1.533L17.05 4.685l1.533-.244.244-1.533.244 1.533 1.533.244-1.533.244z" />
                  </svg>
                </div>
                <h3 className="text-[#191919] font-bold" style={{ fontSize: 'var(--text-hero-sub)' }}>Find Your Pet Twin</h3>
              </div>
              <p className="text-[#666666] leading-relaxed" style={{ fontSize: 'var(--text-card-desc)' }}>
                Upload a selfie to discover which cat or dog breed perfectly matches your unique facial features and personality.
              </p>
              <Link href="/twin" className="w-full py-2.5 rounded-xl border-2 border-[#8B5E3C] text-[#8B5E3C] font-bold text-center hover:bg-[#8B5E3C] hover:text-white transition-all text-decoration-none" style={{ textDecoration: 'none', fontSize: 'var(--text-btn)' }}>
                Find Your Twin &rarr;
              </Link>
            </div>

            {/* Card 3 - Safety Check */}
            <div className="bg-[#F5EDE4] border border-[#E8D5C0] rounded-3xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all hover:scale-[1.01]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <svg className="w-4 h-4 text-[#8B5E3C]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-[#191919] font-bold" style={{ fontSize: 'var(--text-hero-sub)' }}>Is This Food Safe?</h3>
              </div>
              <p className="text-[#666666] leading-relaxed" style={{ fontSize: 'var(--text-card-desc)' }}>
                Scan any pet food label to instantly check ingredients for hidden toxins and live FDA recalls.
              </p>
              <Link href="/scan" className="w-full py-2.5 rounded-xl border-2 border-[#8B5E3C] text-[#8B5E3C] font-bold text-center hover:bg-[#8B5E3C] hover:text-white transition-all text-decoration-none" style={{ textDecoration: 'none', fontSize: 'var(--text-btn)' }}>
                Scan Now &rarr;
              </Link>
            </div>

            {/* Card 4 - Recall Alerts */}
            <div className="bg-[#F5EDE4] border border-[#E8D5C0] rounded-3xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all hover:scale-[1.01]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <svg className="w-4 h-4 text-[#D97706]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-[#191919] font-bold" style={{ fontSize: 'var(--text-hero-sub)' }}>FDA Recall Alerts</h3>
              </div>
              <p className="text-[#666666] leading-relaxed" style={{ fontSize: 'var(--text-card-desc)' }}>
                Get notified instantly if your pet&apos;s food is recalled by the FDA. Free email alerts.
              </p>
              <Link href="/recalls" className="w-full py-2.5 rounded-xl border-2 border-[#8B5E3C] text-[#8B5E3C] font-bold text-center hover:bg-[#8B5E3C] hover:text-white transition-all text-decoration-none" style={{ textDecoration: 'none', fontSize: 'var(--text-btn)' }}>
                Get Alerts &rarr;
              </Link>
            </div>

            {/* Card 5 - Pet Supplies */}
            <div className="bg-[#F5EDE4] border border-[#E8D5C0] rounded-3xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all hover:scale-[1.01]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <svg className="w-4 h-4 text-[#8B5E3C]" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="4.5" cy="11.5" r="2.5" />
                    <circle cx="9.5" cy="7.5" r="2.5" />
                    <circle cx="14.5" cy="7.5" r="2.5" />
                    <circle cx="19.5" cy="11.5" r="2.5" />
                    <path d="M12 21.5c-3 0-5.5-2.5-5.5-5.5s2.5-4.5 5.5-4.5 5.5 1.5 5.5 4.5-2.5 5.5-5.5 5.5z" />
                  </svg>
                </div>
                <h3 className="text-[#191919] font-bold" style={{ fontSize: 'var(--text-hero-sub)' }}>Pet Supplies</h3>
              </div>
              <p className="text-[#666666] leading-relaxed" style={{ fontSize: 'var(--text-card-desc)' }}>
                Find the best toys, litter, and supplements specifically tailored for your pet.
              </p>
              <Link href="/supplies" className="w-full py-2.5 rounded-xl border-2 border-[#8B5E3C] text-[#8B5E3C] font-bold text-center hover:bg-[#8B5E3C] hover:text-white transition-all text-decoration-none" style={{ textDecoration: 'none', fontSize: 'var(--text-btn)' }}>
                Find Supplies &rarr;
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* LOST PETS PREVIEW SECTION */}
      <LostPetsPreview />

      {/* STATS BAR */}
      <section className="w-full bg-[#F5EDE4] border-y border-[#E8D5C0] py-5">
        <div className="max-w-[900px] mx-auto flex flex-wrap items-center justify-center gap-6 md:gap-12 text-center">
          <div className="flex flex-col items-center">
            <span className="text-[22px] font-[800] text-[#8B5E3C] tracking-tight">100%</span>
            <span className="text-[#9A7760] font-medium uppercase tracking-[0.08em] mt-0.5" style={{ fontSize: 'var(--text-small)' }}>Free to Join</span>
          </div>
          <div className="hidden md:block w-px h-8 bg-[#D9C0A8]"></div>
          <div className="flex flex-col items-center">
            <span className="text-[22px] font-[800] text-[#8B5E3C] tracking-tight">Trusted</span>
            <span className="text-[#9A7760] font-medium uppercase tracking-[0.08em] mt-0.5" style={{ fontSize: 'var(--text-small)' }}>Pet Care</span>
          </div>
          <div className="hidden md:block w-px h-8 bg-[#D9C0A8]"></div>
          <div className="flex flex-col items-center">
            <span className="text-[22px] font-[800] text-[#8B5E3C] tracking-tight">No</span>
            <span className="text-[#9A7760] font-medium uppercase tracking-[0.08em] mt-0.5" style={{ fontSize: 'var(--text-small)' }}>Commission Ever</span>
          </div>
          <div className="hidden md:block w-px h-8 bg-[#D9C0A8]"></div>
          <div className="flex flex-col items-center">
            <span className="text-[22px] font-[800] text-[#8B5E3C] tracking-tight">FDA</span>
            <span className="text-[#9A7760] font-medium uppercase tracking-[0.08em] mt-0.5" style={{ fontSize: 'var(--text-small)' }}>Recall Alerts</span>
          </div>
        </div>
      </section>

      {/* BRAND LOGOS STRIP */}
      <BrandMarquee />


      {/* HOW IT WORKS */}
      <section id="how" className="w-full bg-[#FDFAF7] px-6 py-[80px]">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-[#8B5E3C] text-[13px] font-bold tracking-[0.1em] uppercase mb-3">How it works</h3>
            <h2 className="font-[800] text-[#191919] tracking-[-0.02em] leading-tight max-w-[600px] mx-auto" style={{ fontSize: 'clamp(20px, 2.5vw, 28px)' }}>
              Personalized recommendations, not generic lists.
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="w-full sm:w-[calc(50%-12px)] lg:w-[320px] bg-white rounded-[16px] p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
              <span style={{ fontSize: '36px', lineHeight: 1, marginBottom: '20px', display: 'block' }}>🎯</span>
              <h3 className="text-[#191919] font-bold text-xl mb-2">Matched to your pet</h3>
              <p className="text-[#666666] text-base leading-[1.6]">We analyze age, breed, health issues and activity level to find their exact nutritional match.</p>
            </div>
            <div className="w-full sm:w-[calc(50%-12px)] lg:w-[320px] bg-white rounded-[16px] p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
              <span style={{ fontSize: '36px', lineHeight: 1, marginBottom: '20px', display: 'block' }}>🔍</span>
              <h3 className="text-[#191919] font-bold text-xl mb-2">Ingredient Safety Check</h3>
              <p className="text-[#666666] text-base leading-[1.6]">Scan any pet food label to instantly detect dangerous ingredients and hidden toxins — graded A to F.</p>
            </div>
            <div className="w-full sm:w-[calc(50%-12px)] lg:w-[320px] bg-white rounded-[16px] p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
              <span style={{ fontSize: '36px', lineHeight: 1, marginBottom: '20px', display: 'block' }}>⚠️</span>
              <h3 className="text-[#191919] font-bold text-xl mb-2">FDA Recall Alerts</h3>
              <p className="text-[#666666] text-base leading-[1.6]">Get notified instantly if your pet&apos;s food is recalled by the FDA. Free email alerts, no spam.</p>
            </div>
            <div className="w-full sm:w-[calc(50%-12px)] lg:w-[320px] bg-white rounded-[16px] p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
              <span style={{ fontSize: '36px', lineHeight: 1, marginBottom: '20px', display: 'block' }}>✨</span>
              <h3 className="text-[#191919] font-bold text-xl mb-2">Find Your Pet Twin</h3>
              <p className="text-[#666666] text-base leading-[1.6]">Upload a selfie to discover which cat or dog breed matches your personality and facial features.</p>
            </div>
            <div className="w-full sm:w-[calc(50%-12px)] lg:w-[320px] bg-white rounded-[16px] p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
              <span style={{ fontSize: '36px', lineHeight: 1, marginBottom: '20px', display: 'block' }}>🛍️</span>
              <h3 className="text-[#191919] font-bold text-xl mb-2">Curated Pet Supplies</h3>
              <p className="text-[#666666] text-base leading-[1.6]">Find the best toys, litter, and supplements specifically tailored for your pet's needs.</p>
            </div>
            <div className="w-full sm:w-[calc(50%-12px)] lg:w-[320px] bg-white rounded-[16px] p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] flex flex-col items-center text-center hover:-translate-y-1 transition-transform relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-[#8B5E3C] text-white text-[9px] font-black uppercase tracking-[0.12em] px-2 py-0.5 rounded-full z-10">Soon</div>
              <div className="absolute inset-0 bg-white/40 backdrop-grayscale-[30%] pointer-events-none z-0"></div>
              <span className="relative z-10" style={{ fontSize: '36px', lineHeight: 1, marginBottom: '20px', display: 'block' }}>🏡</span>
              <h3 className="text-[#191919] font-bold text-xl mb-2 relative z-10">Sitting & Community</h3>
              <p className="text-[#666666] text-base leading-[1.6] relative z-10">Connect with local pet sitters, or help reunite lost pets with their families on our free community board.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="w-full bg-[#FDFAF7] px-6 py-[80px]">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-[#8B5E3C] text-[13px] font-bold tracking-[0.1em] uppercase mb-3">What pet owners say</h3>
            <h2 className="font-[800] text-[#191919] tracking-[-0.02em] leading-tight max-w-[500px] mx-auto" style={{ fontSize: 'clamp(18px, 2.5vw, 26px)' }}>
              Real results for real pets.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-[20px] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.06)] flex flex-col gap-4 hover:-translate-y-1 transition-transform">
              <div className="flex gap-1 text-[#C17D3C] text-lg">{'★★★★★'}</div>
              <p className="text-[#444444] text-sm leading-[1.7] flex-1">&ldquo;My golden retriever was struggling with joint issues and I had no idea what to feed her. The Personalized Food Advisor matched her to a premium formula with glucosamine in seconds. She&apos;s been on it two months and is noticeably more active!&rdquo;</p>
              <div className="flex items-center gap-3 pt-2 border-t border-[#F0E8E0]">
                <div className="w-9 h-9 rounded-full bg-[#F5EDE4] flex items-center justify-center text-lg">🐕</div>
                <div>
                  <p className="font-bold text-[#191919] text-xs">Sarah M.</p>
                  <p className="text-[#999] text-[11px]">Personalized Food Advisor • Golden Retriever Owner, TX</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-[20px] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.06)] flex flex-col gap-4 hover:-translate-y-1 transition-transform">
              <div className="flex gap-1 text-[#C17D3C] text-lg">{'★★★★★'}</div>
              <p className="text-[#444444] text-sm leading-[1.7] flex-1">&ldquo;The Ingredient Safety Scanner is a lifesaver! I scanned the label of my cat&apos;s favorite wet food and discovered a hidden chemical preservative. Switching to a Grade A alternative has resolved their digestive issues completely.&rdquo;</p>
              <div className="flex items-center gap-3 pt-2 border-t border-[#F0E8E0]">
                <div className="w-9 h-9 rounded-full bg-[#F5EDE4] flex items-center justify-center text-lg">🐈</div>
                <div>
                  <p className="font-bold text-[#191919] text-xs">James L.</p>
                  <p className="text-[#999] text-[11px]">Ingredient Safety Scanner • Multi-cat Household, CA</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-[20px] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.06)] flex flex-col gap-4 hover:-translate-y-1 transition-transform">
              <div className="flex gap-1 text-[#C17D3C] text-lg">{'★★★★★'}</div>
              <p className="text-[#444444] text-sm leading-[1.7] flex-1">&ldquo;I tried the AI Pet Twin game just for fun, and it matched my selfie to a Pug with 94% accuracy! It was so hilariously spot-on and premium that I shared it on my Instagram story. It is such a mysterious and entertaining quiz!&rdquo;</p>
              <div className="flex items-center gap-3 pt-2 border-t border-[#F0E8E0]">
                <div className="w-9 h-9 rounded-full bg-[#F5EDE4] flex items-center justify-center text-lg">🐶</div>
                <div>
                  <p className="font-bold text-[#191919] text-xs">Priya K.</p>
                  <p className="text-[#999] text-[11px]">AI Pet Twin Game • Pug Owner, NY</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="w-full px-6 py-[80px] text-center" style={{ backgroundColor: '#8B5E3C' }}>
        <div className="max-w-[700px] mx-auto">
          <h2 className="font-[800] tracking-[-0.02em] leading-tight mb-4" style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', color: '#FFFFFF' }}>
            Ready to find the perfect food?
          </h2>
          <p className="text-[18px] mb-10 max-w-[480px] mx-auto" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Join thousands of pet owners who found their pet&apos;s favorite food.
          </p>
          <Link href="/chat" style={{ fontSize: '15px', padding: '14px 42px', textDecoration: 'none', color: '#8B5E3C', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: '100px', fontWeight: '700', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}>
            Get Started &rarr;
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full px-6 md:px-[48px] py-16" style={{ backgroundColor: '#191919', color: '#FFFFFF' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '48px', maxWidth: '1200px', margin: '0 auto', marginBottom: '48px' }}>
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
              <li><a href="#how" style={{ color: '#AAAAAA', textDecoration: 'none' }}>How it works</a></li>
              <li><Link href="/chat" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Compare Foods</Link></li>
              <li><Link href="/scan" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Is My Pet&apos;s Food Safe?</Link></li>
              <li><Link href="/supplies" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Pet Supplies Finder</Link></li>
              <li><span style={{ color: '#777777', cursor: 'default' }}>Pet Sitting <span style={{ fontSize: '10px', background: '#333', color: '#999', padding: '1px 6px', borderRadius: '4px', marginLeft: '4px', verticalAlign: 'middle' }}>Soon</span></span></li>
              <li><Link href="/lost-pets" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Lost Pets</Link></li>
              <li><Link href="/recalls" style={{ color: '#EF4444', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '6px', height: '6px', backgroundColor: '#EF4444', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>Recall Alerts</Link></li>
            </ul>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <h4 className="font-bold mb-4" style={{ color: '#FFFFFF' }}>Support</h4>
            <ul className="space-y-3 text-sm" style={{ color: '#AAAAAA', listStyle: 'none', padding: 0, margin: 0 }}>
              <li><Link href="/contact" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Help Center</Link></li>
              <li><Link href="/contact" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Contact Us</Link></li>
            </ul>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <h4 className="font-bold mb-4" style={{ color: '#FFFFFF' }}>Legal</h4>
            <ul className="space-y-3 text-sm" style={{ color: '#AAAAAA', listStyle: 'none', padding: 0, margin: 0 }}>
              <li><Link href="/privacy" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Privacy Policy</Link></li>
              <li><Link href="/terms" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto pt-8 border-t border-gray-800 text-[#AAAAAA] text-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div>&copy; {new Date().getFullYear()} Lumo Bites<sup style={{ fontSize: '50%', color: '#8B5A2B', verticalAlign: 'super', marginLeft: '1px' }}>™</sup>. All rights reserved.</div>
          <div className="flex items-center gap-4 text-base">
            <a href="#" className="hover:text-[#C17D3C] transition-colors">𝕏</a>
            <a href="#" className="hover:text-[#C17D3C] transition-colors">📷</a>
            <a href="#" className="hover:text-[#C17D3C] transition-colors">📘</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
