'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Heart, Loader2, ArrowLeft } from 'lucide-react';
import { getSignedInUserEmail } from '@/lib/authHelper';

const PRESET_AMOUNTS = [5, 10, 20];

function SupportPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const petId = searchParams.get('pet_id') || '';
  const petName = searchParams.get('pet_name') || '';
  const initialEmail = searchParams.get('email') || '';
  const returnUrl = searchParams.get('return_url') || '/lost-pets';

  const [selectedPreset, setSelectedPreset] = useState<number | 'custom'>(10);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!initialEmail && typeof window !== 'undefined') {
      const email = getSignedInUserEmail();
      if (email) setUserEmail(email);
    }
  }, [initialEmail]);

  const currentAmount =
    selectedPreset === 'custom'
      ? parseFloat(customAmount) || 0
      : selectedPreset;

  const handleCheckout = async () => {
    setError('');

    if (selectedPreset === 'custom') {
      const num = parseFloat(customAmount);
      if (isNaN(num) || num < 1) {
        setError('Please enter a donation of at least $1.00.');
        return;
      }
      if (num > 10000) {
        setError('Please enter an amount under $10,000.');
        return;
      }
    }

    setLoading(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const fallbackReturn = `${origin}${returnUrl.startsWith('/') ? returnUrl : `/${returnUrl}`}`;

      const res = await fetch('/api/stripe/checkout-donation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: currentAmount,
          email: userEmail,
          pet_id: petId,
          pet_name: petName,
          return_url: fallbackReturn,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Unable to start checkout. Please try again.');
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const displayTitle = petName
    ? `🎉 Reunited! So glad ${petName} is safe!`
    : '🐾 Support Lumo Bites Lost & Found';

  const displaySubtitle = petName
    ? `Lumo Bites' lost & found board and AI matching are 100% free for families. If we helped bring ${petName} home, consider leaving a small one-time contribution to help keep this free for the next family.`
    : `Lumo Bites' lost & found network, community board, and AI photo matching are 100% free for all pet parents. If you'd like to help keep this service free and running for families, consider leaving a small one-time contribution.`;

  return (
    <div className="min-h-screen bg-[#F7F3EE] font-sans flex flex-col items-center pt-8 sm:pt-12 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        {/* Back Link */}
        <Link
          href={returnUrl}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#8B5E3C] hover:text-[#7A5234] hover:underline mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{petId ? 'Back to Post' : 'Back to Lost & Found Board'}</span>
        </Link>

        {/* Support Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-[#E8DDD4] relative">
          {/* Heart Icon Badge */}
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
            <Heart className="w-6 h-6 fill-amber-500 text-amber-500" />
          </div>

          {/* Heading */}
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#191919] tracking-tight leading-snug mb-2">
            {displayTitle}
          </h1>

          <p className="text-xs sm:text-sm font-normal text-[#666666] leading-relaxed mb-6">
            {displaySubtitle}
          </p>

          {/* Amount Selector */}
          <div className="space-y-3 mb-6">
            <label className="block text-xs font-bold text-[#191919] uppercase tracking-wider mb-1.5">
              Choose a one-time amount
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(amt);
                    setError('');
                  }}
                  disabled={loading}
                  className={`py-3 px-2 rounded-xl font-bold text-xs sm:text-sm transition-all border cursor-pointer ${
                    selectedPreset === amt
                      ? 'bg-[#8B5E3C] text-white border-[#8B5E3C] shadow-sm'
                      : 'bg-[#FAF6F4] text-[#4A3E3D] border-[#E8DDD4] hover:border-[#8B5E3C]/40 hover:bg-[#F5ECE5]'
                  }`}
                >
                  ${amt}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setSelectedPreset('custom');
                  setError('');
                }}
                disabled={loading}
                className={`py-3 px-2 rounded-xl font-bold text-xs sm:text-sm transition-all border cursor-pointer ${
                  selectedPreset === 'custom'
                    ? 'bg-[#8B5E3C] text-white border-[#8B5E3C] shadow-sm'
                    : 'bg-[#FAF6F4] text-[#4A3E3D] border-[#E8DDD4] hover:border-[#8B5E3C]/40 hover:bg-[#F5ECE5]'
                }`}
              >
                Custom
              </button>
            </div>

            {/* Custom Amount Input */}
            {selectedPreset === 'custom' && (
              <div className="relative mt-3 animate-fade-in">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B7E7D] font-bold text-sm">
                  $
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Enter amount (e.g. 15)"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setError('');
                  }}
                  disabled={loading}
                  autoFocus
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-[#E8DDD4] bg-[#FAF6F4] text-[#191919] font-medium text-xs sm:text-sm focus:outline-none focus:border-[#8B5E3C] focus:bg-white transition-all"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl animate-fade-in">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading || (selectedPreset === 'custom' && (!customAmount || parseFloat(customAmount) < 1))}
              className="w-full bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3.5 px-4 rounded-xl transition-all transform active:scale-98 shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none text-xs sm:text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Redirecting to Checkout...</span>
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 fill-white" />
                  <span>Support Lumo Bites {currentAmount > 0 ? `($${currentAmount})` : ''}</span>
                </>
              )}
            </button>

            <Link
              href={returnUrl}
              className="w-full py-2 text-center text-xs sm:text-sm font-bold text-[#8B7E7D] hover:text-[#4A3E3D] transition-colors"
            >
              Maybe Later / Return
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F7F3EE] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B5E3C]" />
      </div>
    }>
      <SupportPageContent />
    </Suspense>
  );
}
