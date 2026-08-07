'use client';

import React, { useState } from 'react';
import { Sparkles, Check, Loader2, X } from 'lucide-react';

interface MembershipUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  triggerReason?: string;
}

export default function MembershipUpgradeModal({
  isOpen,
  onClose,
  userEmail = '',
  triggerReason = "You've used both of your free AI checks. Upgrade to Membership for 5 checks a day!"
}: MembershipUpgradeModalProps) {
  const [email, setEmail] = useState(userEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout session.');

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Checkout URL not received.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-[#EEEEEE] relative animate-scale-up space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#8B5E3C]/10 text-[#8B5E3C] rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#191919]">Upgrade to Membership</h3>
          <p className="text-xs text-amber-700 font-medium bg-amber-50 px-3 py-1.5 rounded-xl max-w-xs mx-auto">
            {triggerReason}
          </p>
        </div>

        <div className="bg-[#FAF6F4] p-4 rounded-2xl border border-[#E8DDD4] space-y-2.5">
          <p className="text-xs font-bold text-[#4A3E3D] uppercase tracking-wider">Included with Membership ($4.99/mo):</p>
          <ul className="space-y-2 text-xs text-[#555555]">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>5 AI checks every day</strong> across all 6 tools (ingredient scanner, photo food scanner, pet twin, lost pet matcher, sitter search, and adoption matcher)</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Priority access</strong> to all new AI tools as we launch them</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Cancel anytime</strong> directly from your account dashboard</span>
            </li>
          </ul>
        </div>

        {error && (
          <p className="text-xs text-red-600 text-center font-medium bg-red-50 p-2.5 rounded-xl border border-red-100">
            {error}
          </p>
        )}

        <form onSubmit={handleCheckout} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-3 rounded-xl border border-[#E8DDD4] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C] text-sm text-[#191919]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#8B5E3C] hover:bg-[#724C2F] text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Redirecting to Checkout...' : 'Get Membership ($4.99/mo)'}
          </button>
        </form>
      </div>
    </div>
  );
}
