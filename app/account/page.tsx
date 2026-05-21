'use client';

import { useState } from 'react';
import Link from 'next/link';

type Step = 'email' | 'verification' | 'dashboard';

export default function AccountPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  
  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  
  // Subscription details
  const [subDetails, setSubDetails] = useState<{
    active: boolean;
    adminBypass: boolean;
    nextBillingDate: string;
    subscriptionId: string;
  } | null>(null);

  // Cancellation states
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/stripe/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      setStep('verification');
      setMessage({ text: 'Verification code sent! Please check your inbox.', isError: false });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not send verification code. Please check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim() || verificationCode.length !== 6) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/stripe/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: verificationCode.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Code verification failed');
      }

      // If code verified successfully, fetch subscription details
      await fetchSubscriptionDetails();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionDetails = async () => {
    try {
      const res = await fetch('/api/stripe/subscription-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch subscription details');
      }

      setSubDetails({
        active: data.active,
        adminBypass: data.adminBypass,
        nextBillingDate: data.nextBillingDate,
        subscriptionId: data.subscriptionId
      });
      setStep('dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not retrieve subscription details.');
    }
  };

  const handleCancelSubscription = async () => {
    if (!subDetails || !subDetails.subscriptionId) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          subscriptionId: subDetails.subscriptionId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      setIsCancelled(true);
      setShowConfirmCancel(false);
      
      // Update local Pro credentials if active device cached Pro status for this email
      if (typeof window !== 'undefined') {
        const cachedEmail = localStorage.getItem('lumo_pro_email');
        if (cachedEmail?.toLowerCase().trim() === email.toLowerCase().trim()) {
          localStorage.removeItem('lumo_pro_email');
          localStorage.removeItem('lumo_admin_bypass');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not cancel subscription. Please contact support.');
      setShowConfirmCancel(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFAF7] text-[#555555] font-sans flex flex-col">
      {/* NAVBAR */}
      <nav className="bg-white border-b border-[#EEEEEE] px-6 md:px-[48px] flex items-center shrink-0" style={{ height: '72px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', transform: 'scale(1.4)', transformOrigin: 'left center', margin: '-15px 0' }}>
            <img src="/Logo.png" alt="Lumo Bites" style={{ height: '40px', width: 'auto', display: 'block', objectFit: 'contain' }} />
            <sup style={{ fontSize: '10px', color: '#8B5A2B', fontWeight: 'bold', alignSelf: 'flex-start', marginTop: '5px', marginLeft: '2px', fontFamily: 'sans-serif', userSelect: 'none' }}>™</sup>
          </div>
        </Link>
        <div style={{ marginLeft: 'auto' }}>
          <Link href="/scan" className="text-[#8B5E3C] font-semibold text-sm hover:underline" style={{ textDecoration: 'none' }}>
            &larr; Back to Scanner
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center py-16 px-6">
        <div className="w-full max-w-[500px] bg-white rounded-3xl border border-[#EEEEEE] shadow-[0_12px_40px_rgba(0,0,0,0.03)] p-8 md:p-10 flex flex-col gap-6 relative">
          
          {/* STEP 1: ENTER PRO EMAIL */}
          {step === 'email' && (
            <div className="flex flex-col gap-6">
              <div className="text-center">
                <div className="text-4xl mb-3">⚙️</div>
                <h1 className="text-3xl font-[900] text-[#191919] tracking-tight mb-2">
                  Manage Subscription
                </h1>
                <p className="text-sm text-gray-500 max-w-[340px] mx-auto leading-relaxed">
                  Enter the email address associated with your Lumo Bites Pro subscription to view details or cancel.
                </p>
              </div>

              <form onSubmit={handleSendCode} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Pro Subscription Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    disabled={loading}
                    className="w-full px-4 py-3.5 rounded-xl border border-[#E8DDD4] outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C] text-sm text-[#191919] bg-white transition-all disabled:opacity-50"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-500 font-semibold text-center leading-normal">
                    ⚠️ {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] disabled:bg-gray-300 text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : 'Send Verification Code'}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: ENTER CODE */}
          {step === 'verification' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="text-center">
                <div className="text-4xl mb-3">✉️</div>
                <h1 className="text-2xl font-[900] text-[#191919] tracking-tight mb-2">
                  Verify Identity
                </h1>
                <p className="text-sm text-gray-500 max-w-[340px] mx-auto leading-relaxed">
                  We sent a 6-digit verification code to <strong className="text-gray-700">{email}</strong>. It expires in 10 minutes.
                </p>
              </div>

              <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                    Enter 6-Digit Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    required
                    disabled={loading}
                    className="w-full px-4 py-3.5 rounded-xl border border-[#E8DDD4] outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C] text-center font-mono text-xl tracking-widest text-[#191919] bg-white transition-all disabled:opacity-50"
                  />
                </div>

                {message && (
                  <p className={`text-xs font-semibold text-center leading-normal ${message.isError ? 'text-red-500' : 'text-emerald-600'}`}>
                    {message.text}
                  </p>
                )}

                {error && (
                  <p className="text-xs text-red-500 font-semibold text-center leading-normal">
                    ⚠️ {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] disabled:bg-gray-300 text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : 'Verify & Continue'}
                </button>

                <div className="flex justify-between items-center mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setError(null);
                      setMessage(null);
                      setVerificationCode('');
                    }}
                    className="text-xs text-gray-500 font-bold hover:underline bg-transparent border-none cursor-pointer"
                  >
                    ← Change Email
                  </button>

                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={loading}
                    className="text-xs text-[#8B5E3C] font-bold hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: DASHBOARD */}
          {step === 'dashboard' && subDetails && (
            <div className="flex flex-col gap-6 animate-fade-in">
              {isCancelled ? (
                // Cancellation Success Screen
                <div className="flex flex-col gap-6 text-center py-4">
                  <div className="text-5xl mb-2">👋</div>
                  <h2 className="text-2xl font-[900] text-gray-900 leading-tight">
                    Subscription Cancelled
                  </h2>
                  <p className="text-[#666666] leading-relaxed text-sm">
                    Your Pro benefits have been successfully deactivated. You can still scan once per day for free, and you can upgrade again at any time.
                  </p>
                  
                  <Link
                    href="/scan"
                    className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white py-4 px-6 rounded-xl font-bold text-sm transition-all shadow-md cursor-pointer mt-4"
                  >
                    Return to Food Scanner 🐾
                  </Link>
                </div>
              ) : (
                // Active Subscription Status Dashboard
                <div className="flex flex-col gap-5">
                  <div className="text-center">
                    <div className="text-4xl mb-3">✨</div>
                    <h2 className="text-2xl font-[900] text-[#191919] tracking-tight">
                      Your Pro Dashboard
                    </h2>
                    <p className="text-xs text-gray-400 mt-1 font-bold">
                      Account: {email}
                    </p>
                  </div>

                  <div className="bg-[#FAF6F4] border border-[#8B5E3C]/10 rounded-2xl p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-gray-200/50 pb-3">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subscription Status</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-3xs">
                        Active ✅
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Next Billing Date</span>
                      <p className="text-[#191919] font-extrabold text-sm mt-0.5">
                        {subDetails.nextBillingDate}
                      </p>
                    </div>
                  </div>

                  {error && (
                    <p className="text-xs text-red-500 font-semibold text-center leading-normal">
                      ⚠️ {error}
                    </p>
                  )}

                  {!subDetails.adminBypass ? (
                    <button
                      onClick={() => setShowConfirmCancel(true)}
                      className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer text-center"
                    >
                      Cancel Subscription
                    </button>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200/50 text-amber-800 rounded-xl p-4 text-xs font-medium text-center leading-relaxed">
                      💡 Admin accounts represent permanent lifetime credentials and cannot be cancelled through this dashboard.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CONFIRMATION CANCEL DIALOG MODAL */}
          {showConfirmCancel && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[99999] animate-fade-in">
              <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-gray-100 flex flex-col gap-6 relative text-center">
                <div>
                  <div className="text-4xl mb-3">⚠️</div>
                  <h3 className="text-xl font-black text-[#191919] leading-tight">
                    Are you sure you want to cancel?
                  </h3>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                    You will immediately lose Pro features, including unlimited ingredients scanning and recall notification alerts.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleCancelSubscription}
                    disabled={loading}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : "Yes, cancel subscription"}
                  </button>
                  <button
                    onClick={() => setShowConfirmCancel(false)}
                    disabled={loading}
                    className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 py-3.5 rounded-xl font-bold text-sm transition-colors border border-gray-200 cursor-pointer"
                  >
                    Keep Pro Features ✨
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-8 border-t border-[#EEEEEE] text-center text-xs text-gray-400">
        <p>© {new Date().getFullYear()} Lumo Bites. All rights reserved.</p>
      </footer>

      <style jsx global>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
