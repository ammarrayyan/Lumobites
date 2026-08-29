'use client';

import React from 'react';
import Link from 'next/link';
import { Crown, Sparkles, X, Check } from 'lucide-react';
import { useScrollLock } from '@/lib/useScrollLock';

export interface BookingLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  used?: number;
  limit?: number;
}

export default function BookingLimitModal({
  isOpen,
  onClose,
  used = 3,
  limit = 3,
}: BookingLimitModalProps) {
  useScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100005] animate-fade-in text-center select-none">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-[#E8DDD4] flex flex-col items-center gap-5 relative animate-modal-spring">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-100 cursor-pointer border-none bg-transparent"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Crown Icon */}
        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-[#8B5E3C] text-white rounded-2xl flex items-center justify-center mt-2 shadow-md">
          <Crown className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-2xl font-black text-[#191919] leading-tight mb-2">
            Monthly Booking Limit Reached
          </h3>
          <p className="text-sm text-gray-600 font-medium leading-relaxed">
            Free-tier accounts include <strong>{limit} sitter inquiries per month</strong>. You&apos;ve used all {used} free inquiries for this calendar month.
          </p>
        </div>

        {/* Benefits list */}
        <div className="w-full bg-[#FAF6F4] p-4 rounded-2xl border border-[#E8DDD4] text-left space-y-2">
          <p className="text-xs font-bold text-[#4A3E3D] uppercase tracking-wider">With Lumo Bites Membership ($4.99/mo):</p>
          <ul className="space-y-1.5 text-xs text-[#555555]">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Unlimited sitter inquiries & bookings</strong> every month</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>5 daily AI checks</strong> across food scanners, twin, & AI search</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Cancel anytime</strong> directly from your account</span>
            </li>
          </ul>
        </div>

        <div className="w-full flex flex-col gap-3 mt-1">
          <Link
            href="/account"
            onClick={onClose}
            className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] text-white py-3.5 px-6 rounded-xl font-extrabold text-sm shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
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
      </div>
    </div>
  );
}
