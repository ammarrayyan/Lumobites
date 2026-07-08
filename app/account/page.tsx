'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings, Lock, Mail, Calendar, Sparkles, AlertTriangle, Check, RefreshCw, Info } from 'lucide-react';

type Step = 'email' | 'verification' | 'dashboard';

export default function AccountPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cachedEmail = localStorage.getItem('lumo_pro_email');
      if (cachedEmail && cachedEmail !== 'undefined' && cachedEmail !== 'null' && cachedEmail.trim() !== '') {
        setEmail(cachedEmail);
        setIsLocked(true);
      }
    }
  }, []);
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
    cancelAtPeriodEnd?: boolean;
    daysRemaining?: number;
  } | null>(null);

  // Cancellation states
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [cancelEndDate, setCancelEndDate] = useState<string>('');
  const [cancelDaysRemaining, setCancelDaysRemaining] = useState<number>(0);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
        if (data.error === 'not_pro') {
          throw new Error('not_pro');
        }
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

      localStorage.setItem('lumo_pro_email', email.trim());
      localStorage.setItem('lumo_session_started_at', new Date().toISOString());
      window.dispatchEvent(new Event('lumo-pro-update'));

      if (data.existed) {
        alert('Welcome back! ✨');
      } else {
        alert('Account created! 🐾');
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
        subscriptionId: data.subscriptionId,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
        daysRemaining: data.daysRemaining,
      });
      
      const params = new URLSearchParams(window.location.search);
      const redirectUrl = params.get('redirect');
      if (redirectUrl && redirectUrl.startsWith('/')) {
        window.location.href = redirectUrl;
      } else {
        setStep('dashboard');
      }
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
      // Store the end date and days remaining from the API response
      setCancelEndDate(data.endDate || subDetails.nextBillingDate);
      setCancelDaysRemaining(data.daysRemaining ?? subDetails.daysRemaining ?? 0);
      // Optimistically update dashboard state to cancellation scheduled
      setSubDetails(prev => prev ? { ...prev, cancelAtPeriodEnd: true } : null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not cancel subscription. Please contact support.');
      setShowConfirmCancel(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOutAllDevices = async () => {
    if (!email) return;
    try {
      await fetch('/api/stripe/signout-all-devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
    } catch (err) {
      console.error('[Account SignOut All Devices] failed:', err);
    }
    if (typeof window !== 'undefined') {
      localStorage.clear();
      alert('You have been signed out of all devices for security.');
      window.location.href = '/';
    }
  };

  const handleDeleteAccount = async () => {
    if (!email) return;
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete account');

      if (typeof window !== 'undefined') {
        localStorage.clear();
        alert('Your account and all associated data have been permanently deleted.');
        window.location.href = '/';
      }
    } catch (err: any) {
      alert(err.message || 'Could not delete account. Please contact support.');
    } finally {
      setDeleteLoading(false);
      setShowConfirmDelete(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFAF7] text-[#555555] font-sans flex flex-col">
      {/* NAVBAR */}
      
      <main className="flex-1 flex flex-col items-center py-16 px-6">
        <div className="w-full max-w-[500px] bg-white rounded-3xl border border-[#EEEEEE] shadow-[0_12px_40px_rgba(0,0,0,0.03)] p-8 md:p-10 flex flex-col gap-6 relative">
          
          {/* STEP 1: ENTER PRO EMAIL */}
          {step === 'email' && (
            <div className="flex flex-col gap-6">
              <div className="text-center flex flex-col items-center">
                <Settings className="w-10 h-10 text-[#8B5E3C] mb-3" />
                <h1 className="text-3xl font-[900] text-[#191919] tracking-tight mb-2">
                  Your Account
                </h1>
                <p className="text-sm text-gray-500 max-w-[340px] mx-auto leading-relaxed">
                  Enter your email address to sign in or manage your account.
                </p>
              </div>

              {error === 'not_pro' ? (
                <div className="flex flex-col gap-4 text-center items-center w-full">
                  <p className="text-red-500 font-bold text-sm leading-relaxed">
                    No PRO subscription found for this email. Please upgrade to PRO first.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const res = await fetch('/api/stripe/checkout', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: email.trim() })
                        });
                        const data = await res.json();
                        if (data.url) {
                          window.location.href = data.url;
                        } else {
                          throw new Error(data.error || 'Failed to start checkout');
                        }
                      } catch (err: any) {
                        setError(err.message || 'Failed to start checkout. Please try again.');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Upgrade to PRO →
                  </button>
                  <button
                    type="button"
                    onClick={() => { setError(null); }}
                    className="text-xs text-gray-400 hover:text-gray-600 hover:underline font-bold"
                  >
                    Try another email
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendCode} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
                      Email Address {isLocked && <Lock className="w-3.5 h-3.5 text-gray-400 ml-1.5" title="Locked after signup" />}
                    </label>
                    {isLocked ? (
                      <div className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500 font-medium">
                        {email}
                      </div>
                    ) : (
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        disabled={loading}
                        className="w-full px-4 py-3.5 rounded-xl border border-[#E8DDD4] outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C] text-sm text-[#191919] bg-white transition-all disabled:opacity-50"
                      />
                    )}
                    {isLocked && (
                      <p className="text-xs text-gray-500 mt-1">
                        Email cannot be changed. Contact <a href="mailto:info@lumobitespet.com" className="text-[#8B5E3C] hover:underline">info@lumobitespet.com</a> for help.
                      </p>
                    )}
                  </div>

                  {error && (
                    <div className="flex flex-col gap-3 items-center">
                      <p className="text-xs text-red-500 font-semibold text-center leading-normal">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 inline mr-1" /> {error}
                      </p>
                      {error.toLowerCase().includes('no active pro subscription') && (
                        <button
                          type="button"
                          onClick={async () => {
                            setLoading(true);
                            setError(null);
                            try {
                              const res = await fetch('/api/stripe/checkout', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: email.trim() })
                              });
                              const data = await res.json();
                              if (data.url) {
                                window.location.href = data.url;
                              } else {
                                throw new Error(data.error || 'Failed to start checkout');
                              }
                            } catch (err: any) {
                              setError(err.message || 'Failed to start checkout. Please try again.');
                            } finally {
                              setLoading(false);
                            }
                          }}
                          disabled={loading}
                          className="w-full mt-1 bg-gradient-to-r from-amber-500 to-[#8B5E3C] hover:from-amber-600 hover:to-[#734A2E] text-white py-3.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 text-white shrink-0 animate-pulse" />
                              Become PRO — $2.99/mo <Sparkles className="w-4 h-4 text-white shrink-0 inline ml-1.5" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
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
              )}

            </div>
          )}

          {/* STEP 2: ENTER CODE */}
          {step === 'verification' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="text-center flex flex-col items-center">
                <Mail className="w-10 h-10 text-[#8B5E3C] mb-3" />
                <h1 className="text-2xl font-[900] text-[#191919] tracking-tight mb-2">
                  Verify Identity
                </h1>
                <p className="text-sm text-gray-500 max-w-[340px] mx-auto leading-relaxed">
                  We sent a 6-digit verification code to <strong className="text-gray-700">{email}</strong>. It expires in 15 minutes.
                </p>
              </div>

              <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
                <div className="bg-stone-50 border border-stone-200/60 text-stone-600 rounded-xl p-3 text-xs leading-relaxed text-center font-medium mb-1 animate-fade-in">
                  📧 Code sent! Check your inbox — and don't forget to check your spam/junk folder if you don't see it within a minute.
                </div>
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                    Enter 6-Digit Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="••••••"
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
                  <div className="text-xs text-red-500 font-semibold text-center leading-normal flex flex-col items-center gap-1">
                    <span className="flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-red-500" /> {error}</span>
                    {error.includes('Code expired') && (
                      <button
                        type="button"
                        onClick={() => handleSendCode({ preventDefault: () => {} } as React.FormEvent)}
                        className="text-xs font-bold text-[#8B5E3C] hover:underline mt-0.5 cursor-pointer bg-transparent border-none"
                      >
                        Still nothing? Resend Code
                      </button>
                    )}
                  </div>
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

                <div className="mt-6 flex flex-col gap-2">
                  <div className="text-center text-xs text-[#8B7E7D]">
                    Didn't receive the code? Check your spam or junk folder.
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    {!isLocked && (
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
                    )}

                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={loading}
                      className="text-xs text-[#8B5E3C] font-bold hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Still nothing? Resend Code
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: DASHBOARD */}
          {step === 'dashboard' && subDetails && (
            <div className="flex flex-col gap-6 animate-fade-in">
              {isCancelled ? (
                // Cancellation Success Screen
                <div className="flex flex-col gap-5 text-center py-4 items-center">
                  <Calendar className="w-12 h-12 text-[#8B5E3C] mb-2" />
                  <h2 className="text-2xl font-[900] text-gray-900 leading-tight">
                    Cancellation Scheduled
                  </h2>
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left flex flex-col gap-2 w-full">
                    <p className="text-sm text-amber-900 leading-relaxed">
                      Your Pro subscription has been cancelled. You will continue to have <strong>full access</strong> until{' '}
                      <strong>{cancelEndDate}</strong>{' '}({cancelDaysRemaining} days remaining). After that your account will return to the free plan.
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-amber-200 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (cancelDaysRemaining / 30) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-amber-700 whitespace-nowrap">{cancelDaysRemaining}d left</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCancelled(false)}
                    className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white py-3.5 px-6 rounded-xl font-bold text-sm transition-all shadow-md cursor-pointer w-full"
                  >
                    Back to Dashboard
                  </button>
                </div>
              ) : (
                // Active Subscription Status Dashboard
                <div className="flex flex-col gap-5">
                  <div className="text-center flex flex-col items-center">
                    <Sparkles className="w-10 h-10 text-amber-500 mb-3" />
                    <h2 className="text-2xl font-[900] text-[#191919] tracking-tight">
                      {subDetails.earlyAccessFree ? "Your Account Dashboard" : "Your Pro Dashboard"}
                    </h2>
                    <p className="text-xs text-gray-400 mt-1 font-bold">
                      Account: {email}
                    </p>
                  </div>

                  {subDetails.earlyAccessFree ? (
                    <div className="bg-[#FAF6F4] border border-[#8B5E3C]/10 rounded-2xl p-5 flex flex-col gap-4">
                      <div className="flex items-center justify-between border-b border-gray-200/50 pb-3">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account Status</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-3xs flex items-center gap-1">
                          Active (Free Access) <Check className="w-3.5 h-3.5 text-emerald-600" />
                        </span>
                      </div>

                    </div>
                  ) : (
                    <>
                      <div className="bg-[#FAF6F4] border border-[#8B5E3C]/10 rounded-2xl p-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between border-b border-gray-200/50 pb-3">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subscription Status</span>
                          {subDetails.cancelAtPeriodEnd ? (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-3xs flex items-center gap-1">
                              Scheduled to Cancel <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-3xs flex items-center gap-1">
                              Active <Check className="w-3.5 h-3.5 text-emerald-600" />
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            {subDetails.cancelAtPeriodEnd ? "Access Ends On" : "Next Billing Date"}
                          </span>
                          <p className="text-[#191919] font-extrabold text-sm mt-0.5">
                            {subDetails.nextBillingDate}
                          </p>
                        </div>
                      </div>

                      {error && (
                        <p className="text-xs text-red-500 font-semibold text-center leading-normal">
                          <span className="flex items-center justify-center gap-1.5"><AlertTriangle className="w-4 h-4 text-red-500" /> {error}</span>
                        </p>
                      )}

                      {subDetails.adminBypass ? (
                        <div className="bg-amber-50 border border-amber-200/50 text-amber-800 rounded-xl p-4 text-xs font-medium text-center leading-relaxed">
                          <Info className="w-4 h-4 text-amber-600 shrink-0 inline mr-1.5" /> Admin accounts represent permanent lifetime credentials and cannot be cancelled through this dashboard.
                        </div>
                      ) : subDetails.cancelAtPeriodEnd ? (
                        <div className="flex flex-col gap-3">
                          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-sm font-semibold leading-relaxed">
                            Subscription cancelled — Pro access continues until <strong>{subDetails.nextBillingDate}</strong>.
                            {subDetails.daysRemaining !== undefined && (
                              <span className="text-amber-700 font-normal block mt-1">{subDetails.daysRemaining} days remaining.</span>
                            )}
                          </div>
                          {(subDetails.daysRemaining ?? 0) > 0 ? (
                            <button
                              onClick={async () => {
                                setLoading(true);
                                setError(null);
                                try {
                                  const res = await fetch('/api/stripe/reactivate-subscription', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ subscriptionId: subDetails.subscriptionId })
                                  });
                                  const data = await res.json();
                                  if (!res.ok) throw new Error(data.error || 'Failed to reactivate');
                                  setSubDetails(prev => prev ? { ...prev, cancelAtPeriodEnd: false } : null);
                                } catch (err: any) {
                                  setError(err.message);
                                } finally {
                                  setLoading(false);
                                }
                              }}
                              disabled={loading}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                            >
                              {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : (
                                <>
                                  <RefreshCw className="w-4 h-4" />
                                  Reactivate Subscription
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={async () => {
                                setLoading(true);
                                setError(null);
                                try {
                                  const res = await fetch('/api/stripe/checkout', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ email: email.trim() })
                                  });
                                  const data = await res.json();
                                  if (data.url) {
                                    window.location.href = data.url;
                                  } else {
                                    throw new Error(data.error || 'Failed to start checkout');
                                  }
                                } catch (err: any) {
                                  setError(err.message);
                                  setLoading(false);
                                }
                              }}
                              disabled={loading}
                              className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] disabled:bg-gray-300 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-md cursor-pointer text-center flex items-center justify-center gap-1.5"
                            >
                              {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : (
                                <>
                                  <Sparkles className="w-4 h-4 text-white" />
                                  Upgrade to PRO — $2.99/mo
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      ) : null}
                    </>
                  )}
                  {/* Sign Out All Devices Button */}
                  <button
                    type="button"
                    onClick={handleSignOutAllDevices}
                    className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer text-center mt-2 flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4 text-gray-500" /> Sign Out All Devices
                  </button>

                  {/* Delete My Account Button */}
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(true)}
                    className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer text-center mt-2 flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-500" /> Delete My Account
                  </button>
                </div>
              )}
              {showConfirmCancel && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[99999] animate-fade-in">
                  <div className="bg-white rounded-3xl p-6 pb-32 md:p-8 max-w-sm w-full shadow-2xl border border-gray-100 flex flex-col gap-6 relative text-center items-center justify-center">
                    <div className="flex flex-col items-center">
                      <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
                      <h3 className="text-xl font-black text-[#191919] leading-tight">
                        Are you sure you want to cancel?
                      </h3>
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                        Your Pro benefits and unlimited scans will continue until the end of your billing cycle on <strong>{subDetails.nextBillingDate}</strong>, after which your subscription will end.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 w-full">
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
                        className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 py-3.5 rounded-xl font-bold text-sm transition-colors border border-gray-200 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        Keep Pro Features <Sparkles className="w-4 h-4 text-[#8B5E3C]" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {showConfirmDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[99999] animate-fade-in">
                  <div className="bg-white rounded-3xl p-6 pb-32 md:p-8 max-w-sm w-full shadow-2xl border border-gray-100 flex flex-col gap-6 relative text-center items-center justify-center">
                    <div className="flex flex-col items-center">
                      <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
                      <h3 className="text-xl font-black text-[#191919] leading-tight">
                        Delete Your Account?
                      </h3>
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                        Are you sure you want to delete your account? This will permanently delete all your data including bookings, pets, and posts. This cannot be undone.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleteLoading}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        {deleteLoading ? (
                          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : "Delete My Account"}
                      </button>
                      <button
                        onClick={() => setShowConfirmDelete(false)}
                        disabled={deleteLoading}
                        className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 py-3.5 rounded-xl font-bold text-sm transition-colors border border-gray-200 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-8 border-t border-[#EEEEEE] text-center text-xs text-gray-400">
        <p>© {new Date().getFullYear()} Premier Pet Nutrition LLC. All rights reserved.</p>
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
