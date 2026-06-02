'use client';

import { useState } from 'react';
import Link from 'next/link';
import AnimatedPets from '@/components/AnimatedPets';
import BrandMarquee from '@/components/BrandMarquee';
import Navbar from '@/components/Navbar';
import LostPetsPreview from '@/components/LostPetsPreview';
import PetSittingPreview from '@/components/PetSittingPreview';
import CityBoardPreview from '@/components/CityBoardPreview';
import PetTwinPreview from '@/components/PetTwinPreview';
import { Star, Home as HomeIcon, Utensils, Footprints, Target, Search, AlertTriangle, Sparkles, ShoppingBag } from 'lucide-react';

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
      <section className="w-full bg-[#FDFAF7] pt-[32px] pb-12 px-6">
        <div className="max-w-[800px] mx-auto flex flex-col items-center text-center">
          
          <AnimatedPets />
          

          
          <h1 className="font-[800] leading-[1.1] mb-6 tracking-[-0.02em] relative z-10" style={{ fontSize: 'clamp(34px, 4.5vw, 54px)' }}>
            <span className="text-[#191919]">Everything your pet needs</span>
            <br />
            <span className="text-[#C17D3C]">— in one place.</span>
          </h1>
          
          <p className="text-[#666666] mb-10 leading-[1.65] max-w-[600px] relative z-10 mx-auto" style={{ fontSize: 'var(--text-hero-sub)' }}>
            Your neighborhood pet community — find trusted sitters, reunite lost pets, scan food ingredients, get FDA recall alerts and discover your Pet Twin. Built for pet lovers, by pet lovers.
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
              <span style={{ color: '#8B5E3C', fontWeight: 700 }}>&#10003;</span> Free to Join
            </span>
            <span style={{ color: '#DDD', fontSize: '16px' }}>&#183;</span>
            <span style={{ fontSize: '13px', color: '#999', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#8B5E3C', fontWeight: 700 }}>&#10003;</span> Community Powered
            </span>
            <span style={{ color: '#DDD', fontSize: '16px' }}>&#183;</span>
            <span style={{ fontSize: '13px', color: '#999', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#8B5E3C', fontWeight: 700 }}>&#10003;</span> AI Driven
            </span>
          </div>

        </div>
      </section>

      {/* Removed PRO BANNER SECTION */}

      {/* SERVICES GRID SECTION */}
      <section className="w-full bg-[#FDFAF7] px-6 pb-16">
        <div className="max-w-[1200px] mx-auto grid grid-cols-12 gap-6">
          
          {/* 1. Pet Sitting */}
          <div className="col-span-12 lg:col-span-5 bg-[#F5EDE4] border-2 border-[#8B5E3C] rounded-3xl p-6 flex flex-col gap-4 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#8B5E3C] text-white text-[10px] font-black uppercase tracking-[0.12em] px-3 py-1.5 rounded-bl-xl z-10 shadow-sm flex items-center gap-1">
              <Star className="w-3 h-3 text-white fill-white" /> Most Popular
            </div>
            <div className="flex items-center gap-3 relative z-10 mt-2">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                <HomeIcon className="w-6 h-6 text-[#8B5E3C]" />
              </div>
              <h3 className="text-[#191919] font-bold text-xl">Pet Sitting</h3>
            </div>
            <p className="text-[#666666] leading-relaxed relative flex-1 z-10 text-sm md:text-base">
              Find trusted local pet sitters in your neighborhood — verified profiles, real reviews, free to join.
            </p>
            <div className="mt-auto relative z-10">
              <Link href="/petsitting" className="block w-full py-3 rounded-xl bg-gradient-to-r from-[#3B5947] to-[#253D30] text-white font-bold text-center hover:from-[#2C4436] hover:to-[#1B2C22] transition-all shadow-md text-sm hover:scale-[1.01] active:scale-[0.99]" style={{ textDecoration: 'none' }}>
                Find Sitters &rarr;
              </Link>
            </div>
          </div>
 
          {/* 2. Lost Pets */}
          <div className="col-span-12 lg:col-span-4 bg-[#F5EDE4] border border-[#8B5E3C]/60 rounded-3xl p-6 flex flex-col gap-4 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 relative overflow-hidden">
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                <Footprints className="w-6 h-6 text-[#8B5E3C]" />
              </div>
              <h3 className="text-[#191919] font-bold text-xl">Lost Pets</h3>
            </div>
            <p className="text-[#666666] leading-relaxed relative flex-1 z-10 text-sm md:text-base">
              Post a lost or found pet in seconds and reach your whole neighborhood instantly. Free, no account needed.
            </p>
            <div className="mt-auto relative z-10">
              <Link href="/lost-pets" className="block w-full py-3 rounded-xl bg-gradient-to-r from-[#82242D] to-[#5C161C] text-white font-bold text-center hover:from-[#6C1D24] hover:to-[#4A1015] transition-all shadow-md text-sm hover:scale-[1.01] active:scale-[0.99]" style={{ textDecoration: 'none' }}>
                Post Lost Pet &rarr;
              </Link>
            </div>
          </div>
 
          {/* 3. Pet Food & Safety */}
          <div className="col-span-12 lg:col-span-3 bg-[#F5EDE4] border border-[#E8D5C0] rounded-3xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 relative overflow-hidden">
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                <Utensils className="w-6 h-6 text-[#8B5E3C]" />
              </div>
              <h3 className="text-[#191919] font-bold text-xl">Pet Food & Safety</h3>
            </div>
            <p className="text-[#666666] leading-relaxed relative flex-1 z-10 text-sm md:text-base">
              Find the safest food for your pet, scan ingredient labels, and browse live FDA recalls. PRO members get instant email alerts.
            </p>
            <div className="mt-auto flex flex-col gap-2 relative z-10">
              <Link href="/chat" className="block w-full py-2.5 rounded-xl border-2 border-[#8B5E3C] text-[#8B5E3C] font-bold text-center hover:bg-[#8B5E3C] hover:text-white transition-all text-sm" style={{ textDecoration: 'none' }}>
                Find Food &rarr;
              </Link>
              <Link href="/scan" className="block w-full py-2.5 rounded-xl border border-[#8B5E3C]/30 text-[#8B5E3C] font-bold text-center hover:bg-[#E8D5C0] transition-all text-sm" style={{ textDecoration: 'none' }}>
                Scan Label &rarr;
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* PET TWIN PREVIEW SECTION */}
      <PetTwinPreview />

      {/* LOST PETS PREVIEW SECTION */}
      <LostPetsPreview />

      {/* PET SITTING PREVIEW SECTION */}
      <PetSittingPreview />

      {/* CITY BOARD PREVIEW SECTION */}
      <CityBoardPreview />

      {/* STATS BAR */}
      <section className="w-full bg-[#F5EDE4] border-y border-[#E8D5C0] py-5">
        <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-center gap-6 md:gap-12 text-center">
          <div className="flex flex-col items-center">
            <span className="text-[18px] md:text-[20px] font-[800] text-[#8B5E3C] tracking-tight">Built for Pet Lovers</span>
            <span className="text-[#9A7760] font-medium uppercase tracking-[0.08em] mt-0.5" style={{ fontSize: 'var(--text-small)' }}>Community Powered</span>
          </div>
          <div className="hidden md:block w-px h-8 bg-[#D9C0A8]"></div>
          <div className="flex flex-col items-center">
            <span className="text-[18px] md:text-[20px] font-[800] text-[#8B5E3C] tracking-tight">AI Driven</span>
            <span className="text-[#9A7760] font-medium uppercase tracking-[0.08em] mt-0.5" style={{ fontSize: 'var(--text-small)' }}>Smart Recommendations</span>
          </div>
          <div className="hidden md:block w-px h-8 bg-[#D9C0A8]"></div>
          <div className="flex flex-col items-center">
            <span className="text-[18px] md:text-[20px] font-[800] text-[#8B5E3C] tracking-tight">Free to Join</span>
            <span className="text-[#9A7760] font-medium uppercase tracking-[0.08em] mt-0.5" style={{ fontSize: 'var(--text-small)' }}>No Hidden Fees</span>
          </div>
          <div className="hidden md:block w-px h-8 bg-[#D9C0A8]"></div>
          <div className="flex flex-col items-center">
            <span className="text-[18px] md:text-[20px] font-[800] text-[#8B5E3C] tracking-tight">FDA Monitored</span>
            <span className="text-[#9A7760] font-medium uppercase tracking-[0.08em] mt-0.5" style={{ fontSize: 'var(--text-small)' }}>Real Time Recall Alerts</span>
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
              <Target className="w-9 h-9 text-[#8B5E3C] mb-5" />
              <h3 className="text-[#191919] font-bold text-xl mb-2">Matched to your pet</h3>
              <p className="text-[#666666] text-base leading-[1.6]">We analyze age, breed, health issues and activity level to find their exact nutritional match.</p>
            </div>
            <div className="w-full sm:w-[calc(50%-12px)] lg:w-[320px] bg-white rounded-[16px] p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
              <Search className="w-9 h-9 text-[#8B5E3C] mb-5" />
              <h3 className="text-[#191919] font-bold text-xl mb-2">Ingredient Safety Check</h3>
              <p className="text-[#666666] text-base leading-[1.6]">Scan any pet food label to instantly detect dangerous ingredients and hidden toxins — graded A to F.</p>
            </div>
            <div className="w-full sm:w-[calc(50%-12px)] lg:w-[320px] bg-white rounded-[16px] p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
              <AlertTriangle className="w-9 h-9 text-[#8B5E3C] mb-5" />
              <h3 className="text-[#191919] font-bold text-xl mb-2">FDA Recall Alerts</h3>
              <p className="text-[#666666] text-base leading-[1.6]">Get notified instantly if your pet&apos;s food is recalled by the FDA. PRO members get instant email alerts.</p>
            </div>
            <div className="w-full sm:w-[calc(50%-12px)] lg:w-[320px] bg-white rounded-[16px] p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
              <Sparkles className="w-9 h-9 text-[#8B5E3C] mb-5" />
              <h3 className="text-[#191919] font-bold text-xl mb-2">Find Your Pet Twin</h3>
              <p className="text-[#666666] text-base leading-[1.6]">Upload a selfie to discover which cat or dog breed matches your personality and facial features.</p>
            </div>
            <div className="w-full sm:w-[calc(50%-12px)] lg:w-[320px] bg-white rounded-[16px] p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
              <ShoppingBag className="w-9 h-9 text-[#8B5E3C] mb-5" />
              <h3 className="text-[#191919] font-bold text-xl mb-2">Curated Pet Supplies</h3>
              <p className="text-[#666666] text-base leading-[1.6]">Find the best toys, litter, and supplements specifically tailored for your pet's needs.</p>
            </div>
            <Link href="/petsitting" className="w-full sm:w-[calc(50%-12px)] lg:w-[320px] bg-white rounded-[16px] p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] flex flex-col items-center text-center hover:-translate-y-1 transition-transform relative overflow-hidden text-decoration-none">
              <HomeIcon className="w-9 h-9 text-[#8B5E3C] mb-5 relative z-10" />
              <h3 className="text-[#191919] font-bold text-xl mb-2 relative z-10">Sitting & Community</h3>
              <p className="text-[#666666] text-base leading-[1.6] relative z-10">Connect with local pet sitters, or help reunite lost pets with their families on our free community board.</p>
            </Link>
          </div>
        </div>
      </section>
 
      {/* REMOVED COMING SOON SECTION */}
 
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
 
      {/* AFFILIATE SECTION */}
      <section className="w-full py-16 px-6 text-center border-t border-[#E8D5C0]" style={{ backgroundColor: '#FAF6F4' }}>
        <div className="max-w-[700px] mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 bg-[#8B5E3C]/10 border border-[#8B5E3C]/20 text-[#8B5E3C] text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-4">
            <Footprints className="w-3.5 h-3.5" /> Public Affiliate Program
          </div>
          <h2 className="font-[900] text-[#191919] tracking-[-0.02em] leading-tight mb-4 animate-fade-in" style={{ fontSize: 'clamp(24px, 3.5vw, 36px)' }}>
            Earn money sharing Lumo Bites 🐾
          </h2>
          <p className="text-gray-600 mb-8 max-w-[540px] leading-relaxed text-sm md:text-base">
            Join our affiliate program and earn <strong className="text-[#8B5E3C]">$1 for every PRO member</strong> you refer — every month they stay subscribed. Payouts via PayPal once you reach $50.
          </p>
          <Link
            href="/affiliate"
            className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white px-8 py-3.5 rounded-full font-bold shadow-md hover:scale-[1.02] hover:shadow-lg transition-all text-sm cursor-pointer"
            style={{ textDecoration: 'none' }}
          >
            Apply Now &rarr;
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
              <li><Link href="/petsitting" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Pet Sitting</Link></li>
              <li><Link href="/lost-pets" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Lost Pets</Link></li>
              <li><Link href="/city-board" style={{ color: '#AAAAAA', textDecoration: 'none' }}>City Board</Link></li>
              <li><Link href="/recalls" style={{ color: '#EF4444', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '6px', height: '6px', backgroundColor: '#EF4444', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>Recall Alerts</Link></li>
            </ul>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <h4 className="font-bold mb-4" style={{ color: '#FFFFFF' }}>Support</h4>
            <ul className="space-y-3 text-sm" style={{ color: '#AAAAAA', listStyle: 'none', padding: 0, margin: 0 }}>
              <li><Link href="/contact" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Help Center</Link></li>
              <li><Link href="/contact" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Contact Us</Link></li>
              <li><Link href="/affiliate" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Affiliate Program</Link></li>
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
