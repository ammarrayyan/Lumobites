'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

export default function TermsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showAgeCheck, setShowAgeCheck] = useState(false);
  const [ageDenied, setAgeDenied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const accepted = localStorage.getItem('lumo_terms_accepted') === 'true';
      const ageConfirmed = localStorage.getItem('lumo_age_confirmed') === 'true';
      if (!accepted || !ageConfirmed) {
        setIsOpen(true);
        if (accepted && !ageConfirmed) {
          setShowAgeCheck(true);
        }
      }
    }
  }, []);

  const handleAccept = () => {
    if (!agreed) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem('lumo_terms_accepted', 'true');
      window.dispatchEvent(new Event('lumo-terms-accepted-update'));
    }
    setShowAgeCheck(true);
  };

  const handleAgeConfirm = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lumo_age_confirmed', 'true');
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  if (ageDenied) {
    return (
      <div className="fixed inset-0 bg-white z-[999999] flex flex-col items-center justify-center text-center px-6 font-sans">
        <h2 className="text-xl font-bold text-[#4A3E3D] mb-3">
          Access Restricted
        </h2>
        <p className="text-gray-500">
          Sorry, you must be 18 or older to use Lumo Bites.
        </p>
      </div>
    );
  }

  if (showAgeCheck) {
    return (
      <div className="fixed inset-0 bg-white z-[999999] flex flex-col items-center justify-center text-center px-6 font-sans">
        <img src="/Logo.png" alt="Lumo Bites" className="w-20 mb-6" />
        <h2 className="text-xl font-bold text-[#4A3E3D] mb-3">
          Age Verification
        </h2>
        <p className="text-gray-500 mb-8">
          You must be 18 or older to use Lumo Bites
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={handleAgeConfirm}
            className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white px-8 py-3 rounded-xl font-medium w-full cursor-pointer shadow-md"
          >
            I am 18 or older
          </button>
          <button
            onClick={() => setAgeDenied(true)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-8 py-3 rounded-xl font-medium w-full cursor-pointer"
          >
            I am under 18
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[999999] bg-[#000000]/65 backdrop-blur-md flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-gray-100 flex flex-col gap-5 relative animate-fade-in text-left max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[#E8DDD4] pb-4">
          <div className="bg-[#8B5E3C]/10 p-2.5 rounded-2xl shrink-0">
            <ShieldCheck className="w-6 h-6 text-[#8B5E3C]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#191919] leading-tight">Welcome to Lumo Bites</h2>
            <p className="text-xs text-[#8B7E7D] mt-0.5">Please review and accept our Terms to continue</p>
          </div>
        </div>

        <div className="space-y-3.5 text-sm text-[#555555] leading-relaxed pr-1 overflow-y-auto max-h-[40vh] border-b border-[#FAF6F4] pb-4">
          <p>
            Lumo Bites is a community-first pet care connection platform. To keep our marketplace and discussion spaces safe, welcoming, and secure for everyone, all users must agree to our safety standards.
          </p>

          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 text-red-950 font-medium">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-extrabold uppercase tracking-wide">Zero Tolerance Policy</p>
              <p>We enforce a strict **zero-tolerance policy** for objectionable content or abusive behavior.</p>
              <p>This includes but is not limited to harassment, hate speech, bullying, fraud, or inappropriate messages. Violating users will have their posts removed and accounts permanently banned within 24 hours.</p>
            </div>
          </div>

          <p className="text-xs text-[#8B7E7D]">
            By clicking agree, you confirm that you are at least 18 years of age and that you agree to abide by our{' '}
            <Link href="/terms" className="text-[#8B5E3C] font-bold hover:underline" target="_blank">
              Terms of Service
            </Link>
            ,{' '}
            <Link href="/privacy" className="text-[#8B5E3C] font-bold hover:underline" target="_blank">
              Privacy Policy
            </Link>
            , and{' '}
            <Link href="/community-guidelines" className="text-[#8B5E3C] font-bold hover:underline" target="_blank">
              Community Guidelines
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 text-[#8B5E3C] border-[#E8DDD4] rounded-md focus:ring-[#8B5E3C] focus:ring-offset-0 focus:ring-1"
            />
            <span className="text-xs font-bold text-[#4A3E3D] leading-normal">
              I agree to the Terms of Service, Privacy Policy, and Community Guidelines.
            </span>
          </label>

          <button
            onClick={handleAccept}
            disabled={!agreed}
            className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] disabled:bg-gray-300 text-white font-bold py-4 rounded-xl text-sm transition-all shadow-md disabled:shadow-none flex items-center justify-center cursor-pointer disabled:cursor-not-allowed select-none"
          >
            Agree &amp; Continue
          </button>
        </div>
      </div>
    </div>
  );
}
