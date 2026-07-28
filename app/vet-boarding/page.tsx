'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Stethoscope, Building2, CheckCircle2, Clock, XCircle,
  ArrowLeft, Loader2, LayoutGrid, ChevronRight, ShieldCheck, Key, Mail, RefreshCw, LogOut,
} from 'lucide-react';

const VET_SERVICES = [
  'Veterinary Boarding',
  'Medical Boarding',
  'Day Boarding',
  'Medication Administration',
  'Post-Surgical Care',
  'Isolation Boarding',
  'Emergency Boarding',
  'Senior/Special Needs Care',
];

export default function VetBoardingRegisterPage() {
  const router = useRouter();
  const [clinicEmail, setClinicEmail] = useState('');
  const [existingClinic, setExistingClinic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // OTP Verification state
  const [otpStep, setOtpStep] = useState<'email' | 'code'>('email');
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [form, setForm] = useState({
    clinic_name: '',
    license_number: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    website: '',
    description: '',
    services: [] as string[],
  });

  // Load saved authenticated email from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedEmail = (
      localStorage.getItem('lumo_pro_email') ||
      localStorage.getItem('lumo_sitter_email') ||
      ''
    ).trim();
    if (savedEmail) {
      setClinicEmail(savedEmail);
      setForm(prev => ({ ...prev, email: savedEmail }));
      fetchExistingClinic(savedEmail);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchExistingClinic = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vet-boarding?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.clinic) {
          setExistingClinic(data.clinic);
          setForm({
            clinic_name: data.clinic.clinic_name || '',
            license_number: data.clinic.license_number || '',
            email: data.clinic.email || email,
            phone: data.clinic.phone || '',
            address: data.clinic.address || '',
            city: data.clinic.city || '',
            state: data.clinic.state || '',
            zip: data.clinic.zip || '',
            website: data.clinic.website || '',
            description: data.clinic.description || '',
            services: data.clinic.services || [],
          });
        } else {
          setExistingClinic(null);
        }
      }
    } catch (e) {
      console.error('Failed to load clinic info');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    const trimmed = clinicEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setOtpError('Please enter a valid email address.');
      return;
    }
    setOtpError('');
    setOtpSending(true);
    try {
      const res = await fetch('/api/petsitting/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, type: 'owner' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send verification code.');
      setOtpStep('code');
      setOtpSent(true);
    } catch (err: any) {
      setOtpError(err.message || 'Error sending code.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    const trimmedEmail = clinicEmail.trim().toLowerCase();
    const trimmedCode = otpCode.trim();
    if (!trimmedCode || trimmedCode.length < 6) {
      setOtpError('Please enter the 6-digit code.');
      return;
    }
    setOtpError('');
    setOtpVerifying(true);
    try {
      const res = await fetch('/api/petsitting/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, code: trimmedCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid or expired code.');

      // Successfully authenticated!
      localStorage.setItem('lumo_pro_email', trimmedEmail);
      document.cookie = `lumo_pro_email=${encodeURIComponent(trimmedEmail)}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
      window.dispatchEvent(new Event('lumo-pro-update'));

      setForm(prev => ({ ...prev, email: trimmedEmail }));
      await fetchExistingClinic(trimmedEmail);
    } catch (err: any) {
      setOtpError(err.message || 'Verification failed.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lumo_pro_email');
      localStorage.removeItem('lumo_sitter_email');
      localStorage.removeItem('lumo_shelter_email');
      localStorage.removeItem('lumo_sitter_id');
      document.cookie = 'lumo_pro_email=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.dispatchEvent(new Event('lumo-pro-update'));
      setClinicEmail('');
      setExistingClinic(null);
      setOtpStep('email');
      setOtpCode('');
      setOtpSent(false);
      setForm({
        clinic_name: '', license_number: '', email: '', phone: '',
        address: '', city: '', state: '', zip: '', website: '', description: '', services: [],
      });
    }
  };

  const toggleService = (svc: string) => {
    setForm(prev => ({
      ...prev,
      services: prev.services.includes(svc)
        ? prev.services.filter(s => s !== svc)
        : [...prev.services, svc],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!form.clinic_name.trim() || !form.email.trim() || !form.city.trim()) {
      setErrorMsg('Clinic Name, Email, and City are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/vet-boarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setExistingClinic(data.clinic);
      setSubmitted(true);
      if (data.clinic?.status === 'approved') {
        router.push('/vet-boarding/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Status banners ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EEF4FF 0%, #F0FDF4 100%)' }}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (existingClinic && existingClinic.status === 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #EEF4FF 0%, #F0FDF4 100%)' }}>
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-xl text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-black text-[#4A3E3D] mb-2">You&apos;re Approved! 🎉</h2>
          <p className="text-[#8B7E7D] text-sm mb-6">
            <span className="font-bold text-[#4A3E3D]">{existingClinic.clinic_name}</span> is verified and listed on LumoBites.
          </p>
          <Link
            href="/vet-boarding/dashboard"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl transition-colors text-center"
          >
            Go to Dashboard
          </Link>
          <button
            onClick={handleSignOut}
            className="mt-4 text-xs text-red-600 hover:underline flex items-center justify-center gap-1 mx-auto"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out / Switch Account
          </button>
        </div>
      </div>
    );
  }

  if (existingClinic && existingClinic.status === 'pending' && !submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #EEF4FF 0%, #F0FDF4 100%)' }}>
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-xl text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-black text-[#4A3E3D] mb-2">Application Pending</h2>
          <p className="text-[#8B7E7D] text-sm mb-4">
            Your application for <span className="font-bold text-[#4A3E3D]">{existingClinic.clinic_name}</span> is under review. We&apos;ll email you within 2–3 business days.
          </p>
          <Link href="/" className="block w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-3 rounded-2xl transition-colors text-center border border-blue-200">
            Return Home
          </Link>
          <button
            onClick={handleSignOut}
            className="mt-4 text-xs text-red-600 hover:underline flex items-center justify-center gap-1 mx-auto"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out / Switch Account
          </button>
        </div>
      </div>
    );
  }

  // Submitted success state
  if (submitted && existingClinic?.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #EEF4FF 0%, #F0FDF4 100%)' }}>
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-xl text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-black text-[#4A3E3D] mb-2">Application Submitted!</h2>
          <p className="text-[#8B7E7D] text-sm mb-6">
            Thanks! We&apos;ll review <span className="font-bold text-[#4A3E3D]">{existingClinic.clinic_name}</span> and send a decision to <span className="font-medium">{form.email}</span> within 2–3 business days.
          </p>
          <Link href="/" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl transition-colors text-center">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const isRejected = existingClinic?.status === 'rejected';
  const isAuthenticated = !!form.email;

  return (
    <div className="min-h-screen pb-28" style={{ background: 'linear-gradient(135deg, #EEF4FF 0%, #F0FDF4 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-blue-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl hover:bg-blue-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#4A3E3D]" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-[#4A3E3D]">Veterinary Boarding Partner</span>
          </div>
        </div>

        {isAuthenticated && (
          <button
            onClick={handleSignOut}
            className="text-xs font-bold text-gray-500 hover:text-red-600 border border-gray-200 bg-white px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 pt-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4 border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Partner Program
          </div>
          <h1 className="text-2xl font-black text-[#4A3E3D] mb-2">
            {isRejected ? 'Re-Apply as a Partner Clinic' : 'List Your Veterinary Clinic'}
          </h1>
          <p className="text-[#8B7E7D] text-sm">
            {isRejected
              ? `Your previous application was not approved: "${existingClinic.rejection_reason || 'No reason provided'}". Please update your details and resubmit.`
              : 'Reach pet owners actively searching for boarding. Verified clinics appear alongside trusted sitters with a 🏥 partner badge.'}
          </p>
        </div>

        {isRejected && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex gap-3">
            <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700">Application Not Approved</p>
              <p className="text-sm text-red-600">{existingClinic.rejection_reason || 'Please review your information and resubmit.'}</p>
            </div>
          </div>
        )}

        {/* 🔐 Secure OTP Sign In Gate (if not authenticated) */}
        {!isAuthenticated && (
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-blue-100 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-black text-[#4A3E3D]">Sign In to Clinic Portal</h2>
            </div>
            <p className="text-xs text-[#8B7E7D] mb-4">
              Enter your clinic email to receive a 6-digit verification code. This ensures secure access to your partner account.
            </p>

            {otpStep === 'email' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#8B7E7D] uppercase tracking-wider">Clinic Email</label>
                  <input
                    type="email"
                    value={clinicEmail}
                    onChange={e => setClinicEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                    placeholder="clinic@example.com"
                    className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                {otpError && <p className="text-xs text-red-600 font-medium">{otpError}</p>}
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpSending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 border-none cursor-pointer disabled:opacity-60"
                >
                  {otpSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Send Verification Code
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800 flex items-center justify-between">
                  <span>Code sent to <strong>{clinicEmail}</strong></span>
                  <button
                    onClick={() => { setOtpStep('email'); setOtpError(''); }}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#8B7E7D] uppercase tracking-wider">6-Digit Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                    placeholder="123456"
                    className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-center text-lg font-black tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>

                {otpError && <p className="text-xs text-red-600 font-medium">{otpError}</p>}

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={otpVerifying}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 border-none cursor-pointer disabled:opacity-60"
                >
                  {otpVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Verify & Sign In
                </button>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpSending}
                  className="w-full text-xs text-[#8B7E7D] hover:text-blue-600 font-medium py-1"
                >
                  Resend code
                </button>
              </div>
            )}
          </div>
        )}

        {/* Registration form (only visible when authenticated via OTP) */}
        {isAuthenticated && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Clinic Info */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-blue-100">
              <h2 className="text-sm font-black text-[#4A3E3D] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500" />
                Clinic Information
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#8B7E7D] uppercase tracking-wider">Clinic Name *</label>
                  <input
                    required
                    value={form.clinic_name}
                    onChange={e => setForm(p => ({ ...p, clinic_name: e.target.value }))}
                    placeholder="Paws & Claws Veterinary"
                    className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#8B7E7D] uppercase tracking-wider">License Number</label>
                    <input
                      value={form.license_number}
                      onChange={e => setForm(p => ({ ...p, license_number: e.target.value }))}
                      placeholder="VET-12345"
                      className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#8B7E7D] uppercase tracking-wider">Phone</label>
                    <input
                      value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="(555) 000-0000"
                      className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#8B7E7D] uppercase tracking-wider">Email (Authenticated)</label>
                  <input
                    required
                    readOnly
                    type="email"
                    value={form.email}
                    className="mt-1 w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-xl px-4 py-2.5 text-sm cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#8B7E7D] uppercase tracking-wider">Website</label>
                  <input
                    value={form.website}
                    onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
                    placeholder="https://yourvet.com"
                    className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-blue-100">
              <h2 className="text-sm font-black text-[#4A3E3D] uppercase tracking-wider mb-4">📍 Location</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#8B7E7D] uppercase tracking-wider">Street Address</label>
                  <input
                    value={form.address}
                    onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                    placeholder="123 Main St"
                    className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#8B7E7D] uppercase tracking-wider">City *</label>
                    <input
                      required
                      value={form.city}
                      onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                      placeholder="Austin"
                      className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#8B7E7D] uppercase tracking-wider">State</label>
                    <input
                      value={form.state}
                      onChange={e => setForm(p => ({ ...p, state: e.target.value }))}
                      placeholder="TX"
                      maxLength={2}
                      className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#8B7E7D] uppercase tracking-wider">ZIP Code</label>
                  <input
                    value={form.zip}
                    onChange={e => setForm(p => ({ ...p, zip: e.target.value }))}
                    placeholder="78701"
                    className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-blue-100">
              <h2 className="text-sm font-black text-[#4A3E3D] uppercase tracking-wider mb-1 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-blue-500" />
                Services Offered
              </h2>
              <p className="text-xs text-[#8B7E7D] mb-4">Select all that apply — shown as tags on your listing.</p>
              <div className="grid grid-cols-2 gap-2">
                {VET_SERVICES.map(svc => {
                  const checked = form.services.includes(svc);
                  return (
                    <button
                      key={svc}
                      type="button"
                      onClick={() => toggleService(svc)}
                      className={`text-left px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                        checked
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-gray-50 text-[#4A3E3D] border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {checked ? '✓ ' : ''}{svc}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-blue-100">
              <h2 className="text-sm font-black text-[#4A3E3D] uppercase tracking-wider mb-4">📝 About Your Clinic</h2>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Tell pet owners about your clinic's facilities, staff experience, and boarding philosophy..."
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              />
            </div>

            {/* Benefits callout */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-5 border border-blue-200">
              <p className="text-xs font-black text-blue-800 uppercase tracking-wider mb-3">What you get as a partner</p>
              <ul className="space-y-2">
                {[
                  '🏥 Listed alongside trusted pet sitters',
                  '✅ Verified partner badge on your listing',
                  '💬 Direct in-app messaging from pet owners',
                  '📊 Dashboard to manage inquiries & profile',
                ].map(item => (
                  <li key={item} className="text-sm text-blue-800 font-medium">{item}</li>
                ))}
              </ul>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-600 font-medium">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black py-4 rounded-2xl transition-colors text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
              {submitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
              ) : (
                <>{isRejected ? 'Re-Submit Application' : 'Submit Application'} <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
            <p className="text-center text-xs text-[#8B7E7D]">
              By submitting you agree to our partner terms. Applications are reviewed within 2–3 business days.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
