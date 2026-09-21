'use client';

import React, { useState, useEffect } from 'react';
import { Heart, X, Sparkles, Loader2 } from 'lucide-react';

interface SupportDonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  petName?: string;
  petId?: string;
  userEmail?: string;
  title?: string;
  subtitle?: string;
}

const PRESET_AMOUNTS = [5, 10, 20];

export default function SupportDonationModal({
  isOpen,
  onClose,
  petName,
  petId,
  userEmail,
  title,
  subtitle,
}: SupportDonationModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<number | 'custom'>(10);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Reset states when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedPreset(10);
      setCustomAmount('');
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
      const returnUrl = typeof window !== 'undefined' ? window.location.href : '/lost-pets';
      const res = await fetch('/api/stripe/checkout-donation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: currentAmount,
          email: userEmail,
          pet_id: petId,
          pet_name: petName,
          return_url: returnUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Unable to start checkout. Please try again.');
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const displayTitle =
    title ||
    (petName
      ? `🎉 Reunited! So glad ${petName} is safe!`
      : '🎉 So glad to help reunite families!');

  const displaySubtitle =
    subtitle ||
    `Lumo Bites' lost & found network and AI matching are 100% free for pet parents. If we helped bring your pet home, consider leaving a small one-time tip to help keep this service running for the next lost pet.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#E8DDD4] relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Icon / Badge */}
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
          <Heart className="w-6 h-6 fill-amber-500 text-amber-500" />
        </div>

        {/* Modal Header */}
        <h3 className="text-xl sm:text-2xl font-black text-[#4A3E3D] mb-2 leading-tight">
          {displayTitle}
        </h3>
        <p className="text-sm font-medium text-[#7A6B69] leading-relaxed mb-6">
          {displaySubtitle}
        </p>

        {/* Amount Selector */}
        <div className="space-y-3 mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#8B7E7D]">
            Choose a one-time amount
          </label>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  setSelectedPreset(amt);
                  setError('');
                }}
                disabled={loading}
                className={`py-3 px-2 rounded-2xl font-black text-sm sm:text-base transition-all border cursor-pointer relative ${
                  selectedPreset === amt
                    ? 'bg-[#8B5E3C] text-white border-[#8B5E3C] shadow-md scale-102'
                    : 'bg-[#FAF6F4] text-[#4A3E3D] border-[#E8DDD4] hover:border-[#8B5E3C]/40 hover:bg-[#F5ECE5]'
                }`}
              >
                ${amt}
                {amt === 10 && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-tight shadow-xs">
                    Popular
                  </span>
                )}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setSelectedPreset('custom');
                setError('');
              }}
              disabled={loading}
              className={`py-3 px-2 rounded-2xl font-bold text-xs sm:text-sm transition-all border cursor-pointer ${
                selectedPreset === 'custom'
                  ? 'bg-[#8B5E3C] text-white border-[#8B5E3C] shadow-md scale-102'
                  : 'bg-[#FAF6F4] text-[#4A3E3D] border-[#E8DDD4] hover:border-[#8B5E3C]/40 hover:bg-[#F5ECE5]'
              }`}
            >
              Custom
            </button>
          </div>

          {/* Custom Amount Input */}
          {selectedPreset === 'custom' && (
            <div className="relative mt-3 animate-fade-in">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-base">
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
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-[#E8DDD4] bg-[#FAF6F4] text-[#4A3E3D] font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5E3C] focus:bg-white"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl animate-fade-in">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleCheckout}
            disabled={loading || (selectedPreset === 'custom' && (!customAmount || parseFloat(customAmount) < 1))}
            className="w-full bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-black py-3.5 px-4 rounded-xl transition-all transform active:scale-98 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Redirecting to Checkout...</span>
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 fill-white" />
                <span>Support Lumo Bites {currentAmount > 0 ? `($${currentAmount})` : ''}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full py-2.5 text-xs sm:text-sm font-bold text-[#8B7E7D] hover:text-[#4A3E3D] transition-colors cursor-pointer disabled:opacity-50"
          >
            Maybe Later / Done
          </button>
        </div>
      </div>
    </div>
  );
}
