'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { Copy, QrCode, Download, Share2, Activity, Users, DollarSign, ArrowRight, ShieldCheck, HelpCircle, Lock, Mail, Footprints, AlertTriangle, CheckCircle2, XCircle, Lightbulb, X } from 'lucide-react';

type Step = 'email' | 'verification' | 'dashboard';

export default function AffiliateDashboard() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Affiliate & stats data
  const [affiliate, setAffiliate] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [referralsList, setReferralsList] = useState<any[]>([]);

  // QR Code canvas reference
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  // Check for cached session on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cachedEmail = localStorage.getItem('lumo_affiliate_email');
      if (cachedEmail && cachedEmail.trim() !== '') {
        setEmail(cachedEmail);
        // Automatically fetch stats if we have cached email
        fetchStats(cachedEmail);
      }
    }
  }, []);

  // Generate QR code when modal is shown or dashboard is rendered
  useEffect(() => {
    if (step === 'dashboard' && affiliate?.referral_code && qrCanvasRef.current) {
      const url = `https://lumobites.net?ref=${affiliate.referral_code}`;
      QRCode.toCanvas(qrCanvasRef.current, url, {
        width: 250,
        margin: 2,
        color: {
          dark: '#3B2410',
          light: '#FFF9F2' // Cream
        }
      }, (err) => {
        if (err) console.error('QR code generation error:', err);
      });
    }
  }, [step, affiliate, showQrModal]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/affiliate/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code.');
      }

      setStep('verification');
      setMessage('Verification code sent! Please check your inbox.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not send verification code. Please try again.');
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
      const res = await fetch('/api/affiliate/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: verificationCode.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed. Please try again.');
      }

      localStorage.setItem('lumo_affiliate_email', email.trim());
      await fetchStats(email.trim());
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (targetEmail: string) => {
    try {
      const res = await fetch('/api/affiliate/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch affiliate statistics.');
      }

      setAffiliate(data.affiliate);
      setStats(data.stats);
      setReferralsList(data.referrals || []);
      setStep('dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not retrieve affiliate data.');
      // If unauthorized or not found, go back to login step
      setStep('email');
      localStorage.removeItem('lumo_affiliate_email');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('lumo_affiliate_email');
    setEmail('');
    setVerificationCode('');
    setAffiliate(null);
    setStats(null);
    setReferralsList([]);
    setStep('email');
  };

  const copyReferralLink = () => {
    if (!affiliate?.referral_code) return;
    const url = `https://lumobites.net?ref=${affiliate.referral_code}`;
    navigator.clipboard.writeText(url);
    alert('Copied to clipboard: ' + url);
  };

  const handleDownloadQR = () => {
    if (!qrCanvasRef.current || !affiliate) return;
    const url = qrCanvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `LumoBites-Affiliate-QR-${affiliate.referral_code}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-[#FDFAF7] text-[#555555] font-sans flex flex-col">
      
      <main className="flex-1 flex flex-col py-16 px-6">
        <div className="max-w-[1200px] w-full mx-auto flex flex-col items-center">
          
          {/* STEP 1: EMAIL ACCESS INPUT */}
          {step === 'email' && (
            <div className="w-full max-w-[460px] bg-white rounded-3xl border border-[#EEEEEE] shadow-[0_12px_40px_rgba(0,0,0,0.03)] p-8 md:p-10 flex flex-col gap-6 text-center animate-fade-in">
              <div className="flex flex-col items-center">
                <Lock className="w-12 h-12 text-[#8B5E3C] mb-4" />
                <h1 className="text-3xl font-[900] text-[#191919] tracking-tight mb-2">
                  Affiliate Dashboard
                </h1>
                <p className="text-sm text-gray-500 max-w-[340px] mx-auto leading-relaxed">
                  Enter your email address to access your recurring stats, link, and payout history.
                </p>
              </div>

              <form onSubmit={handleSendCode} className="flex flex-col gap-4 text-left">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Affiliate Email
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
                  <p className="text-xs text-red-500 font-semibold text-center mt-1 flex items-center justify-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" /> {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] disabled:bg-gray-300 text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : 'Send Login Code'}
                </button>

                <div className="text-center mt-4 border-t border-[#F0E6DD] pt-4">
                  <Link
                    href="/affiliate"
                    className="text-xs font-bold text-[#8B5E3C] hover:underline"
                  >
                    Not an affiliate yet? Apply now →
                  </Link>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2: VERIFICATION OTP CODE */}
          {step === 'verification' && (
            <div className="w-full max-w-[460px] bg-white rounded-3xl border border-[#EEEEEE] shadow-[0_12px_40px_rgba(0,0,0,0.03)] p-8 md:p-10 flex flex-col gap-6 text-center animate-fade-in">
              <div className="flex flex-col items-center">
                <Mail className="w-12 h-12 text-[#8B5E3C] mb-4" />
                <h1 className="text-2xl font-[900] text-[#191919] tracking-tight mb-2">
                  Verify Your Identity
                </h1>
                <p className="text-sm text-gray-500 max-w-[340px] mx-auto leading-relaxed">
                  We sent a 6-digit verification code to <strong className="text-gray-700">{email}</strong>. Code is valid for 15 minutes.
                </p>
              </div>

              <form onSubmit={handleVerifyCode} className="flex flex-col gap-4 text-left">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                    Enter Verification Code
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
                  <p className="text-xs text-emerald-600 font-semibold text-center">
                    {message}
                  </p>
                )}

                {error && (
                  <p className="text-xs text-red-500 font-semibold text-center mt-1 flex items-center justify-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" /> {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] disabled:bg-gray-300 text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : 'Verify & Enter Dashboard'}
                </button>
                <div className="mt-4 flex flex-col gap-2">
                  <div className="text-center text-xs text-[#8B7E7D]">
                    Didn't receive the code? Check your spam or junk folder.
                  </div>
                  <div className="flex justify-between items-center mt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('email');
                        setError(null);
                        setMessage(null);
                        setVerificationCode('');
                      }}
                      className="text-gray-400 hover:text-gray-600 hover:underline font-bold bg-transparent border-none cursor-pointer"
                    >
                      ← Change Email
                    </button>
                    <button
                      type="button"
                      onClick={handleSendCode}
                      className="text-[#8B5E3C] hover:underline font-bold bg-transparent border-none cursor-pointer"
                    >
                      Still nothing? Resend Code
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: MAIN AUTHENTICATED DASHBOARD */}
          {step === 'dashboard' && affiliate && stats && (
            <div className="w-full space-y-8 animate-fade-in">
              
              {/* Header Section */}
              <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-[#EEEEEE] p-6 rounded-3xl shadow-sm">
                <div>
                  <h1 className="text-2xl font-[900] text-[#191919] tracking-tight flex items-center justify-center md:justify-start gap-1.5">
                    Affiliate Partner Portal <Footprints className="w-5 h-5 text-[#8B5E3C]" />
                  </h1>
                  <p className="text-xs text-gray-400 font-bold mt-1">
                    Partner: <span className="text-[#8B5E3C]">{affiliate.full_name}</span> &middot; {affiliate.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Sign Out
                </button>
              </div>

              {/* Referral Link & QR Card */}
              <div className="bg-white border border-[#EEEEEE] p-6 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2 max-w-[620px]">
                  <span className="inline-block bg-[#8B5E3C]/10 text-[#8B5E3C] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                    Your Active Promo Code & Link
                  </span>
                  <h3 className="text-lg font-[900] text-[#191919]">lumobites.net?ref={affiliate.referral_code}</h3>
                  <p className="text-xs text-gray-400 leading-normal">
                    Share this unique tracking link in your social bio, blog posts, YouTube video descriptions, or with friends. Visitors cookie-tracked for 30 days.
                  </p>
                </div>

                <div className="flex gap-2.5 w-full md:w-auto">
                  <button
                    onClick={copyReferralLink}
                    className="flex-1 md:flex-none bg-[#8B5E3C] hover:bg-[#734A2E] text-white text-xs font-bold px-5 py-3 rounded-xl shadow-sm transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Copy size={14} /> Copy Link
                  </button>
                  <button
                    onClick={() => setShowQrModal(true)}
                    className="bg-[#FFF9F2] hover:bg-[#F5EDE4] text-[#8B5E3C] border border-[#E8DDD4] text-xs font-bold px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <QrCode size={14} /> Display QR Code
                  </button>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Subscribers */}
                <div className="bg-white border border-[#EEEEEE] p-5 rounded-3xl shadow-sm relative overflow-hidden">
                  <div className="absolute -top-1.5 -right-1.5 p-4 opacity-5 text-[#8B5E3C]">
                    <Users size={48} />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">PRO Referrals</p>
                  <p className="text-2xl font-[950] text-[#191919]">{stats.totalReferrals}</p>
                  <p className="text-[9px] text-emerald-600 font-bold mt-1">{stats.activeSubscribers} active subscribers</p>
                </div>

                {/* This Month Earnings */}
                <div className="bg-[#FFF9F2]/50 border border-[#8B5E3C]/10 p-5 rounded-3xl shadow-sm relative overflow-hidden">
                  <div className="absolute -top-1.5 -right-1.5 p-4 opacity-5 text-[#8B5E3C]">
                    <DollarSign size={48} />
                  </div>
                  <p className="text-[10px] font-bold text-[#8B5E3C] uppercase tracking-widest mb-1">Earnings This Month</p>
                  <p className="text-2xl font-[950] text-[#8B5E3C]">${stats.thisMonthEarnings.toFixed(2)}</p>
                  <p className="text-[9px] text-gray-400 mt-1">Owed: $1.00 per active PRO/mo</p>
                </div>

                {/* Total Earned and Balance */}
                <div className="bg-white border border-[#EEEEEE] p-5 rounded-3xl shadow-sm relative overflow-hidden">
                  <div className="absolute -top-1.5 -right-1.5 p-4 opacity-5 text-[#8B5E3C]">
                    <ShieldCheck size={48} />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Unpaid Balance</p>
                  <p className="text-2xl font-[950] text-emerald-600">${stats.unpaidBalance.toFixed(2)}</p>
                  <p className="text-[9px] text-gray-400 mt-1">Paid to date: ${stats.totalPaid.toFixed(2)}</p>
                </div>

              </div>

              {/* Payout Progress Section */}
              <div className="bg-white border border-[#EEEEEE] p-6 rounded-3xl shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="font-[900] text-[#191919] text-base flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-[#8B5E3C]" /> Payout Progress Tracker
                    </h3>
                    <p className="text-xs text-gray-400">
                      Payouts are automatically processed once you reach the minimum threshold of **$50.00** in earnings.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-400 uppercase">Current Unpaid: </span>
                    <span className="text-base font-[950] text-[#8B5E3C]">${stats.unpaidBalance.toFixed(2)}</span>
                    <span className="text-xs text-gray-400"> / $50.00</span>
                  </div>
                </div>

                {/* Progress Bar */}
                {(() => {
                  const balance = stats.unpaidBalance || 0;
                  const threshold = 50.00;
                  const percent = Math.min(100, (balance / threshold) * 100);
                  const remaining = Math.max(0, threshold - balance);

                  return (
                    <div className="space-y-2">
                      <div className="w-full bg-[#FAF6F4] rounded-full h-3 border border-[#E8DDD4] overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#8B5E3C] to-[#a3704c] h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        {remaining > 0 ? (
                          <span className="text-amber-700 font-bold flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            You need <strong className="text-amber-800">${remaining.toFixed(2)} more</strong> to reach your next payout!
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-bounce" />
                            Eligible for next payout! You have reached the minimum threshold.
                          </span>
                        )}
                        <span className="text-gray-400 font-bold">{percent.toFixed(0)}% complete</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Referrals Breakdown Directory */}
              <div className="bg-white border border-[#EEEEEE] rounded-3xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#F5EDE4] flex justify-between items-center bg-[#FDFAF7]">
                  <div>
                    <h3 className="font-[900] text-[#191919] text-base">Your Referrals Directory</h3>
                    <p className="text-[11px] text-gray-400">List of subscribers brought in through your referral link.</p>
                  </div>
                  <span className="bg-[#8B5E3C]/10 text-[#8B5E3C] text-[10px] font-bold uppercase px-2.5 py-1 rounded-full shadow-inner">
                    {referralsList.length} Active Referrals
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#555555]">
                    <thead className="bg-[#FAF6F4] text-gray-400 uppercase text-[9px] font-bold tracking-wider border-b border-gray-100">
                      <tr>
                        <th className="p-4">Referred Customer</th>
                        <th className="p-4">Plan Level</th>
                        <th className="p-4">Join Date</th>
                        <th className="p-4 text-center">Months Active</th>
                        <th className="p-4">Affiliate Contribution</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {referralsList.map((user: any) => (
                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 font-bold text-[#191919]">
                            {/* Obfuscate email slightly to preserve privacy */}
                            {user.referred_email.split('@')[0].slice(0, 3)}***@{user.referred_email.split('@')[1]}
                          </td>
                          <td className="p-4">
                            {user.subscription_type === 'pro_sitter' ? (
                              <span className="bg-[#64b3f4]/10 text-[#2f8ad6] px-2 py-0.5 rounded text-[10px] font-bold">Sitter Pro</span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">PRO Owner</span>
                            )}
                          </td>
                          <td className="p-4 text-gray-400">
                            {new Date(user.subscription_date).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-center font-bold text-[#191919]">
                            {user.active_months || 1}
                          </td>
                          <td className="p-4 font-bold text-[#8B5E3C]">
                            ${(Number(user.active_months || 1) * 1.00).toFixed(2)}
                          </td>
                          <td className="p-4">
                            {user.cancelled ? (
                              <span className="inline-flex items-center gap-1 text-red-500 font-bold">
                                <XCircle className="w-3.5 h-3.5" /> Cancelled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Active
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}

                      {referralsList.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-400 text-xs">
                            No referral subscribers tracked yet. Share your link to get your first conversion!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Commission Details FAQ banner */}
              <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-3xl p-6 flex flex-col md:flex-row gap-5 items-start">
                <div className="bg-white border border-[#E8DDD4] w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm flex-none">
                  <Lightbulb className="w-6 h-6 text-amber-500" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-[#191919] text-sm">How Commissions Work & Payout Terms</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Commissions are calculated as **$1.00 per month** for every active PRO subscriber you referred. Unpaid balances are processed within the first 5 business days of every month and sent directly to your PayPal account.
                  </p>
                  <p className="text-xs text-gray-400 font-medium">
                    Need to change PayPal email or have support queries? Contact <a href="mailto:info@lumobitespet.com" className="text-[#8B5E3C] hover:underline font-bold">info@lumobitespet.com</a>.
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* QR Code Modal popup */}
      {showQrModal && affiliate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-[#FFF9F2] p-8 rounded-3xl max-w-sm w-full flex flex-col items-center relative text-[#3B2410] shadow-2xl border border-[#E8DDD4]">
            <button 
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-[#3B2410]/50 hover:text-[#3B2410] font-bold bg-transparent border-none cursor-pointer flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="text-lg font-[900] mb-5 text-center">Your Branded QR Code</h3>
            
            <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 border border-[#3B2410]/10">
              <canvas ref={qrCanvasRef} className="rounded-xl w-[200px] h-[200px] mx-auto"></canvas>
            </div>
            
            <p className="font-bold text-sm text-center mb-0.5">{affiliate.full_name}</p>
            <p className="text-[10px] opacity-70 text-center mb-6 font-medium">lumobites.net?ref={affiliate.referral_code}</p>
            
            <div className="w-full flex gap-3">
              <button
                onClick={handleDownloadQR}
                className="flex-1 bg-[#3B2410] hover:bg-[#4a2e15] text-[#FFF9F2] py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
              >
                <Download size={14} /> Download QR
              </button>
              <button
                onClick={copyReferralLink}
                className="flex-1 bg-white border border-[#3B2410] text-[#3B2410] py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:bg-[#f3eadf] transition-all"
              >
                <Share2 size={14} /> Copy Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-8 border-t border-[#EEEEEE] text-center text-xs text-gray-400 bg-white">
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
