'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function MarketingPage() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState('');
  
  // Ref for rendering html2canvas
  const ad1Ref = useRef<HTMLDivElement>(null);
  const ad2Ref = useRef<HTMLDivElement>(null);
  const [html2canvas, setHtml2canvas] = useState<any>(null);
  const [isRendering, setIsRendering] = useState<string | null>(null);

  // Load html2canvas dynamically on client side
  useEffect(() => {
    import('html2canvas').then((module) => {
      setHtml2canvas(() => module.default);
    });

    // Check if already authorized in current session
    const authStatus = sessionStorage.getItem('lumo_marketing_auth');
    if (authStatus === 'true') {
      setIsAuthorized(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'lumo2026') {
      setIsAuthorized(true);
      setError('');
      sessionStorage.setItem('lumo_marketing_auth', 'true');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    setPassword('');
    sessionStorage.removeItem('lumo_marketing_auth');
  };

  const downloadAd = async (adNum: number, adRef: React.RefObject<HTMLDivElement | null>, filename: string) => {
    if (!html2canvas || !adRef.current) return;
    
    setIsRendering(filename);
    try {
      // Create canvas from ad element
      const canvas = await html2canvas(adRef.current, {
        useCORS: true,
        scale: 2, // 2x scale for crystal-clear retina rendering
        allowTaint: true,
        backgroundColor: '#FDFAF7',
        logging: false
      });
      
      // Convert to PNG data URL
      const dataUrl = canvas.toDataURL('image/png');
      
      // Trigger download
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error generating image:', err);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsRendering(null);
    }
  };

  // Login view
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFAF7] px-6 py-12 font-sans text-[#555555]">
        <div className="w-full max-w-[420px] bg-white border border-[#E8DDD4] rounded-3xl p-8 shadow-xl text-center">
          <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', transform: 'scale(1.3)' }}>
                <img src="/Logo.png" alt="Lumo Bites" className="h-[40px] w-auto block object-contain" />
                <sup style={{ fontSize: '10px', color: '#8B5A2B', fontWeight: 'bold', alignSelf: 'flex-start', marginTop: '5px', marginLeft: '2px', fontFamily: 'sans-serif' }}>™</sup>
              </div>
            </Link>
          </div>
          
          <h2 className="text-[22px] font-[800] text-[#191919] tracking-tight mb-2">Marketing Portal</h2>
          <p className="text-[14px] text-[#666666] mb-8 leading-relaxed">
            Enter your secret password to generate and download ready-to-post social media promo ad banners.
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="text-left">
              <label className="block text-xs font-bold text-[#8B5E3C] uppercase tracking-wider mb-2">Access Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#FDF9F5] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[16px] text-[#191919] focus:outline-none focus:border-[#8B5E3C] focus:ring-1 focus:ring-[#8B5E3C] transition-all"
                autoFocus
              />
            </div>
            
            {error && (
              <p className="text-red-500 text-xs font-bold text-left mt-1">⚠️ {error}</p>
            )}

            <button
              type="submit"
              className="w-full bg-[#8B5E3C] text-white font-bold text-sm h-12 rounded-xl hover:bg-[#724C2F] active:scale-[0.98] transition-all mt-2 cursor-pointer shadow-md"
            >
              Access Dashboard →
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#F0E6DD]">
            <Link href="/" className="text-[#8B5E3C] font-bold text-xs hover:underline decoration-2">
              ← Return to homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard view
  return (
    <div className="min-h-screen bg-[#FDFAF7] font-sans text-[#555555]">
      {/* Top Banner */}
      <header className="bg-white border-b border-[#EEEEEE] px-6 md:px-[48px] h-[72px] flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', transform: 'scale(1.4)', transformOrigin: 'left center' }} className="origin-left">
            <img src="/Logo.png" alt="Lumo Bites" className="h-[40px] w-auto block object-contain" />
            <sup style={{ fontSize: '10px', color: '#8B5A2B', fontWeight: 'bold', alignSelf: 'flex-start', marginTop: '5px', marginLeft: '2px', fontFamily: 'sans-serif' }}>™</sup>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-[12px] bg-[#8B5E3C]/10 text-[#8B5E3C] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
            🔑 Admin Portal
          </span>
          <button 
            onClick={handleLogout}
            className="text-[13px] font-bold text-[#D9534F] border border-[#F5C6CB] bg-[#FDF2F2] px-3.5 py-1.5 rounded-xl hover:bg-[#FBE3E4] transition-all cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-[32px] font-[800] text-[#191919] tracking-tight mb-3">Premium Social Ad Generator</h1>
          <p className="text-[16px] text-[#666666] max-w-[700px] mx-auto leading-relaxed">
            Generate and download high-end, clean, and professional **1080x1080px square** marketing ad banners. Perfect for premium social feeds like Instagram and LinkedIn.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 justify-items-center">
          
          {/* Ad 1 Card */}
          <div className="bg-white border border-[#E8DDD4] p-6 rounded-[28px] shadow-sm flex flex-col items-center w-full max-w-[480px]">
            <div className="w-full flex items-center justify-between mb-4 border-b border-[#F5EDE4] pb-4">
              <div>
                <h3 className="font-bold text-[#191919] text-[18px]">1. Pet Twin Promo</h3>
                <p className="text-xs text-[#999999]">Instagram Square Banner (1080x1080)</p>
              </div>
              <button
                onClick={() => downloadAd(1, ad1Ref, 'lumo_bites_pet_twin_ad.png')}
                disabled={isRendering !== null}
                className="bg-[#8B5E3C] text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#724C2F] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                {isRendering === 'lumo_bites_pet_twin_ad.png' ? (
                  <>⌛ Rendering...</>
                ) : (
                  <>📥 Download PNG</>
                )}
              </button>
            </div>

            {/* Ad 1 Frame Container (Scaled for display) */}
            <div className="relative border border-[#E2E8F0] shadow-md rounded-2xl overflow-hidden bg-[#FDFAF7]" style={{ width: '378px', height: '378px' }}>
              <div 
                ref={ad1Ref}
                className="absolute origin-top-left"
                style={{ 
                  width: '1080px', 
                  height: '1080px', 
                  transform: 'scale(0.35)', 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '72px',
                  background: 'linear-gradient(135deg, #FDFAF7 0%, #F5EDE4 100%)',
                  border: '16px solid #FDFAF7',
                  boxShadow: 'inset 0 0 80px rgba(139, 94, 60, 0.03)',
                  boxSizing: 'border-box',
                  fontFamily: '"Outfit", "Inter", -apple-system, BlinkMacSystemFont, sans-serif'
                }}
              >
                {/* Thin Elegant Inner Border */}
                <div style={{ position: 'absolute', inset: '16px', border: '1px solid rgba(139, 94, 60, 0.15)', borderRadius: '12px', pointerEvents: 'none', zIndex: 1 }}></div>

                {/* Top Badge */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px', zIndex: 2 }}>
                  <div style={{ backgroundColor: 'rgba(25, 25, 25, 0.04)', border: '1px solid rgba(25, 25, 25, 0.12)', color: '#191919', fontSize: '15px', fontWeight: '800', letterSpacing: '0.18em', padding: '10px 28px', borderRadius: '100px', textTransform: 'uppercase' }}>
                    ✦ FREE &middot; NO SIGN-UP NEEDED
                  </div>
                </div>

                {/* Hero Headline */}
                <div style={{ textAlign: 'center', margin: '30px 0', zIndex: 2 }}>
                  <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '78px', fontWeight: '900', color: '#191919', letterSpacing: '-0.02em', lineHeight: 1.15, margin: '0 0 16px 0' }}>
                    Which pet are <span style={{ color: '#8B5E3C', fontStyle: 'italic', fontWeight: '400' }}>YOU?</span>
                  </h2>
                  <p style={{ fontSize: '26px', color: '#555555', fontWeight: '500', margin: 0, letterSpacing: '0.01em' }}>
                    Upload your selfie &rarr; Find your pet twin in seconds
                  </p>
                </div>

                {/* High-End Vector Comparison Visual */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', zIndex: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
                    {/* Left: Premium Minimalist Person Silhouette SVG */}
                    <div style={{ width: '200px', height: '200px', borderRadius: '50%', backgroundColor: '#FFFFFF', border: '1px solid rgba(139, 94, 60, 0.25)', boxShadow: '0 15px 35px rgba(139, 94, 60, 0.08)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#8B5E3C" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>

                    {/* Separator Sparkle */}
                    <div style={{ fontSize: '48px', color: '#8B5E3C', opacity: 0.8, fontWeight: 'bold' }}>✦</div>

                    {/* Right: Premium Minimalist Dog Silhouette SVG */}
                    <div style={{ width: '200px', height: '200px', borderRadius: '50%', backgroundColor: '#FFFFFF', border: '1px solid rgba(139, 94, 60, 0.25)', boxShadow: '0 15px 35px rgba(139, 94, 60, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#8B5E3C" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5c.5-1.5 2-2.5 3.5-2.5s2.5 1 2.5 2.5c0 3-4 6-6 7.5-2-1.5-6-4.5-6-7.5C6 3.5 7 2.5 8.5 2.5S11.5 3.5 12 5z" fill="rgba(139, 94, 60, 0.05)" />
                        <path d="M18 10h.01M6 10h.01M9 16c1 1.5 3 1.5 4 0" />
                        <path d="M19 14.5a3 3 0 0 1-6 0c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5z" />
                        <path d="M5 14.5a3 3 0 0 0 6 0c0-1.5-1.5-2.5-3-2.5s-3 1-3 2.5z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Styled Premium Match Label */}
                  <div style={{ background: 'linear-gradient(135deg, #191919 0%, #333333 100%)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF', fontSize: '18px', fontWeight: '800', letterSpacing: '0.12em', padding: '12px 36px', borderRadius: '100px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
                    91% MATCH 🎯
                  </div>
                </div>

                {/* Elegant Serif Personality Quote */}
                <div style={{ padding: '0 24px', textAlign: 'center', zIndex: 2 }}>
                  <div style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(139, 94, 60, 0.12)', padding: '24px 36px', borderRadius: '20px', boxShadow: '0 8px 24px rgba(139, 94, 60, 0.03)', position: 'relative' }}>
                    {/* Visual Quote Mark */}
                    <span style={{ fontFamily: 'Georgia, serif', fontSize: '64px', color: 'rgba(139, 94, 60, 0.15)', position: 'absolute', top: '-15px', left: '16px', lineHeight: 1 }}>“</span>
                    <p style={{ fontFamily: 'Georgia, serif', fontSize: '23px', fontStyle: 'italic', color: '#444444', margin: 0, lineHeight: 1.55 }}>
                      The kind who looks serious in meetings but has the best stories at happy hour.
                    </p>
                  </div>
                </div>

                {/* Elegant Dark CTA Button */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px', zIndex: 2 }}>
                  <div style={{ backgroundColor: '#191919', color: '#FFFFFF', fontSize: '24px', fontWeight: '700', padding: '22px 56px', borderRadius: '14px', boxShadow: '0 15px 35px rgba(25, 25, 25, 0.18)', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span>Find Your Pet Twin Free</span>
                    <span style={{ fontSize: '28px', lineHeight: 0, marginLeft: '4px', verticalAlign: 'middle' }}>&rarr;</span>
                  </div>
                </div>

                {/* Footer Brand Stripe */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(139, 94, 60, 0.15)', paddingTop: '24px', marginTop: '12px', zIndex: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="/Logo.png" alt="Lumo Bites" style={{ height: '48px', width: 'auto' }} />
                    <sup style={{ fontSize: '10px', color: '#8B5A2B', fontWeight: 'bold', marginLeft: '2px', alignSelf: 'flex-start', marginTop: '6px' }}>™</sup>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#8B5E3C', letterSpacing: '0.04em' }}>
                    lumobites.net/twin
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ad 2 Card */}
          <div className="bg-white border border-[#E8DDD4] p-6 rounded-[28px] shadow-sm flex flex-col items-center w-full max-w-[480px]">
            <div className="w-full flex items-center justify-between mb-4 border-b border-[#F5EDE4] pb-4">
              <div>
                <h3 className="font-bold text-[#191919] text-[18px]">2. Safety Scanner Promo</h3>
                <p className="text-xs text-[#999999]">Instagram Square Banner (1080x1080)</p>
              </div>
              <button
                onClick={() => downloadAd(2, ad2Ref, 'lumo_bites_scanner_ad.png')}
                disabled={isRendering !== null}
                className="bg-[#8B5E3C] text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#724C2F] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                {isRendering === 'lumo_bites_scanner_ad.png' ? (
                  <>⌛ Rendering...</>
                ) : (
                  <>📥 Download PNG</>
                )}
              </button>
            </div>

            {/* Ad 2 Frame Container (Scaled for display) */}
            <div className="relative border border-[#E2E8F0] shadow-md rounded-2xl overflow-hidden bg-[#FDFAF7]" style={{ width: '378px', height: '378px' }}>
              <div 
                ref={ad2Ref}
                className="absolute origin-top-left"
                style={{ 
                  width: '1080px', 
                  height: '1080px', 
                  transform: 'scale(0.35)', 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '72px',
                  background: 'linear-gradient(135deg, #FDFAF7 0%, #F5EDE4 100%)',
                  border: '16px solid #FDFAF7',
                  boxShadow: 'inset 0 0 80px rgba(139, 94, 60, 0.03)',
                  boxSizing: 'border-box',
                  fontFamily: '"Outfit", "Inter", -apple-system, BlinkMacSystemFont, sans-serif'
                }}
              >
                {/* Thin Inner Border */}
                <div style={{ position: 'absolute', inset: '16px', border: '1px solid rgba(139, 94, 60, 0.15)', borderRadius: '12px', pointerEvents: 'none', zIndex: 1 }}></div>

                {/* Top Badge */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px', zIndex: 2 }}>
                  <div style={{ backgroundColor: 'rgba(25, 25, 25, 0.04)', border: '1px solid rgba(25, 25, 25, 0.12)', color: '#191919', fontSize: '15px', fontWeight: '800', letterSpacing: '0.18em', padding: '10px 28px', borderRadius: '100px', textTransform: 'uppercase' }}>
                    ✦ FREE &middot; AI INGREDIENT SAFETY CHECK
                  </div>
                </div>

                {/* Hero Headline */}
                <div style={{ textAlign: 'center', margin: '30px 0', zIndex: 2 }}>
                  <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '74px', fontWeight: '900', color: '#191919', letterSpacing: '-0.03em', lineHeight: 1.15, margin: '0 0 16px 0' }}>
                    Is your pet&apos;s food <span style={{ color: '#D97706', fontStyle: 'italic', fontWeight: '400' }}>safe?</span>
                  </h2>
                  <p style={{ fontSize: '26px', color: '#555555', fontWeight: '500', margin: 0, letterSpacing: '0.01em' }}>
                    Scan any label instantly &mdash; free AI safety analysis
                  </p>
                </div>

                {/* Highly-Professional App Grade Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                  <div style={{ display: 'flex', gap: '36px', width: '100%', justifyContent: 'center' }}>
                    
                    {/* Grade A Premium Interface Card */}
                    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(139, 94, 60, 0.18)', padding: '28px', borderRadius: '24px', width: '380px', textAlign: 'left', boxShadow: '0 15px 35px rgba(139, 94, 60, 0.05)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'space-between', justifyContent: 'space-between', borderBottom: '1px solid #F5EDE4', paddingBottom: '10px' }}>
                        <span style={{ fontSize: '18px', fontWeight: '800', color: '#191919' }}>Organic Kibble</span>
                        <span style={{ fontSize: '13px', color: '#059669', backgroundColor: '#D1FAE5', padding: '4px 10px', borderRadius: '100px', fontWeight: '700' }}>Verified safe</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '72px', height: '72px', borderRadius: '16px', backgroundColor: '#E6F4EA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '900', color: '#137333' }}>
                          A
                        </div>
                        <div>
                          <div style={{ fontSize: '20px', fontWeight: '800', color: '#137333' }}>Grade Excellent</div>
                          <div style={{ fontSize: '14px', color: '#555555', marginTop: '2px' }}>Ingredients score 98/100</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', color: '#777777', lineHeight: 1.4, backgroundColor: '#FAF8F5', padding: '10px 14px', borderRadius: '10px' }}>
                        <span style={{ fontWeight: '700', color: '#191919' }}>Active:</span> Organic Chicken, Sweet Potato, Blueberries, Salmon Oil. Zero fillers.
                      </div>
                    </div>

                    {/* Grade D Premium Interface Card */}
                    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(139, 94, 60, 0.18)', padding: '28px', borderRadius: '24px', width: '380px', textAlign: 'left', boxShadow: '0 15px 35px rgba(139, 94, 60, 0.05)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'space-between', justifyContent: 'space-between', borderBottom: '1px solid #F5EDE4', paddingBottom: '10px' }}>
                        <span style={{ fontSize: '18px', fontWeight: '800', color: '#191919' }}>Generic Brand</span>
                        <span style={{ fontSize: '13px', color: '#D97706', backgroundColor: '#FEF3C7', padding: '4px 10px', borderRadius: '100px', fontWeight: '700' }}>Warning flagged</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '72px', height: '72px', borderRadius: '16px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '900', color: '#B45309' }}>
                          D
                        </div>
                        <div>
                          <div style={{ fontSize: '20px', fontWeight: '800', color: '#B45309' }}>Grade Poor</div>
                          <div style={{ fontSize: '14px', color: '#555555', marginTop: '2px' }}>Toxins &amp; preservatives detected</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', color: '#777777', lineHeight: 1.4, backgroundColor: '#FAF8F5', padding: '10px 14px', borderRadius: '10px' }}>
                        <span style={{ fontWeight: '700', color: '#D9534F' }}>Triggers:</span> BHA preservative, Artificial Red 40, Carrageenan thickener.
                      </div>
                    </div>

                  </div>
                </div>

                {/* Additional Safety scanner copy */}
                <div style={{ textAlign: 'center', padding: '0 32px', zIndex: 2 }}>
                  <p style={{ fontSize: '24px', fontWeight: '600', color: '#444444', margin: 0, lineHeight: 1.5, letterSpacing: '-0.01em' }}>
                    Our AI cross-references ingredients against clinical research and live FDA recall feeds in under 3 seconds. Protect your pet today! 🛡️
                  </p>
                </div>

                {/* Elegant Dark CTA Button */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px', zIndex: 2 }}>
                  <div style={{ backgroundColor: '#191919', color: '#FFFFFF', fontSize: '24px', fontWeight: '700', padding: '22px 56px', borderRadius: '14px', boxShadow: '0 15px 35px rgba(25, 25, 25, 0.18)', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span>Check Your Pet&apos;s Food Free</span>
                    <span style={{ fontSize: '28px', lineHeight: 0, marginLeft: '4px', verticalAlign: 'middle' }}>&rarr;</span>
                  </div>
                </div>

                {/* Footer Brand Stripe */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(139, 94, 60, 0.15)', paddingTop: '24px', marginTop: '12px', zIndex: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="/Logo.png" alt="Lumo Bites" style={{ height: '48px', width: 'auto' }} />
                    <sup style={{ fontSize: '10px', color: '#8B5A2B', fontWeight: 'bold', marginLeft: '2px', alignSelf: 'flex-start', marginTop: '6px' }}>™</sup>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#8B5E3C', letterSpacing: '0.04em' }}>
                    lumobites.net/scan
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Usage notes */}
        <div className="max-w-[800px] mx-auto mt-16 bg-[#F5EDE4]/60 border border-[#E8D5C0] rounded-2xl p-6 text-[14px] leading-relaxed">
          <h4 className="font-bold text-[#191919] mb-2">💡 Tips for Best Output Quality</h4>
          <ul className="list-disc pl-5 space-y-1 text-[#666666]">
            <li>Downloading triggers a **2x high-resolution canvas capture** (exactly 2160x2160px output size) to ensure crystal clear clarity on high-DPI social media feeds.</li>
            <li>Images will be downloaded as clean PNG files directly to your device.</li>
            <li>These designs are fully CSS-styled standard HTML nodes and dynamically adapt if you make modifications in this portal.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
