'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PetTwinPreview from '@/components/PetTwinPreview';
import LostPetsPreview from '@/components/LostPetsPreview';
import PetSittingPreview from '@/components/PetSittingPreview';
import CityBoardPreview from '@/components/CityBoardPreview';
import BrandMarquee from '@/components/BrandMarquee';
import { Compass, Sparkles, Footprints, Home as HomeIcon, MessageSquare, Target, Search, AlertTriangle, ShoppingBag } from 'lucide-react';

export default function ExplorePage() {
  return (
    <div className="min-h-screen flex flex-col font-sans text-[#555555] bg-[#FDFAF7]">
      {/* NAVBAR */}
      <Navbar />

      {/* HERO HEADER */}
      <section className="w-full bg-[#FDFAF7] pt-12 pb-8 px-6 border-b border-[#E8DDD4]">
        <div className="max-w-[800px] mx-auto text-center flex flex-col items-center">
          <div className="w-14 h-14 bg-[#F5EDE4] rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <Compass className="w-7 h-7 text-[#8B5E3C]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#191919] tracking-tight mb-3">
            Explore the Community
          </h1>
          <p className="text-[#666666] text-sm md:text-base max-w-[600px] leading-relaxed">
            See Lumo Bites in action. Real pet twin matches, live neighborhood lost & found alerts, local pet sitters, and city discussion board activity.
          </p>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="w-full bg-[#F5EDE4] border-b border-[#E8D5C0] py-5">
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

      {/* EXPLORE PAGE MAIN FEED GRID/LAYOUT */}
      <div className="flex-1 flex flex-col">
        {/* 1. Pet Twin Matcher Preview */}
        <PetTwinPreview />

        {/* 2. Lost Pets Preview */}
        <LostPetsPreview />

        {/* 3. Pet Sitting Preview */}
        <PetSittingPreview />

        {/* 4. City Board Discussion Preview */}
        <CityBoardPreview />
      </div>

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
              <p className="text-[#666666] text-base leading-[1.6]">Find the best toys, litter, and supplements specifically tailored for your pet&apos;s needs.</p>
            </div>
            <Link href="/petsitting" className="w-full sm:w-[calc(50%-12px)] lg:w-[320px] bg-white rounded-[16px] p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] flex flex-col items-center text-center hover:-translate-y-1 transition-transform relative overflow-hidden text-decoration-none">
              <HomeIcon className="w-9 h-9 text-[#8B5E3C] mb-5 relative z-10" />
              <h3 className="text-[#191919] font-bold text-xl mb-2 relative z-10">Sitting & Community</h3>
              <p className="text-[#666666] text-base leading-[1.6] relative z-10">Connect with local pet sitters, or help reunite lost pets with their families on our free community board.</p>
            </Link>
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

      {/* AFFILIATE SECTION */}
      <section className="w-full py-16 px-6 text-center border-t border-[#E8D5C0]" style={{ backgroundColor: '#FAF6F4' }}>
        <div className="max-w-[700px] mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 bg-[#8B5E3C]/10 border border-[#8B5E3C]/20 text-[#8B5E3C] text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-4">
            <Footprints className="w-3.5 h-3.5" /> Public Affiliate Program
          </div>
          <h2 className="font-[900] text-[#191919] tracking-[-0.02em] leading-tight mb-4 animate-fade-in flex items-center justify-center gap-2" style={{ fontSize: 'clamp(24px, 3.5vw, 36px)' }}>
            Earn money sharing Lumo Bites <Footprints className="w-8 h-8 text-[#8B5E3C] inline-block" />
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
              <li><Link href="/#how" style={{ color: '#AAAAAA', textDecoration: 'none' }}>How it works</Link></li>
              <li><Link href="/chat" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Compare Foods</Link></li>
              <li><Link href="/scan" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Is My Pet&apos;s Food Safe?</Link></li>
              <li><Link href="/supplies" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Pet Supplies Finder</Link></li>
              <li><Link href="/petsitting" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Pet Sitting</Link></li>
              <li><Link href="/lost-pets" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Lost Pets</Link></li>
              <li><Link href="/explore" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Explore Community</Link></li>
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
              <li><Link href="/account-deletion" style={{ color: '#AAAAAA', textDecoration: 'none' }}>Account Deletion</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto pt-8 border-t border-gray-800 text-[#AAAAAA] text-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div>&copy; {new Date().getFullYear()} Lumo Bites<sup style={{ fontSize: '50%', color: '#8B5A2B', verticalAlign: 'super', marginLeft: '1px' }}>™</sup>. All rights reserved.</div>
          <div className="flex items-center gap-5 text-base">
            <a href="https://www.instagram.com/lumobites" target="_blank" rel="noopener noreferrer" className="text-[#AAAAAA] hover:text-[#C17D3C] transition-colors" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </a>
            <a href="https://www.tiktok.com/@lumo.bites" target="_blank" rel="noopener noreferrer" className="text-[#AAAAAA] hover:text-[#C17D3C] transition-colors" aria-label="TikTok">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
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
  );
}
