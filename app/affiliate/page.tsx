'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Footprints, DollarSign, Award, Link as LinkIcon, AlertTriangle } from 'lucide-react';

export default function AffiliateSignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [promotionMethod, setPromotionMethod] = useState('');
  const [bio, setBio] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Field-specific validation errors
  const [fullNameError, setFullNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);

  const handleFullNameChange = (val: string) => {
    setFullName(val);
    if (val.trim()) setFullNameError(false);
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (val.trim()) setEmailError(false);
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (loading) return;
    
    let hasError = false;
    if (!fullName.trim()) {
      setFullNameError(true);
      hasError = true;
    } else {
      setFullNameError(false);
    }

    if (!email.trim()) {
      setEmailError(true);
      hasError = true;
    } else {
      setEmailError(false);
    }

    if (hasError) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/affiliate/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          paypal_email: paypalEmail.trim() || null,
          promotion_method: promotionMethod.trim() || null,
          bio: bio.trim() || null,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error('Server returned an invalid response. Please try again.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application.');
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error('[Affiliate Form]', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFAF7] text-[#555555] font-sans flex flex-col">
      
      <main className="flex-1 max-w-[1000px] mx-auto px-6 py-16 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        
        {/* Left Side: Pitch Copy */}
        <div className="flex-1 space-y-6 lg:max-w-[460px] text-center lg:text-left flex flex-col items-center lg:items-start">
          <div className="inline-flex bg-[#8B5E3C]/10 text-[#8B5E3C] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider items-center gap-1.5 w-fit">
            <Footprints className="w-3.5 h-3.5" />
            Lumo Bites Affiliate Program
          </div>
          <h1 className="text-4xl md:text-5xl font-[900] text-[#191919] tracking-tight leading-tight text-center lg:text-left">
            Join Early — Earn When We Launch Paid Plans
          </h1>
          <p className="text-base text-gray-500 leading-relaxed text-center lg:text-left">
            Join our affiliate program now for free! Lumo Bites is currently free during our early launch period. When we introduce paid memberships, you'll automatically earn <strong className="text-gray-700">$1 every month</strong> for each person you referred who subscribes — for as long as they stay subscribed. Sign up now to build your referral network early and maximize your future earnings.
          </p>
          <div className="flex items-center gap-1 justify-center lg:justify-start text-xs text-gray-400 leading-relaxed italic font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-[#8B5E3C]" />
            Early affiliates get priority status and the best commission rates when paid plans launch. Don't miss out — join now while it's free!
          </div>

          <div className="pt-4 space-y-4 text-left hidden lg:block">
            <div className="flex items-start gap-3.5">
              <div className="bg-[#FFF9F2] border border-[#E8DDD4] w-10 h-10 rounded-xl flex items-center justify-center shadow-sm">
                <LinkIcon className="w-5 h-5 text-[#8B5E3C]" />
              </div>
              <div>
                <h4 className="font-bold text-[#191919] text-sm">1. Share Your Link</h4>
                <p className="text-xs text-gray-400 leading-normal mt-0.5">Post on your blog, social media, or share directly with pet parent groups.</p>
              </div>
            </div>
            <div className="flex items-start gap-3.5">
              <div className="bg-[#FFF9F2] border border-[#E8DDD4] w-10 h-10 rounded-xl flex items-center justify-center shadow-sm">
                <Award className="w-5 h-5 text-[#8B5E3C]" />
              </div>
              <div>
                <h4 className="font-bold text-[#191919] text-sm">2. Promote Premium</h4>
                <p className="text-xs text-gray-400 leading-normal mt-0.5">Users unlock unlimited ingredient safety scans, priority recall alerts, and sitter contacts.</p>
              </div>
            </div>
            <div className="flex items-start gap-3.5">
              <div className="bg-[#FFF9F2] border border-[#E8DDD4] w-10 h-10 rounded-xl flex items-center justify-center shadow-sm">
                <DollarSign className="w-5 h-5 text-[#8B5E3C]" />
              </div>
              <div>
                <h4 className="font-bold text-[#191919] text-sm">3. Earn Monthly Residuals</h4>
                <p className="text-xs text-gray-400 leading-normal mt-0.5">Current earnings: $0 (platform is free during early access)<br />Future earnings: $1/month per referred paying member<br />Example: Refer 20 people → they start paying → you earn $20/month passively</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Signup Form / Success Screen */}
        <div className="w-full max-w-[480px] bg-white rounded-3xl border border-[#EEEEEE] shadow-[0_12px_40px_rgba(0,0,0,0.03)] p-8 md:p-10">
          
          {submitted ? (
            <div className="text-center py-6 flex flex-col items-center gap-5 animate-fade-in">
              <div className="text-6xl">🎉</div>
              <h2 className="text-2xl font-[900] text-[#191919] tracking-tight">
                Application Submitted!
              </h2>
              <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-2xl p-5 text-left text-xs text-gray-500 leading-relaxed max-w-[360px]">
                <p className="mb-2 font-bold text-[#8B5E3C]">
                  Thank you for applying! We will review your application and get back to you within 48 hours. Check your email for confirmation.
                </p>
                <p className="mt-2">Your application has been received and is currently under review by our team.</p>
                <p className="mt-1">We review applications within 24-48 hours. You will receive an email at <strong>{email.toLowerCase()}</strong> once your application has been processed.</p>
              </div>
              <p className="text-xs text-gray-400 mt-2 font-medium flex items-center gap-1 justify-center">
                Thank you for partnering with Lumo Bites! <Footprints className="w-4 h-4 text-gray-400" />
              </p>
              <Link
                href="/"
                className="mt-4 bg-[#8B5E3C] hover:bg-[#734A2E] text-white py-3.5 px-6 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer w-full text-center"
              >
                Back to Homepage
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              <div>
                <h3 className="text-xl font-[950] text-[#191919] tracking-tight">
                  Join our affiliate program
                </h3>
                <p className="text-xs text-gray-400 mt-1 leading-normal">
                  Fill out the form below. Payouts are sent via PayPal once you reach $50 in earnings.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => handleFullNameChange(e.target.value)}
                    placeholder="Jane Doe"
                    disabled={loading}
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 text-sm text-[#191919] bg-white transition-all disabled:opacity-50 ${
                      fullNameError 
                        ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' 
                        : 'border-[#E8DDD4] focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C]'
                    }`}
                  />
                  {fullNameError && (
                    <span className="text-[10px] text-red-500 font-semibold mt-0.5 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Full name is required
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="jane@example.com"
                    disabled={loading}
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 text-sm text-[#191919] bg-white transition-all disabled:opacity-50 ${
                      emailError 
                        ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' 
                        : 'border-[#E8DDD4] focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C]'
                    }`}
                  />
                  {emailError && (
                    <span className="text-[10px] text-red-500 font-semibold mt-0.5 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Email address is required
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    PayPal Email (for payouts)
                  </label>
                  <input
                    type="email"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    placeholder="paypal@example.com (optional)"
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl border border-[#E8DDD4] outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C] text-sm text-[#191919] bg-white transition-all disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Promotion Method
                  </label>
                  <input
                    type="text"
                    value={promotionMethod}
                    onChange={(e) => setPromotionMethod(e.target.value)}
                    placeholder="e.g. My website, Instagram, Facebook group"
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl border border-[#E8DDD4] outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C] text-sm text-[#191919] bg-white transition-all disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Tell us about yourself (Bio)
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Brief description of your audience or platform..."
                    rows={3}
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl border border-[#E8DDD4] outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C] text-sm text-[#191919] bg-white transition-all resize-none disabled:opacity-50"
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500 font-semibold text-center mt-1 flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                onClick={handleSubmit}
                className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] disabled:bg-gray-300 text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Submitting...</span>
                  </div>
                ) : 'Join Free — Start Referring Now'}
              </button>

              <div className="text-center mt-2 border-t border-[#F0E6DD] pt-4">
                <Link
                  href="/affiliate/dashboard"
                  className="text-xs font-bold text-[#8B5E3C] hover:underline"
                >
                  Already approved? Access your dashboard →
                </Link>
              </div>
            </form>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-[#EEEEEE] text-center text-xs text-gray-400 mt-12 bg-white">
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
