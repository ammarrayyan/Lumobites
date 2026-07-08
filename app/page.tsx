'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AnimatedPets from '@/components/AnimatedPets';
import { Home as HomeIcon, Utensils, Footprints, Globe, ArrowRight, PawPrint, MapPin } from 'lucide-react';

export default function Home() {
  const [petSittingModalOpen, setPetSittingModalOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySubmitted, setNotifySubmitted] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const cachedEmail = localStorage.getItem('lumo_pro_email');
    const cachedSitter = localStorage.getItem('lumo_sitter_email');
    if (cachedEmail || cachedSitter) {
      setIsSignedIn(true);
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

  return (
    <div className="min-h-screen flex flex-col font-sans text-[#555555] bg-[#FDFAF7]">

      {/* PET SITTING COMING SOON MODAL */}
      {petSittingModalOpen && (
        <div className="modal-overlay fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4" onClick={() => setPetSittingModalOpen(false)}>
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
      
      {/* HERO SECTION */}
      <section className="w-full bg-[#FDFAF7] pt-[32px] pb-12 px-6">
        <div className="max-w-[800px] mx-auto flex flex-col items-center text-center">
          <AnimatedPets />

          <h1 className="font-[800] leading-[1.1] mb-6 tracking-[-0.02em] relative z-10" style={{ fontSize: 'clamp(34px, 4.5vw, 54px)' }}>
            <span className="text-[#191919]">Everything your pet needs, powered by AI —</span>
            <br />
            <span className="text-[#C17D3C]">in one place.</span>
          </h1>
        </div>
      </section>

      {/* MOBILE QUICK ACCESS BUTTONS */}
      <section className="md:hidden w-full px-6 pb-8">
        <div className="flex flex-col gap-3">
          <Link href="/petsitting" style={{ textDecoration: 'none' }}>
            <div className="w-full min-h-[56px] bg-gradient-to-b from-[#FAF9F6] to-[#FAF5EE] border border-[#EADFD5] text-[#664333] font-bold rounded-2xl flex items-center justify-center gap-3 px-4 shadow-sm hover:shadow-md transition-all cursor-pointer">
              <PawPrint className="w-5 h-5 text-[#C27353]" />
              <span>Find a Pet Sitter</span>
            </div>
          </Link>
          <Link href="/petsitting?tab=become" style={{ textDecoration: 'none' }}>
            <div className="w-full min-h-[56px] bg-gradient-to-b from-[#F6F8F5] to-[#EEF2EB] border border-[#DFE5DC] text-[#3B5237] font-bold rounded-2xl flex items-center justify-center gap-3 px-4 shadow-sm hover:shadow-md transition-all cursor-pointer">
              <HomeIcon className="w-5 h-5 text-[#63825D]" />
              <span>Become a Pet Sitter</span>
            </div>
          </Link>
          <Link href="/lost-pets" style={{ textDecoration: 'none' }}>
            <div className="w-full min-h-[56px] bg-gradient-to-b from-[#F6F8F9] to-[#ECF1F3] border border-[#DFE5E8] text-[#3B5461] font-bold rounded-2xl flex items-center justify-center gap-3 px-4 shadow-sm hover:shadow-md transition-all cursor-pointer">
              <MapPin className="w-5 h-5 text-[#517685]" />
              <span>Post or Find Lost Pet</span>
            </div>
          </Link>
        </div>
      </section>

      {/* SERVICES GRID SECTION */}
      <section className="hidden md:block w-full bg-[#FDFAF7] px-6 pb-8">
        <div className="max-w-[1200px] mx-auto grid grid-cols-12 gap-6">

          {/* 1. Pet Sitting */}
          <div className="col-span-12 lg:col-span-5 bg-gradient-to-b from-[#FAF9F6] to-[#FAF5EE] border border-[#EADFD5] rounded-3xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-xl hover:border-[#DDCBBF] transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
            <div className="flex items-center gap-3 relative z-10 mt-2">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF2EB] flex items-center justify-center shadow-inner">
                <HomeIcon className="w-6 h-6 text-[#C27353]" />
              </div>
              <h3 className="text-[#664333] font-extrabold text-xl">Pet Sitting</h3>
            </div>
            <p className="text-[#7A6A63] leading-relaxed relative flex-1 z-10 text-sm md:text-base">
              Find trusted local pet sitters in your neighborhood — verified profiles, real reviews, free to join.
            </p>
            <div className="mt-auto relative z-10">
              <Link href="/petsitting" className="block w-full py-3 rounded-xl bg-gradient-to-r from-[#C27353] to-[#B06040] text-white font-bold text-center hover:brightness-110 hover:shadow-md transition-all shadow-sm text-sm hover:scale-[1.01] active:scale-[0.99]" style={{ textDecoration: 'none' }}>
                Find Sitters &rarr;
              </Link>
            </div>
          </div>

          {/* 2. Lost Pets */}
          <div className="col-span-12 lg:col-span-4 bg-gradient-to-b from-[#F6F8F9] to-[#ECF1F3] border border-[#DFE5E8] rounded-3xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-xl hover:border-[#CCD5DB] transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#F0F5F7] flex items-center justify-center shadow-inner">
                <Footprints className="w-6 h-6 text-[#517685]" />
              </div>
              <h3 className="text-[#3B5461] font-extrabold text-xl">Lost Pets</h3>
            </div>
            <p className="text-[#627985] leading-relaxed relative flex-1 z-10 text-sm md:text-base">
              Post a lost or found pet in seconds and reach your whole neighborhood instantly. Free, no account needed.
            </p>
            <div className="mt-auto relative z-10">
              <Link href="/lost-pets" className="block w-full py-3 rounded-xl bg-gradient-to-r from-[#517685] to-[#426270] text-white font-bold text-center hover:brightness-110 hover:shadow-md transition-all shadow-sm text-sm hover:scale-[1.01] active:scale-[0.99]" style={{ textDecoration: 'none' }}>
                Post Lost Pet &rarr;
              </Link>
            </div>
          </div>

          {/* 3. Pet Food & Safety */}
          <div className="col-span-12 lg:col-span-3 bg-gradient-to-b from-[#F6F8F5] to-[#EEF2EB] border border-[#DFE5DC] rounded-3xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-xl hover:border-[#CCD5C8] transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#F2F6F1] flex items-center justify-center shadow-inner">
                <Utensils className="w-6 h-6 text-[#63825D]" />
              </div>
              <h3 className="text-[#3B5237] font-extrabold text-xl">Pet Food & Safety</h3>
            </div>
            <p className="text-[#61755E] leading-relaxed relative flex-1 z-10 text-sm md:text-base">
              Find the safest food for your pet, scan ingredient labels, and browse live FDA recalls. PRO members get instant email alerts.
            </p>
            <div className="mt-auto flex flex-col gap-2 relative z-10">
              <Link href="/chat" className="block w-full py-2.5 rounded-xl bg-gradient-to-r from-[#63825D] to-[#516E4C] text-white font-bold text-center hover:brightness-110 hover:shadow-md transition-all text-sm hover:scale-[1.01] active:scale-[0.99]" style={{ textDecoration: 'none' }}>
                Find Food &rarr;
              </Link>
              <Link href="/scan" className="block w-full py-2.5 rounded-xl border border-[#63825D]/30 text-[#63825D] font-bold text-center hover:bg-[#F2F6F1] hover:border-[#63825D]/60 transition-all text-sm" style={{ textDecoration: 'none' }}>
                Scan Label &rarr;
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* EXPLORE TEASER BANNER */}
      <section className="hidden md:block w-full bg-[#FDFAF7] px-6 pb-14 text-center">
        <div className="max-w-[700px] mx-auto bg-gradient-to-b from-[#FAF5EE] to-[#FAF1E6] border border-[#E8DDD4] rounded-3xl p-8 shadow-sm flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-[#F5EDE4] flex items-center justify-center mb-4">
            <Globe className="w-6 h-6 text-[#8B5E3C]" />
          </div>
          <h2 className="text-xl md:text-2xl font-black text-[#191919] mb-2">Meet Your Pet Community</h2>
          <p className="text-[#666666] text-sm md:text-base leading-relaxed mb-6">
            See what&apos;s happening around you — real sitters, lost pet alerts, neighborhood discussions and more.
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
              padding: '14px 32px',
              borderRadius: '50px',
              fontSize: '16px',
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

      {/* FOOTER */}
      <footer className="hidden md:block w-full px-6 md:px-[48px] py-16" style={{ backgroundColor: '#191919', color: '#FFFFFF' }}>
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
              <li><Link href="/explore#how" style={{ color: '#AAAAAA', textDecoration: 'none' }}>How it works</Link></li>
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
  );
}
