'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings, Lock, Mail, Calendar, Sparkles, AlertTriangle, Check, RefreshCw, Info, Ban, CreditCard, PawPrint, ShieldCheck, Building2, User } from 'lucide-react';
import AccountPetsTab from '@/components/AccountPetsTab';
import { useScrollLock } from '@/lib/useScrollLock';

type Step = 'email' | 'verification' | 'dashboard';
type AccountTab = 'pets' | 'subscription' | 'security';

export default function AccountPage() {
  const [step, setStep] = useState<Step>('email');
  const [accountTab, setAccountTab] = useState<AccountTab>('pets');
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [email, setEmail] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'pets' || tabParam === 'subscription' || tabParam === 'security') {
        setAccountTab(tabParam as AccountTab);
      } else if (tabParam === 'access') {
        setAccountTab('pets');
      } else if (tabParam === 'business' || tabParam === 'plan') {
        setAccountTab('subscription');
      }
    }
  }, []);

  const handleTabSelect = (tab: AccountTab) => {
    setAccountTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const tokenFromStorage = typeof window !== 'undefined' ? localStorage.getItem('lumo_account_session_token') : null;
        const res = await fetch('/api/stripe/subscription-details', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(tokenFromStorage ? { 'x-account-session': tokenFromStorage } : {})
          },
          body: JSON.stringify({})
        });
        if (res.ok) {
          const data = await res.json();
          if (data.email && data.verified) {
            setEmail(data.email);
            setIsLocked(true);
            setSubDetails({
              active: data.active,
              adminBypass: data.adminBypass,
              isPartner: data.isPartner,
              partnerId: data.partnerId,
              dbPartnerType: data.dbPartnerType,
              partnerLabel: data.partnerLabel,
              dashboardUrl: data.dashboardUrl,
              businessName: data.businessName,
              priceUsd: data.priceUsd,
              rawSubscriptionStatus: data.rawSubscriptionStatus,
              billingHealthLabel: data.billingHealthLabel,
              nextBillingDate: data.nextBillingDate,
              subscriptionId: data.subscriptionId,
              cancelAtPeriodEnd: data.cancelAtPeriodEnd,
              daysRemaining: data.daysRemaining,
            });
            setStep('dashboard');
            setIsCheckingSession(false);
            return;
          }
        }
      } catch (e) {
        console.log('[Account Session Check] No active session cookie');
      }

      if (typeof window !== 'undefined') {
        const cachedEmail = localStorage.getItem('lumo_pro_email');
        if (cachedEmail && cachedEmail !== 'undefined' && cachedEmail !== 'null' && cachedEmail.trim() !== '') {
          setEmail(cachedEmail);
          setIsLocked(true);
        }
      }
      setIsCheckingSession(false);
    };

    checkSession();
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
    isPartner?: boolean;
    partnerId?: string;
    dbPartnerType?: string;
    partnerLabel?: string;
    dashboardUrl?: string;
    businessName?: string;
    priceUsd?: number;
    rawSubscriptionStatus?: string;
    billingHealthLabel?: string;
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
  useScrollLock(showConfirmCancel || showConfirmDelete);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [blockedEmails, setBlockedEmails] = useState<string[]>([]);
  const [blockedCookies, setBlockedCookies] = useState<string[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);

  const fetchBlockedUsers = async (userEmail: string) => {
    try {
      const res = await fetch(`/api/petsitting/block?email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setBlockedUsers(data.blocked || []);
      }
    } catch (e) {
      console.error('Failed to fetch blocked users:', e);
    }
  };

  const handleUnblockUser = async (blockedEmail: string) => {
    if (!blockedEmail) return;
    if (!confirm(`Unblock this user?`)) return;

    try {
      const res = await fetch('/api/petsitting/block', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockerEmail: email,
          blockedEmail: blockedEmail
        })
      });
      if (res.ok) {
        alert('User unblocked successfully');
        fetchBlockedUsers(email);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to unblock user.');
      }
    } catch (e) {
      alert('An error occurred.');
    }
  };

  useEffect(() => {
    if (step === 'dashboard' && email) {
      fetchBlockedUsers(email);
    }
  }, [step, email]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const emails = localStorage.getItem('lumo_blocked_emails');
        if (emails) setBlockedEmails(JSON.parse(emails));
        const cookies = localStorage.getItem('lumo_blocked_device_cookies');
        if (cookies) setBlockedCookies(JSON.parse(cookies));
      } catch (e) {}
    }
  }, []);

  const handleUnblockEmail = (emailVal: string) => {
    const updated = blockedEmails.filter(e => e !== emailVal);
    setBlockedEmails(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lumo_blocked_emails', JSON.stringify(updated));
    }
  };

  const handleUnblockCookie = (cookieVal: string) => {
    const updated = blockedCookies.filter(c => c !== cookieVal);
    setBlockedCookies(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lumo_blocked_device_cookies', JSON.stringify(updated));
    }
  };

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

      const activeEmail = data.email || email.trim();
      setEmail(activeEmail);
      setIsLocked(true);
      if (data.sessionToken) {
        localStorage.setItem('lumo_account_session_token', data.sessionToken);
      }
      localStorage.setItem('lumo_pro_email', activeEmail);
      localStorage.setItem('lumo_session_started_at', new Date().toISOString());
      window.dispatchEvent(new Event('lumo-pro-update'));

      if (data.existed) {
        alert('Welcome back!');
      } else {
        alert('Account created!');
      }

      // If code verified successfully, fetch subscription details
      await fetchSubscriptionDetails(activeEmail);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionDetails = async (targetEmail?: string) => {
    try {
      const emailToUse = targetEmail || email.trim();
      const res = await fetch('/api/stripe/subscription-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch subscription details');
      }

      if (data.email) setEmail(data.email);

      setSubDetails({
        active: data.active,
        adminBypass: data.adminBypass,
        isPartner: data.isPartner,
        partnerId: data.partnerId,
        dbPartnerType: data.dbPartnerType,
        partnerLabel: data.partnerLabel,
        dashboardUrl: data.dashboardUrl,
        businessName: data.businessName,
        priceUsd: data.priceUsd,
        rawSubscriptionStatus: data.rawSubscriptionStatus,
        billingHealthLabel: data.billingHealthLabel,
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
    if (!subDetails) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const endpoint = subDetails.isPartner ? '/api/stripe/cancel-partner-subscription' : '/api/stripe/cancel-subscription';
      const body = subDetails.isPartner
        ? { partner_id: subDetails.partnerId, partner_type: subDetails.dbPartnerType }
        : { email: email.trim(), subscriptionId: subDetails.subscriptionId };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      setIsCancelled(true);
      setShowConfirmCancel(false);
      await fetchSubscriptionDetails(email);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not cancel subscription. Please contact support.');
      setShowConfirmCancel(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReactivatePartnerSubscription = async () => {
    if (!subDetails?.partnerId || !subDetails?.dbPartnerType) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/reactivate-partner-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_id: subDetails.partnerId,
          partner_type: subDetails.dbPartnerType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reactivate subscription');
      await fetchSubscriptionDetails(email);
    } catch (err: any) {
      setError(err.message || 'Failed to reactivate subscription.');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subDetails || !subDetails.isPartner) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const partnerTypeKey = subDetails.partnerType === 'shelter' ? 'shelter' : subDetails.partnerType === 'vet' ? 'vet_boarding' : 'pet_daycare';
      const res = await fetch('/api/stripe/reactivate-partner-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), type: partnerTypeKey })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reactivate subscription');
      }

      setSubDetails(prev => prev ? { ...prev, cancelAtPeriodEnd: false } : null);
      setMessage('Subscription reactivated successfully!');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not reactivate subscription. Please contact support.');
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
    <div className="min-h-screen bg-[#F7F3EE] text-[#555555] font-sans flex flex-col font-inter">
      <main className="flex-1 flex flex-col items-center py-16 px-6 md:px-8 lg:px-12">
        <div 
          style={{ boxShadow: '0 4px 20px rgba(139, 94, 60, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03)' }}
          className={`w-full ${step === 'dashboard' ? 'max-w-3xl' : 'max-w-[500px]'} bg-white rounded-3xl border border-[#DFD3C7] p-6 sm:p-8 md:p-10 flex flex-col gap-6 relative transition-all duration-200`}
        >
          
          {/* INITIAL SESSION CHECK LOADING STATE */}
          {isCheckingSession ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <div className="w-10 h-10 border-4 border-[#8B5E3C] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-[#8B5E3C] tracking-wide animate-pulse">
                Verifying account session...
              </p>
            </div>
          ) : step === 'email' ? (
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
                    No active Lumo Bites Membership found for this email. Please upgrade to Membership.
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
                    Upgrade to Membership ($4.99/mo) →
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
                      <div className="w-full px-4 py-3.5 rounded-xl border border-[#DFD3C7] bg-[#FAF6F2] text-sm text-gray-500 font-medium">
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
                        className="w-full px-4 py-3.5 rounded-xl border border-[#E2D5C8] outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C] text-sm text-[#2E2419] bg-[#FAF6F2] transition-all disabled:opacity-50"
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
                          className="w-full mt-1 bg-[#8B5E3C] hover:bg-[#734A2E] text-white py-3.5 rounded-xl font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 text-white shrink-0 animate-pulse" />
                              Upgrade to Membership ($4.99/mo) <Sparkles className="w-4 h-4 text-white shrink-0 inline ml-1.5" />
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
          ) : null}

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
                <div className="bg-stone-50 border border-stone-200/60 text-stone-600 rounded-xl p-3 text-xs leading-relaxed text-center font-medium mb-1 animate-fade-in flex items-center justify-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#8B5E3C] shrink-0" />
                  <span>Code sent! Check your inbox (and spam folder if not received in 1 minute).</span>
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
                    className="w-full px-4 py-3.5 rounded-xl border border-[#E2D5C8] outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C] text-center font-mono text-xl tracking-widest text-[#2E2419] bg-[#FAF6F2] transition-all disabled:opacity-50"
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
                      Your Membership has been cancelled. You will continue to have <strong>full access</strong> until{' '}
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
                    <Sparkles className="w-10 h-10 text-[#8B5E3C] mb-3" />
                    <h2 className="text-2xl font-[900] text-[#191919] tracking-tight">
                      {subDetails.active ? "Your Membership Dashboard" : "Your Account Dashboard"}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 font-bold">
                      Account: {email}
                    </p>
                  </div>

                  {/* 🐾 3-TAB NAVIGATION HEADER */}
                  <div className="grid grid-cols-3 bg-[#F5EFEB] p-1.5 rounded-2xl gap-1.5 border border-[#EBE3DC]">
                    <button
                      type="button"
                      onClick={() => handleTabSelect('pets')}
                      className={`py-3 px-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none ${
                        accountTab === 'pets'
                          ? 'bg-white text-[#191919] shadow-xs'
                          : 'bg-transparent text-[#777777] hover:text-[#191919]'
                      }`}
                    >
                      <PawPrint className="w-4 h-4 text-[#8B5E3C] shrink-0" />
                      <span>My Pets</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTabSelect('subscription')}
                      className={`py-3 px-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none ${
                        accountTab === 'subscription'
                          ? 'bg-white text-[#191919] shadow-xs'
                          : 'bg-transparent text-[#777777] hover:text-[#191919]'
                      }`}
                    >
                      {subDetails.isPartner ? (
                        <>
                          <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>Business Plan</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 text-[#8B5E3C] shrink-0" />
                          <span>Subscription</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTabSelect('security')}
                      className={`py-3 px-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none ${
                        accountTab === 'security'
                          ? 'bg-white text-[#191919] shadow-xs'
                          : 'bg-transparent text-[#777777] hover:text-[#191919]'
                      }`}
                    >
                      <Lock className="w-4 h-4 text-gray-500 shrink-0" />
                      <span>Security</span>
                    </button>
                  </div>

                  {/* TAB 1: 🐾 MY PETS */}
                  {accountTab === 'pets' && (
                    <AccountPetsTab ownerEmail={email} />
                  )}

                  {/* TAB 2: 💳 SUBSCRIPTION / BUSINESS PLAN */}
                  {accountTab === 'subscription' && (
                    <div className="flex flex-col gap-4 animate-fade-in">
                      {!subDetails.active ? (
                        <div 
                          style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
                          className="bg-white border border-[#DFD3C7] rounded-2xl overflow-hidden shadow-xs"
                        >
                          <div className="bg-[#FAF5EE] px-5 py-3 border-b border-[#EADBCE] flex items-center justify-between">
                            <span className="text-xs font-extrabold text-[#2E2419] flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-[#F0E6DA] text-[#8B5E3C] flex items-center justify-center text-xs">
                                <User className="w-3.5 h-3.5" />
                              </span>
                              Account Status
                            </span>
                            <span className="bg-gray-100 text-gray-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-gray-200">
                              Free Account
                            </span>
                          </div>
                          
                          <div className="p-5 flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5 text-left">
                              <span className="text-xs font-bold text-[#4A3E3D] uppercase tracking-wider">AI Usage Allowance</span>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                Standard free accounts get <strong>2 lifetime AI checks</strong> across all tools.
                              </p>
                            </div>

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
                                  setError(err.message || 'Failed to start checkout.');
                                } finally {
                                  setLoading(false);
                                }
                              }}
                              disabled={loading}
                              className="w-full py-3.5 rounded-xl bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                            >
                              <Sparkles className="w-4 h-4" />
                              Upgrade to Membership ($4.99/mo) →
                            </button>

                            {/* Subtle Partner Registration Note */}
                            <div className="pt-2.5 mt-1 border-t border-gray-100 text-center">
                              <p className="text-[11px] text-gray-500 font-medium">
                                Are you a Veterinary Boarding, Pet Daycare, or Shelter?{' '}
                                <Link href="/?partnerModal=true" className="text-[#8B5E3C] hover:text-[#734A2E] font-bold underline transition-colors">
                                  Register as a Partner →
                                </Link>
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          {error && (
                            <p className="text-xs text-red-500 font-semibold text-center leading-normal">
                              <span className="flex items-center justify-center gap-1.5"><AlertTriangle className="w-4 h-4 text-red-500" /> {error}</span>
                            </p>
                          )}

                          {subDetails.adminBypass ? (
                            <div className="bg-amber-50 border border-amber-200/50 text-amber-800 rounded-xl p-4 text-xs font-medium text-center leading-relaxed">
                              <Info className="w-4 h-4 text-amber-600 shrink-0 inline mr-1.5" /> Admin accounts represent permanent lifetime credentials and cannot be cancelled through this dashboard.
                            </div>
                          ) : subDetails.isPartner ? (
                            <div className="flex flex-col gap-4">
                              <div 
                                style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
                                className="bg-white border border-[#DFD3C7] rounded-2xl overflow-hidden shadow-xs"
                              >
                                <div className="bg-[#FAF5EE] px-5 py-3 border-b border-[#EADBCE] flex items-center justify-between">
                                  <span className="text-xs font-extrabold text-[#2E2419] flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center text-xs">
                                      <Building2 className="w-3.5 h-3.5" />
                                    </span>
                                    Subscription Status
                                  </span>
                                  {subDetails.rawSubscriptionStatus === 'trialing' ? (
                                    <span className="bg-amber-100 text-amber-900 border border-amber-300/70 text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-3xs flex items-center gap-1.5">
                                      <Sparkles className="w-3.5 h-3.5 text-amber-700" /> {subDetails.billingHealthLabel || 'Free Trial Active'}
                                    </span>
                                  ) : subDetails.cancelAtPeriodEnd ? (
                                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-3xs flex items-center gap-1">
                                      Scheduled to Cancel <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                    </span>
                                  ) : (
                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-3xs flex items-center gap-1">
                                      Active Partner Listing <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    </span>
                                  )}
                                </div>

                                <div className="p-5 flex flex-col gap-3.5">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Business Name</span>
                                    <p className="text-[#191919] font-extrabold text-base">
                                      {subDetails.businessName}
                                    </p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#FAF6F2]">
                                    <div>
                                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Business Plan</span>
                                      <p className="text-xs font-extrabold text-[#8B5E3C] mt-0.5">
                                        {subDetails.partnerLabel || 'Partner'} (${subDetails.priceUsd || 40}/mo)
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                                        {subDetails.rawSubscriptionStatus === 'trialing' ? 'Trial Ends On' : subDetails.cancelAtPeriodEnd ? 'Access Ends On' : 'Next Billing Date'}
                                      </span>
                                      <p className="text-xs font-extrabold text-gray-800 mt-0.5">
                                        {subDetails.nextBillingDate}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {subDetails.cancelAtPeriodEnd && (
                                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3.5 text-xs font-semibold leading-relaxed">
                                  Subscription scheduled to cancel — listing stays active until <strong>{subDetails.nextBillingDate}</strong>.
                                </div>
                              )}

                              {subDetails.rawSubscriptionStatus === 'trialing' ? (
                                <div className="flex gap-2.5">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!subDetails.dbPartnerType) return;
                                      setLoading(true);
                                      setError(null);
                                      try {
                                        const res = await fetch('/api/stripe/checkout-partner', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            partner_id: subDetails.partnerId,
                                            partner_type: subDetails.dbPartnerType,
                                            email: email.trim(),
                                          }),
                                        });
                                        const data = await res.json();
                                        if (!res.ok) throw new Error(data.error || 'Failed to start checkout.');
                                        if (data.url) window.location.href = data.url;
                                      } catch (err: any) {
                                        setError(err.message || 'Unable to connect to Stripe.');
                                        setLoading(false);
                                      }
                                    }}
                                    disabled={loading}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white py-3.5 rounded-xl font-extrabold text-xs transition-all shadow-md cursor-pointer text-center flex items-center justify-center gap-1.5"
                                  >
                                    {loading ? (
                                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <>
                                        <CreditCard className="w-3.5 h-3.5" />
                                        Start Billing Now (${subDetails.priceUsd || 40}/mo)
                                      </>
                                    )}
                                  </button>
                                  <Link
                                    href={subDetails.dashboardUrl || '/'}
                                    className="flex-1 bg-[#8B5E3C] hover:bg-[#734A2E] text-white py-3.5 rounded-xl font-extrabold text-xs transition-all shadow-md cursor-pointer text-center flex items-center justify-center gap-1.5"
                                  >
                                    Business Dashboard →
                                  </Link>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-2.5">
                                  {subDetails.cancelAtPeriodEnd && (
                                    <button
                                      type="button"
                                      onClick={handleReactivatePartnerSubscription}
                                      disabled={loading}
                                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white py-3.5 rounded-xl font-extrabold text-xs transition-all shadow-md cursor-pointer text-center flex items-center justify-center gap-1.5"
                                    >
                                      {loading ? (
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <>
                                          <Sparkles className="w-3.5 h-3.5" />
                                          Resume Automatic Renewal (${subDetails.priceUsd || 40}/mo)
                                        </>
                                      )}
                                    </button>
                                  )}
                                  <Link
                                    href={subDetails.dashboardUrl || '/'}
                                    className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] text-white py-3.5 rounded-xl font-extrabold text-sm transition-all shadow-md cursor-pointer text-center flex items-center justify-center gap-2"
                                  >
                                    Manage {subDetails.partnerLabel || 'Partner'} Listing in Dashboard →
                                  </Link>
                                  {!subDetails.cancelAtPeriodEnd && (
                                    <button
                                      type="button"
                                      onClick={() => setShowConfirmCancel(true)}
                                      className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer text-center mt-1 flex items-center justify-center gap-1.5"
                                    >
                                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Cancel Subscription
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-4">
                              <div 
                                style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
                                className="bg-white border border-[#DFD3C7] rounded-2xl overflow-hidden shadow-xs"
                              >
                                <div className="bg-[#FAF5EE] px-5 py-3 border-b border-[#EADBCE] flex items-center justify-between">
                                  <span className="text-xs font-extrabold text-[#2E2419] flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center text-xs">
                                      <Sparkles className="w-3.5 h-3.5" />
                                    </span>
                                    Membership Status
                                  </span>
                                  {subDetails.cancelAtPeriodEnd ? (
                                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-3xs flex items-center gap-1">
                                      Scheduled to Cancel <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                    </span>
                                  ) : (
                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-3xs flex items-center gap-1">
                                      Active Membership <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    </span>
                                  )}
                                </div>

                                <div className="p-5 flex flex-col gap-3">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                      {subDetails.cancelAtPeriodEnd ? "Access Ends On" : "Next Billing Date"}
                                    </span>
                                    <p className="text-[#191919] font-extrabold text-sm mt-0.5">
                                      {subDetails.nextBillingDate}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {subDetails.cancelAtPeriodEnd ? (
                                <div className="flex flex-col gap-3">
                                  <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-sm font-semibold leading-relaxed">
                                    Subscription cancelled — Membership access continues until <strong>{subDetails.nextBillingDate}</strong> (5 daily AI checks).
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
                                          Reactivate Membership
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
                                          Upgrade to Membership ($4.99/mo)
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmCancel(true)}
                                  className="w-full bg-white hover:bg-red-50 border border-red-200 text-red-600 py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                                >
                                  Cancel Membership
                                </button>
                              )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                  {/* TAB 4: 🔒 SECURITY & PRIVACY */}
                  {accountTab === 'security' && (
                    <div className="flex flex-col gap-4 animate-fade-in">
                      {/* Blocked Pet Sitters & Owners (Pet Sitting) */}
                      <div 
                        style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
                        className="bg-white border border-[#DFD3C7] rounded-2xl overflow-hidden"
                      >
                        <div className="bg-[#FAF5EE] px-5 py-3 border-b border-[#EADBCE] flex items-center justify-between">
                          <span className="text-xs font-extrabold text-[#2E2419] flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center text-xs">
                              <Ban className="w-3.5 h-3.5" />
                            </span>
                            Blocked Sitters & Owners
                          </span>
                        </div>

                        <div className="p-5 flex flex-col gap-3">
                          {blockedUsers.length === 0 ? (
                            <p className="text-xs text-gray-400 font-medium italic">No blocked users</p>
                          ) : (
                            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                              {blockedUsers.map((user: any) => (
                                <div key={user.id} className="flex items-center justify-between bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl px-4 py-2.5 shadow-2xs">
                                  <span className="text-xs font-bold text-gray-700 truncate max-w-[200px]" title={user.blocked_email}>
                                    {user.blocked_email}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUnblockUser(user.blocked_email)}
                                    className="text-xs text-[#8B5E3C] hover:text-[#734A2E] font-extrabold hover:underline cursor-pointer bg-transparent border-none"
                                  >
                                    Unblock
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Blocked Users Section */}
                      {blockedEmails.length > 0 && (
                        <div 
                          style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
                          className="bg-white border border-[#DFD3C7] rounded-2xl overflow-hidden"
                        >
                          <div className="bg-[#FAF5EE] px-5 py-3 border-b border-[#EADBCE] flex items-center justify-between">
                            <span className="text-xs font-extrabold text-[#2E2419] flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center text-xs">
                                <Ban className="w-3.5 h-3.5" />
                              </span>
                              Blocked Users
                            </span>
                          </div>
                          <div className="p-5 flex flex-col gap-2 max-h-40 overflow-y-auto">
                            {blockedEmails.map((blockedEmail) => (
                              <div key={blockedEmail} className="flex items-center justify-between bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl px-4 py-2.5 shadow-2xs">
                                <span className="text-xs font-bold text-gray-700 truncate max-w-[200px]" title={blockedEmail}>
                                  {blockedEmail}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUnblockEmail(blockedEmail)}
                                  className="text-xs text-[#8B5E3C] hover:text-[#734A2E] font-extrabold hover:underline cursor-pointer bg-transparent border-none"
                                >
                                  Unblock
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Blocked Cookies Section */}
                      {blockedCookies.length > 0 && (
                        <div className="bg-[#FAF6F4] border border-[#8B5E3C]/10 rounded-2xl p-5 flex flex-col gap-3">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Blocked Community Posters</span>
                          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                            {blockedCookies.map((blockedCookie) => (
                              <div key={blockedCookie} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                <span className="text-xs font-bold text-gray-700 truncate max-w-[200px]" title={blockedCookie}>
                                  Poster {blockedCookie.substring(0, 8)}...
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUnblockCookie(blockedCookie)}
                                  className="text-xs text-[#8B5E3C] hover:text-[#734A2E] font-extrabold hover:underline cursor-pointer bg-transparent border-none"
                                >
                                  Unblock
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sign Out All Devices Button */}
                      <button
                        type="button"
                        onClick={handleSignOutAllDevices}
                        className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                      >
                        <Lock className="w-4 h-4 text-gray-500" /> Sign Out All Devices
                      </button>

                      {/* Delete My Account Button */}
                      <button
                        type="button"
                        onClick={() => setShowConfirmDelete(true)}
                        className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                      >
                        <AlertTriangle className="w-4 h-4 text-red-500" /> Delete My Account
                      </button>
                    </div>
                  )}
                </div>
              )}
              {showConfirmCancel && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[99999] animate-fade-in">
                  <div className="bg-white rounded-3xl p-6 pb-32 md:p-8 max-w-sm w-full shadow-2xl border border-gray-100 flex flex-col gap-6 relative text-center items-center justify-center">
                    <div className="flex flex-col items-center">
                      <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
                      <h3 className="text-xl font-black text-[#191919] leading-tight">
                        Cancel {subDetails?.isPartner ? (subDetails.partnerLabel || 'Partner') : 'Membership'} Subscription?
                      </h3>
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                        {subDetails?.isPartner ? (
                          <>
                            Your <strong>{subDetails.partnerLabel || 'Partner'}</strong> listing will remain active until the end of your current billing period on <strong>{subDetails.nextBillingDate}</strong>, after which automatic renewal will stop.
                          </>
                        ) : (
                          <>
                            Your Membership benefits (5 daily AI checks) will continue until the end of your billing cycle on <strong>{subDetails?.nextBillingDate}</strong>, after which your account will return to the free plan.
                          </>
                        )}
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
                        ) : `Yes, cancel ${subDetails?.isPartner ? 'subscription' : 'membership'}`}
                      </button>
                      <button
                        onClick={() => setShowConfirmCancel(false)}
                        disabled={loading}
                        className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 py-3.5 rounded-xl font-bold text-sm transition-colors border border-gray-200 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        Keep {subDetails?.isPartner ? 'Subscription' : 'Membership'} <Sparkles className="w-4 h-4 text-[#8B5E3C]" />
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
                        Are you sure you want to delete your account? This will permanently delete all your data including bookings, pets, and posts.
                        {subDetails?.active && (
                          <span className="flex items-center gap-1.5 justify-center mt-2 font-semibold text-red-600">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>This will also immediately cancel your active {subDetails.isPartner ? (subDetails.partnerLabel || 'Partner') : 'Membership'} subscription.</span>
                          </span>
                        )}
                        <span className="block mt-1 font-medium text-gray-600">This cannot be undone.</span>
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
