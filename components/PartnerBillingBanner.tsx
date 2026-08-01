'use client';

import React, { useState } from 'react';
import { CreditCard, Clock, AlertTriangle, CheckCircle2, ShieldAlert, Loader2, ArrowRight, Play, RefreshCw } from 'lucide-react';

interface PartnerBillingBannerProps {
  partnerId: string;
  partnerType: 'shelter' | 'pet_daycare' | 'vet_boarding';
  email: string;
  status: string;
  subscriptionStatus?: string;
  trialEnd?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  monthlyPriceUsd?: number;
  isPaused?: boolean;
  onRefresh?: () => void | Promise<void>;
}

export default function PartnerBillingBanner({
  partnerId,
  partnerType,
  email,
  status,
  subscriptionStatus = 'trialing',
  trialEnd,
  currentPeriodEnd,
  cancelAtPeriodEnd = false,
  monthlyPriceUsd = 30,
  isPaused = false,
  onRefresh,
}: PartnerBillingBannerProps) {
  const [loading, setLoading] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Calculate trial days remaining (defaults to 0 if trialEnd is null or missing)
  let daysRemaining = 0;
  if (trialEnd) {
    const diffTime = new Date(trialEnd).getTime() - new Date().getTime();
    daysRemaining = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  }

  // Handle Checkout trigger
  const handleCheckout = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/stripe/checkout-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_id: partnerId,
          partner_type: partnerType,
          email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize payment checkout.');
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to connect to Stripe.');
      setLoading(false);
    }
  };

  // Handle Cancellation trigger
  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your recurring subscription? Your public listing will remain active until the end of your current paid billing period.')) {
      return;
    }
    setCanceling(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/stripe/cancel-partner-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_id: partnerId,
          partner_type: partnerType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel subscription.');
      if (onRefresh) await onRefresh();
      alert('Your subscription cancellation has been scheduled. Your public listing will remain active until the end of your current billing period.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to cancel subscription.');
    } finally {
      setCanceling(false);
    }
  };

  // Handle Reactivation trigger (resumes automatic monthly renewal without new charges)
  const handleReactivateSubscription = async () => {
    setReactivating(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/stripe/reactivate-partner-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_id: partnerId,
          partner_type: partnerType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reactivate subscription.');
      if (onRefresh) await onRefresh();
      alert('Your subscription has been successfully reactivated! Automatic monthly renewals will continue seamlessly.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reactivate subscription.');
    } finally {
      setReactivating(false);
    }
  };

  // Handle Manual Resume/Unpause trigger from banner
  const handleResumeListing = async () => {
    setResuming(true);
    try {
      const endpointMap: Record<string, string> = {
        shelter: '/api/adoption/shelter',
        pet_daycare: '/api/pet-daycare',
        vet_boarding: '/api/vet-boarding',
      };
      const payloadMap: Record<string, any> = {
        shelter: { id: partnerId, is_paused: false },
        pet_daycare: { id: partnerId, is_paused: false },
        vet_boarding: { id: partnerId, status: 'approved', is_paused: false },
      };
      const endpoint = endpointMap[partnerType];
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadMap[partnerType]),
      });
      if (res.ok && onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.error('Failed to resume listing:', err);
    } finally {
      setResuming(false);
    }
  };

  // 1. ACTIVE PAID SUBSCRIPTION
  if (subscriptionStatus === 'active' && !isPaused && status !== 'paused' && !cancelAtPeriodEnd) {
    const formattedEnd = currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString() : 'Next Cycle';
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#4A3E3D] text-sm">Active Subscription</span>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Paid</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              ${monthlyPriceUsd}/month • Next billing date: <span className="font-semibold text-gray-700">{formattedEnd}</span>
            </p>
          </div>
        </div>
        <button
          onClick={handleCancelSubscription}
          disabled={canceling}
          className="text-xs text-red-600 hover:text-red-700 font-semibold underline shrink-0 cursor-pointer"
        >
          {canceling ? 'Canceling...' : 'Cancel Subscription'}
        </button>
      </div>
    );
  }

  // 2. CANCELLATION SCHEDULED
  if (subscriptionStatus === 'active' && cancelAtPeriodEnd) {
    const formattedEnd = currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString() : 'Period End';
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#4A3E3D] text-sm">Subscription Canceling</span>
              <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Ending Soon</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Your paid listing stays visible until <span className="font-bold text-gray-800">{formattedEnd}</span>, then pauses automatically.
            </p>
          </div>
        </div>
        <button
          onClick={handleReactivateSubscription}
          disabled={reactivating}
          className="bg-[#8B5E3C] hover:bg-[#724C2F] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border-none"
        >
          {reactivating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Re-activate Subscription (${monthlyPriceUsd}/mo)
        </button>
      </div>
    );
  }

  // 3. PAST DUE / PAYMENT FAILED (STILL IN RETRY PERIOD)
  if (subscriptionStatus === 'past_due') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-sm mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-red-700 text-sm">Payment Past Due</span>
              <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Action Required</span>
            </div>
            <p className="text-xs text-red-600 mt-0.5">
              Your recent monthly renewal charge failed. Please update your payment method to prevent listing pause.
            </p>
          </div>
        </div>
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
          Update Payment Method (${monthlyPriceUsd}/mo)
        </button>
      </div>
    );
  }

  // 3B. MANUALLY PAUSED PAID SUBSCRIPTION (OWNER PAUSED PAID ACCOUNT)
  if (subscriptionStatus === 'active' && (isPaused || status === 'paused')) {
    const formattedEnd = currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString() : 'Next Cycle';
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#4A3E3D] text-sm">Listing Manually Paused</span>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Subscription Active</span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              Your listing is manually paused and hidden from public search. Your paid subscription remains active (next billing date: <span className="font-semibold text-gray-800">{formattedEnd}</span>).
            </p>
          </div>
        </div>
        <button
          onClick={handleResumeListing}
          disabled={resuming}
          className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer border-none"
        >
          {resuming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          Resume Listing
        </button>
      </div>
    );
  }

  // 4A. MANUALLY PAUSED DURING VALID TRIAL (OWNER PAUSED TRIALING ACCOUNT)
  const isManuallyPaused = (isPaused || status === 'paused') && subscriptionStatus !== 'canceled' && daysRemaining > 0;
  if (isManuallyPaused) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#4A3E3D] text-sm">Listing Manually Paused</span>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Manually Paused</span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              Your listing is manually paused and hidden from search. You still have <span className="font-bold text-gray-800">{daysRemaining} days left</span> in your free trial.
            </p>
          </div>
        </div>
        <button
          onClick={handleResumeListing}
          disabled={resuming}
          className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer border-none"
        >
          {resuming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          Resume Listing
        </button>
      </div>
    );
  }

  // 4B. GENUINELY EXPIRED TRIAL / CANCELED SUBSCRIPTION WITH NO PAYMENT
  if (subscriptionStatus !== 'active' && (subscriptionStatus === 'canceled' || daysRemaining === 0)) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-4 shadow-sm mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#4A3E3D] text-sm">Free Trial Ended — Listing Paused</span>
              <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Hidden from Search</span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              Your 1-month free trial has ended. Subscribe now to restore your public search listing (${monthlyPriceUsd}/mo).
            </p>
          </div>
        </div>
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-md animate-pulse-soft"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
          Subscribe Now (${monthlyPriceUsd}/mo) <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // 5. TRIAL ACTIVE BANNERS (7-day, 3-day, 1-day urgency scaling)
  let bannerBg = 'bg-blue-50 border-blue-200';
  let badgeBg = 'bg-blue-100 text-blue-700';
  let iconColor = 'text-blue-600';
  let urgencyTitle = `${daysRemaining} Days Left in Free Trial`;

  if (daysRemaining <= 1) {
    bannerBg = 'bg-red-50 border-red-200';
    badgeBg = 'bg-red-100 text-red-700';
    iconColor = 'text-red-600';
    urgencyTitle = '⚠️ Trial Ends Today!';
  } else if (daysRemaining <= 3) {
    bannerBg = 'bg-orange-50 border-orange-200';
    badgeBg = 'bg-orange-100 text-orange-700';
    iconColor = 'text-orange-600';
    urgencyTitle = `⚠️ Only ${daysRemaining} Days Left in Free Trial`;
  } else if (daysRemaining <= 7) {
    bannerBg = 'bg-amber-50 border-amber-200';
    badgeBg = 'bg-amber-100 text-amber-700';
    iconColor = 'text-amber-600';
  }

  return (
    <div className={`${bannerBg} border rounded-2xl p-4 shadow-sm mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/80 rounded-xl flex items-center justify-center shrink-0">
          <Clock className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#4A3E3D] text-sm">{urgencyTitle}</span>
            <span className={`${badgeBg} text-[10px] font-bold px-2 py-0.5 rounded-full uppercase`}>Free Trial</span>
          </div>
          <p className="text-xs text-gray-600 mt-0.5">
            Add a payment method to ensure continuous listing visibility when trial expires (${monthlyPriceUsd}/mo).
          </p>
        </div>
      </div>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="bg-[#8B5E3C] hover:bg-[#724C2F] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
        Add Payment Method (${monthlyPriceUsd}/mo)
      </button>
    </div>
  );
}
