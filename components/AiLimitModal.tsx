'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, LogIn, Crown, Clock, X } from 'lucide-react';
import { useScrollLock } from '@/lib/useScrollLock';

export interface AiLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string | null;
  isPro?: boolean;
}

export default function AiLimitModal({ isOpen, onClose, reason, isPro }: AiLimitModalProps) {
  useScrollLock(isOpen);

  if (!isOpen) return null;

  const cleanReason = (reason || '').trim();

  // Determine state category: trust explicit boolean isPro first, text fallback if missing
  const isSignedOut = !cleanReason || cleanReason.toLowerCase().includes('sign in');
  const isDailyLimitPro = typeof isPro === 'boolean'
    ? isPro
    : (cleanReason.toLowerCase().includes('pro ai checks') || cleanReason.toLowerCase().includes('come back tomorrow'));

  const handleSignIn = () => {
    onClose();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('lumo-open-signin'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in text-center select-none">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-[#E8DDD4] flex flex-col items-center gap-5 relative animate-modal-spring">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-100 cursor-pointer border-none bg-transparent"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. Signed Out View */}
        {isSignedOut ? (
          <>
            <div className="w-14 h-14 bg-[#8B5E3C]/10 text-[#8B5E3C] rounded-2xl flex items-center justify-center mt-2">
              <LogIn className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#191919] leading-tight mb-2">
                Sign in to use AI features
              </h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Please sign in to access AI analysis, scanners, pet matching, and interactive features.
              </p>
            </div>

            <button
              onClick={handleSignIn}
              className="w-full bg-[#C17D3C] hover:bg-[#B06D2B] text-white py-3.5 px-6 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer border-none flex items-center justify-center gap-2 mt-1"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
          </>
        ) : isDailyLimitPro ? (
          /* 2. Paid Member Daily Limit View (No Upgrade Button) */
          <>
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mt-2 border border-amber-200">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#191919] leading-tight mb-2">
                Daily limit reached—come back tomorrow
              </h3>
              <p className="text-sm text-gray-600 font-medium leading-relaxed">
                {cleanReason || "You've used your 5 Pro AI checks for today. Come back tomorrow for 5 more checks!"}
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] text-white py-3.5 px-6 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer border-none mt-1"
            >
              Got It
            </button>
          </>
        ) : (
          /* 3. Free User Lifetime Limit View (With Upgrade Button) */
          <>
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-[#8B5E3C] text-white rounded-2xl flex items-center justify-center mt-2 shadow-md">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#191919] leading-tight mb-2">
                Free AI Limit Reached
              </h3>
              <p className="text-sm text-gray-600 font-medium leading-relaxed">
                {cleanReason || "You've used both of your free AI checks. Upgrade to Membership for 5 checks a day!"}
              </p>
            </div>

            <div className="w-full flex flex-col gap-3 mt-1">
              <Link
                href="/account"
                onClick={onClose}
                className="w-full bg-gradient-to-r from-amber-500 to-[#8B5E3C] hover:from-amber-600 hover:to-[#734A2E] text-white py-3.5 px-6 rounded-xl font-extrabold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                style={{ textDecoration: 'none' }}
              >
                <Sparkles className="w-4 h-4 fill-current" /> Upgrade to Membership – $4.99/month
              </Link>

              <button
                onClick={onClose}
                className="w-full bg-transparent hover:bg-gray-100 text-gray-500 py-2.5 rounded-xl font-semibold text-xs transition-all border-none cursor-pointer"
              >
                Maybe Later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
