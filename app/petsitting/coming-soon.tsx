'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const ENABLED = process.env.NEXT_PUBLIC_PETSITTING_ENABLED === 'true';

export default function PetSittingGate() {
  if (ENABLED) {
    // Dynamically import and render the real page only when enabled
    const RealPage = require('./page-real').default;
    return <RealPage />;
  }
  return <ComingSoon />;
}

function ComingSoon() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FDFAF7] flex flex-col items-center justify-center px-4 py-20">
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-[#8B5E3C]/5 blur-3xl" />
          <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-[#C17D3C]/5 blur-3xl" />
        </div>

        <div className="relative z-10 text-center max-w-[560px] mx-auto">
          {/* Icon */}
          <div className="w-20 h-20 bg-[#F5EDE4] border border-[#E8D5C0] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
            <svg className="w-10 h-10 text-[#8B5E3C]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>

          {/* Label */}
          <p className="text-[#8B5E3C] text-xs font-bold tracking-[0.15em] uppercase mb-4">Coming Soon</p>

          {/* Headline */}
          <h1 className="font-black text-[#191919] leading-tight tracking-tight mb-5" style={{ fontSize: 'clamp(32px, 5vw, 52px)' }}>
            Pet Sitting is<br />
            <span className="text-[#8B5E3C]">almost here</span>
          </h1>

          {/* Subtitle */}
          <p className="text-[#666666] text-lg leading-relaxed mb-10 max-w-[440px] mx-auto">
            We&apos;re building something great — a trusted marketplace to find local pet sitters, completely free. Be the first to know when we launch.
          </p>

          {/* Feature previews */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { icon: '📍', label: 'Local sitters' },
              { icon: '✅', label: 'Verified profiles' },
              { icon: '💰', label: 'No commission' },
            ].map(({ icon, label }) => (
              <div key={label} className="bg-white border border-[#E8DDD4] rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm">
                <span className="text-2xl">{icon}</span>
                <span className="text-xs font-semibold text-[#4A3E3D]">{label}</span>
              </div>
            ))}
          </div>

          {/* Email sign-up */}
          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-[420px] mx-auto mb-8">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 bg-white border border-[#E8DDD4] rounded-full px-5 py-3 text-sm text-[#333] outline-none focus:border-[#8B5E3C] transition-colors shadow-sm"
              />
              <button
                type="submit"
                className="bg-[#8B5E3C] text-white font-bold px-6 py-3 rounded-full hover:bg-[#7A5234] transition-colors shadow-sm whitespace-nowrap"
              >
                Notify Me
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-center gap-2 text-green-600 font-semibold mb-8">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              You&apos;re on the list! We&apos;ll let you know when we launch.
            </div>
          )}

          {/* Back link */}
          <Link href="/" className="text-[#8B5E3C] text-sm font-semibold hover:underline">
            &larr; Back to Lumo Bites
          </Link>
        </div>
      </main>
    </>
  );
}
