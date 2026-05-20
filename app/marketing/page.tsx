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
          <h1 className="text-[32px] font-[800] text-[#191919] tracking-tight mb-3">Brand Marketing Ads</h1>
          <p className="text-[16px] text-[#666666] max-w-[700px] mx-auto leading-relaxed">
            Generate and download high-impact, premium **1080x1080px square** promo banners matching Lumo Bites' cream brand aesthetic.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 justify-items-center">
          
          {/* Ad 1 Card */}
          <div className="bg-white border border-[#E8DDD4] p-6 rounded-[28px] shadow-sm flex flex-col items-center w-full max-w-[480px]">
            <div className="w-full flex items-center justify-between mb-4 border-b border-[#F5EDE4] pb-4">
              <div>
                <h3 className="font-bold text-[#191919] text-[18px]">1. Pet Twin Promo (Cream Theme)</h3>
                <p className="text-xs text-[#999999]">Instagram Square Banner (1080x1080)</p>
              </div>
              <button
                onClick={() => downloadAd(1, ad1Ref, 'lumo_bites_pet_twin_ad_premium.png')}
                disabled={isRendering !== null}
                className="bg-[#8B5E3C] text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#724C2F] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                {isRendering === 'lumo_bites_pet_twin_ad_premium.png' ? (
                  <>⌛ Rendering...</>
                ) : (
                  <>📥 Download PNG</>
                )}
              </button>
            </div>

            {/* Ad 1 Frame Container (Scaled for display) */}
            <div className="relative border border-[#E8DDD4] shadow-2xl rounded-2xl overflow-hidden bg-[#FDFAF7]" style={{ width: '378px', height: '378px' }}>
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
                  backgroundColor: '#FDFAF7',
                  border: '16px solid #FDFAF7',
                  boxSizing: 'border-box',
                  position: 'relative',
                  overflow: 'hidden',
                  fontFamily: '"Outfit", "Inter", -apple-system, BlinkMacSystemFont, sans-serif'
                }}
              >
                {/* Premium Soft Cream Ambient Spotlight Overlays */}
                <div style={{ position: 'absolute', top: '-100px', left: '-50px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139, 94, 60, 0.04) 0%, rgba(139, 94, 60, 0) 70%)', pointerEvents: 'none', zIndex: 1 }}></div>
                <div style={{ position: 'absolute', bottom: '-80px', right: '-80px', width: '550px', height: '550px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(193, 125, 60, 0.05) 0%, rgba(193, 125, 60, 0) 70%)', pointerEvents: 'none', zIndex: 1 }}></div>

                {/* Thin Elegant Gold/Brown Accent Inner Border */}
                <div style={{ position: 'absolute', inset: '16px', border: '1px solid rgba(139, 94, 60, 0.15)', borderRadius: '12px', pointerEvents: 'none', zIndex: 2 }}></div>

                {/* Top Badge */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px', zIndex: 3 }}>
                  <div style={{ backgroundColor: 'rgba(139, 94, 60, 0.05)', border: '1.5px solid rgba(139, 94, 60, 0.6)', color: '#8B5E3C', fontSize: '15px', fontWeight: '900', letterSpacing: '0.22em', padding: '12px 32px', borderRadius: '100px', textTransform: 'uppercase' }}>
                    ✨ FREE &middot; NO SIGN-UP NEEDED
                  </div>
                </div>

                {/* Hero Headline */}
                <div style={{ textAlign: 'center', margin: '15px 0', zIndex: 3 }}>
                  <h2 style={{ fontSize: '84px', fontWeight: '950', color: '#191919', letterSpacing: '-0.04em', lineHeight: 1.05, margin: '0 0 16px 0' }}>
                    Which pet are <span style={{ background: 'linear-gradient(135deg, #C17D3C 0%, #8B5E3C 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>YOU?</span>
                  </h2>
                  <p style={{ fontSize: '26px', color: '#666666', fontWeight: '500', margin: 0, letterSpacing: '0.02em' }}>
                    Upload your selfie &rarr; Find your pet twin in seconds
                  </p>
                </div>

                {/* Two Glowing Circle Photos Side-By-Side */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '26px', zIndex: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
                    {/* Left: Premium SVG Silhouette Avatar (No real human photo) */}
                    <div style={{ width: '220px', height: '220px', borderRadius: '50%', border: '4px solid #8B5E3C', boxShadow: '0 10px 30px rgba(139, 94, 60, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#FDF9F5' }}>
                      <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#8B5E3C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>

                    {/* Separator Glowing Paw Print */}
                    <div style={{ fontSize: '64px', color: '#C17D3C', transform: 'translateY(-2px)' }}>🐾</div>

                    {/* Right: Real Dog Photo cropped as Circle */}
                    <div style={{ width: '220px', height: '220px', borderRadius: '50%', border: '4px solid #8B5E3C', boxShadow: '0 10px 30px rgba(139, 94, 60, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#FDF9F5' }}>
                      <img src="/dog.jpg" alt="Pet Twin Dog" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </div>
                  
                  {/* Match Badge */}
                  <div style={{ background: 'linear-gradient(135deg, #C17D3C 0%, #8B5E3C 100%)', color: '#FFFFFF', fontSize: '22px', fontWeight: '950', letterSpacing: '0.14em', padding: '14px 48px', borderRadius: '100px', boxShadow: '0 8px 25px rgba(139, 94, 60, 0.25)' }}>
                    91% MATCH ✨
                  </div>
                </div>

                {/* Elegant Italic Quote in Light Gray */}
                <div style={{ padding: '0 24px', textAlign: 'center', zIndex: 3 }}>
                  <div style={{ background: '#FFFFFF', border: '1px solid #E8DDD4', padding: '28px 40px', borderRadius: '24px', boxShadow: '0 15px 35px rgba(139, 94, 60, 0.08)' }}>
                    <p style={{ fontFamily: 'Georgia, serif', fontSize: '25px', fontStyle: 'italic', color: '#444444', margin: 0, lineHeight: 1.6, letterSpacing: '0.02em' }}>
                      &ldquo;The kind who looks serious in meetings but has the best stories at happy hour.&rdquo;
                    </p>
                  </div>
                </div>

                {/* Styled Brown CTA Button with White Text */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', zIndex: 3 }}>
                  <div style={{ background: 'linear-gradient(135deg, #8B5E3C 0%, #724C2F 100%)', color: '#FFFFFF', fontSize: '26px', fontWeight: '800', padding: '22px 64px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(139, 94, 60, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: '1px solid rgba(255, 255, 255, 0.1)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    <span>Find Your Pet Twin Free</span>
                    <span style={{ fontSize: '32px', lineHeight: 0, marginLeft: '6px', verticalAlign: 'middle' }}>&rarr;</span>
                  </div>
                </div>

                {/* Footer Brand Stripe */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #E8DDD4', paddingTop: '24px', marginTop: '10px', zIndex: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="/Logo.png" alt="Lumo Bites" style={{ height: '48px', width: 'auto' }} />
                    <sup style={{ fontSize: '10px', color: '#8B5E3C', fontWeight: 'bold', marginLeft: '2px', alignSelf: 'flex-start', marginTop: '6px' }}>™</sup>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#8B5E3C', letterSpacing: '0.05em' }}>
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
                <h3 className="font-bold text-[#191919] text-[18px]">2. Safety Scanner Promo (Cream Theme)</h3>
                <p className="text-xs text-[#999999]">Instagram Square Banner (1080x1080)</p>
              </div>
              <button
                onClick={() => downloadAd(2, ad2Ref, 'lumo_bites_scanner_ad_premium.png')}
                disabled={isRendering !== null}
                className="bg-[#8B5E3C] text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#724C2F] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                {isRendering === 'lumo_bites_scanner_ad_premium.png' ? (
                  <>⌛ Rendering...</>
                ) : (
                  <>📥 Download PNG</>
                )}
              </button>
            </div>

            {/* Ad 2 Frame Container (Scaled for display) */}
            <div className="relative border border-[#E8DDD4] shadow-2xl rounded-2xl overflow-hidden bg-[#FDFAF7]" style={{ width: '378px', height: '378px' }}>
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
                  backgroundColor: '#FDFAF7',
                  border: '16px solid #FDFAF7',
                  boxSizing: 'border-box',
                  position: 'relative',
                  overflow: 'hidden',
                  fontFamily: '"Outfit", "Inter", -apple-system, BlinkMacSystemFont, sans-serif'
                }}
              >
                {/* Premium Soft Cream Ambient Spotlight Overlays */}
                <div style={{ position: 'absolute', top: '-100px', left: '-50px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.03) 0%, rgba(16, 185, 129, 0) 70%)', pointerEvents: 'none', zIndex: 1 }}></div>
                <div style={{ position: 'absolute', bottom: '-80px', right: '-80px', width: '550px', height: '550px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(239, 68, 68, 0.03) 0%, rgba(239, 68, 68, 0) 70%)', pointerEvents: 'none', zIndex: 1 }}></div>

                {/* Thin Inner Border */}
                <div style={{ position: 'absolute', inset: '16px', border: '1px solid rgba(139, 94, 60, 0.15)', borderRadius: '12px', pointerEvents: 'none', zIndex: 2 }}></div>

                {/* Top Badge */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px', zIndex: 3 }}>
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1.5px solid rgba(16, 185, 129, 0.6)', color: '#10B981', fontSize: '15px', fontWeight: '900', letterSpacing: '0.22em', padding: '12px 32px', borderRadius: '100px', textTransform: 'uppercase' }}>
                    🛡️ AI INGREDIENT SAFETY SCANNER
                  </div>
                </div>

                {/* Hero Headline */}
                <div style={{ textAlign: 'center', margin: '15px 0', zIndex: 3 }}>
                  <h2 style={{ fontSize: '84px', fontWeight: '950', color: '#191919', letterSpacing: '-0.04em', lineHeight: 1.05, margin: '0 0 16px 0' }}>
                    Is your pet&apos;s food <span style={{ color: '#EF4444' }}>safe?</span>
                  </h2>
                  <p style={{ fontSize: '26px', color: '#666666', fontWeight: '500', margin: 0, letterSpacing: '0.02em' }}>
                    Scan any label instantly &mdash; free automated AI safety check
                  </p>
                </div>

                {/* Glowing Grade Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3 }}>
                  <div style={{ display: 'flex', gap: '48px', width: '100%', justifyContent: 'center' }}>
                    
                    {/* Grade A Card */}
                    <div style={{ background: '#FFFFFF', border: '3px solid #10B981', padding: '36px 32px', borderRadius: '32px', width: '380px', textAlign: 'center', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.08)' }}>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: '#10B981', letterSpacing: '0.12em', marginBottom: '8px', textTransform: 'uppercase' }}>Premium Kibble</div>
                      <div style={{ fontSize: '120px', fontWeight: '950', color: '#10B981', lineHeight: 1, margin: '14px 0', fontFamily: 'system-ui, sans-serif' }}>
                        A
                      </div>
                      <div style={{ backgroundColor: '#10B981', color: '#FFFFFF', fontSize: '17px', fontWeight: '950', padding: '10px 24px', borderRadius: '100px', display: 'inline-block', letterSpacing: '0.06em' }}>
                        VERIFIED SAFE ✅
                      </div>
                    </div>

                    {/* Grade D Card */}
                    <div style={{ background: '#FFFFFF', border: '3px solid #EF4444', padding: '36px 32px', borderRadius: '32px', width: '380px', textAlign: 'center', boxShadow: '0 10px 30px rgba(239, 68, 68, 0.08)' }}>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: '#EF4444', letterSpacing: '0.12em', marginBottom: '8px', textTransform: 'uppercase' }}>Generic Brand</div>
                      <div style={{ fontSize: '120px', fontWeight: '950', color: '#EF4444', lineHeight: 1, margin: '14px 0', fontFamily: 'system-ui, sans-serif' }}>
                        D
                      </div>
                      <div style={{ backgroundColor: '#EF4444', color: '#FFFFFF', fontSize: '17px', fontWeight: '950', padding: '10px 24px', borderRadius: '100px', display: 'inline-block', letterSpacing: '0.06em' }}>
                        TOXINS DETECTED ⚠️
                      </div>
                    </div>

                  </div>
                </div>

                {/* Warning copy block */}
                <div style={{ textAlign: 'center', padding: '0 48px', zIndex: 3 }}>
                  <div style={{ background: '#FFFFFF', border: '1px solid #E8DDD4', padding: '24px 36px', borderRadius: '24px', boxShadow: '0 15px 35px rgba(139, 94, 60, 0.08)' }}>
                    <p style={{ fontSize: '24px', fontWeight: '600', color: '#333333', margin: 0, lineHeight: 1.55, letterSpacing: '0.01em' }}>
                      <span style={{ color: '#EF4444', fontWeight: '800' }}>Warning:</span> BHA, artificial colorings, and thickeners are active in 64% of commercial brands. Scan your label now.
                    </p>
                  </div>
                </div>

                {/* Red CTA Button */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', zIndex: 3 }}>
                  <div style={{ background: 'linear-gradient(135deg, #8B5E3C 0%, #724C2F 100%)', color: '#FFFFFF', fontSize: '26px', fontWeight: '800', padding: '22px 64px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(139, 94, 60, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: '1px solid rgba(255, 255, 255, 0.1)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    <span>Check Free Now</span>
                    <span style={{ fontSize: '32px', lineHeight: 0, marginLeft: '6px', verticalAlign: 'middle' }}>&rarr;</span>
                  </div>
                </div>

                {/* Footer Brand Stripe */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #E8DDD4', paddingTop: '24px', marginTop: '10px', zIndex: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="/Logo.png" alt="Lumo Bites" style={{ height: '48px', width: 'auto' }} />
                    <sup style={{ fontSize: '10px', color: '#8B5E3C', fontWeight: 'bold', marginLeft: '2px', alignSelf: 'flex-start', marginTop: '6px' }}>™</sup>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#8B5E3C', letterSpacing: '0.05em' }}>
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
