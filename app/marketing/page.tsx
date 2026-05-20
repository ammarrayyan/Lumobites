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
          <h1 className="text-[32px] font-[800] text-[#191919] tracking-tight mb-3">Ready-To-Post Promo Ads</h1>
          <p className="text-[16px] text-[#666666] max-w-[600px] mx-auto leading-relaxed">
            Generate pixel-perfect **1080x1080px (1:1 Square Ratio)** ad banners designed for Instagram, Facebook, and Twitter. High-fidelity rendering makes them perfect for social media feeds.
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
                className="absolute origin-top-left bg-[#FDFAF7]"
                style={{ 
                  width: '1080px', 
                  height: '1080px', 
                  transform: 'scale(0.35)', 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '64px',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
              >
                {/* Top Badge */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                  <div style={{ backgroundColor: '#191919', color: '#FFFFFF', fontSize: '20px', fontWeight: '800', letterSpacing: '0.12em', padding: '12px 32px', borderRadius: '100px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    ✨ FREE · NO SIGN-UP NEEDED
                  </div>
                </div>

                {/* Hero Content */}
                <div style={{ textAlign: 'center', margin: '40px 0' }}>
                  <h2 style={{ fontSize: '76px', fontWeight: '900', color: '#191919', letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 16px 0' }}>
                    Which pet are <span style={{ color: '#C17D3C' }}>YOU?</span>
                  </h2>
                  <p style={{ fontSize: '28px', color: '#666666', fontWeight: '500', margin: 0 }}>
                    Upload your selfie &rarr; Find your pet twin in seconds
                  </p>
                </div>

                {/* Twin Comparison Visual */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                    <div style={{ width: '180px', height: '180px', borderRadius: '50%', backgroundColor: '#FFFFFF', border: '6px solid #E8DDD4', boxShadow: '0 8px 24px rgba(139, 94, 60, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '96px' }}>
                      👩‍💻
                    </div>
                    <div style={{ fontSize: '64px', color: '#8B5E3C', animation: 'bounce 1s infinite' }}>🐾</div>
                    <div style={{ width: '180px', height: '180px', borderRadius: '50%', backgroundColor: '#FFFFFF', border: '6px solid #E8DDD4', boxShadow: '0 8px 24px rgba(139, 94, 60, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '96px' }}>
                      🐶
                    </div>
                  </div>
                  
                  <div style={{ backgroundColor: '#191919', color: '#FFFFFF', fontSize: '22px', fontWeight: '800', letterSpacing: '0.08em', padding: '10px 24px', borderRadius: '100px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                    91% MATCH 🎯
                  </div>
                </div>

                {/* Personality Quote */}
                <div style={{ padding: '0 48px', textAlign: 'center' }}>
                  <p style={{ fontSize: '24px', fontStyle: 'italic', color: '#666666', margin: 0, lineHeight: 1.5, backgroundColor: 'rgba(139, 94, 60, 0.04)', padding: '24px 32px', borderRadius: '24px', border: '1px dashed #E8DDD4' }}>
                    &ldquo;The kind who looks serious in meetings but has the best stories at happy hour&rdquo;
                  </p>
                </div>

                {/* CTA Button */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                  <div style={{ backgroundColor: '#8B5E3C', color: '#FFFFFF', fontSize: '28px', fontWeight: '800', padding: '22px 56px', borderRadius: '100px', boxShadow: '0 12px 30px rgba(139, 94, 60, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                    Find Your Pet Twin Free &rarr;
                  </div>
                </div>

                {/* Footer Brand Stripe */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '2px solid #E8DDD4', paddingTop: '28px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="/Logo.png" alt="Lumo Bites" style={{ height: '56px', width: 'auto' }} />
                    <sup style={{ fontSize: '12px', color: '#8B5A2B', fontWeight: 'bold', marginLeft: '2px', alignSelf: 'flex-start', marginTop: '10px' }}>™</sup>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#8B5E3C', letterSpacing: '0.02em' }}>
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
                className="absolute origin-top-left bg-[#FDFAF7]"
                style={{ 
                  width: '1080px', 
                  height: '1080px', 
                  transform: 'scale(0.35)', 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '64px',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
              >
                {/* Top Badge */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                  <div style={{ backgroundColor: '#191919', color: '#FFFFFF', fontSize: '20px', fontWeight: '800', letterSpacing: '0.12em', padding: '12px 32px', borderRadius: '100px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    ✨ FREE · AI INGREDIENT CHECK
                  </div>
                </div>

                {/* Hero Content */}
                <div style={{ textAlign: 'center', margin: '40px 0' }}>
                  <h2 style={{ fontSize: '74px', fontWeight: '950', color: '#191919', letterSpacing: '-0.04em', lineHeight: 1.1, margin: '0 0 16px 0' }}>
                    Is your pet&apos;s food <span style={{ color: '#D97706' }}>safe? 🔍</span>
                  </h2>
                  <p style={{ fontSize: '28px', color: '#666666', fontWeight: '500', margin: 0 }}>
                    Scan any pet food label instantly &mdash; free AI safety check
                  </p>
                </div>

                {/* Grade Badges Display */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
                  <div style={{ display: 'flex', gap: '32px', width: '100%', justifyContent: 'center' }}>
                    {/* Grade A Card */}
                    <div style={{ backgroundColor: '#FFFFFF', border: '4px solid #E8DDD4', padding: '36px', borderRadius: '32px', width: '300px', textAlign: 'center', boxShadow: '0 12px 36px rgba(139, 94, 60, 0.05)' }}>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#888888', marginBottom: '12px' }}>Premium Kibble</div>
                      <div style={{ backgroundColor: '#D1FAE5', color: '#065F46', fontSize: '32px', fontWeight: '800', padding: '16px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        Grade A ✅
                      </div>
                      <div style={{ fontSize: '18px', color: '#059669', fontWeight: '600', marginTop: '12px' }}>Toxin-Free &middot; Safe</div>
                    </div>

                    {/* Grade D Card */}
                    <div style={{ backgroundColor: '#FFFFFF', border: '4px solid #E8DDD4', padding: '36px', borderRadius: '32px', width: '300px', textAlign: 'center', boxShadow: '0 12px 36px rgba(139, 94, 60, 0.05)' }}>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#888888', marginBottom: '12px' }}>Generic Brand</div>
                      <div style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '32px', fontWeight: '800', padding: '16px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        Grade D ⚠️
                      </div>
                      <div style={{ fontSize: '18px', color: '#D97706', fontWeight: '600', marginTop: '12px' }}>Contains Carrageenan</div>
                    </div>
                  </div>
                </div>

                {/* Additional Safety scanner copy */}
                <div style={{ textAlign: 'center', padding: '0 48px' }}>
                  <p style={{ fontSize: '24px', fontWeight: '600', color: '#555555', margin: 0, lineHeight: 1.5 }}>
                    Our AI scans ingredients for hidden preservatives, artificial colors, and live FDA recalls in under 3 seconds! ⚡
                  </p>
                </div>

                {/* CTA Button */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                  <div style={{ backgroundColor: '#8B5E3C', color: '#FFFFFF', fontSize: '28px', fontWeight: '800', padding: '22px 56px', borderRadius: '100px', boxShadow: '0 12px 30px rgba(139, 94, 60, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                    Check Your Pet&apos;s Food Free &rarr;
                  </div>
                </div>

                {/* Footer Brand Stripe */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '2px solid #E8DDD4', paddingTop: '28px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="/Logo.png" alt="Lumo Bites" style={{ height: '56px', width: 'auto' }} />
                    <sup style={{ fontSize: '12px', color: '#8B5A2B', fontWeight: 'bold', marginLeft: '2px', alignSelf: 'flex-start', marginTop: '10px' }}>™</sup>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#8B5E3C', letterSpacing: '0.02em' }}>
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
