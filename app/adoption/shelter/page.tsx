'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CityAutocompleteInput from '@/components/CityAutocompleteInput';
import { formatPublicCity } from '@/lib/formatCity';
import {
  Building2, ArrowLeft, CheckCircle2, ShieldAlert, Sparkles, Send, Lock, Clock, LogOut, X,
  ShieldCheck, Key, Mail, RefreshCw, Loader2, LayoutGrid, Heart,
} from 'lucide-react';

export default function ShelterRegistrationPage() {
  const router = useRouter();
  const [shelterEmail, setShelterEmail] = useState('');
  const [existingShelter, setExistingShelter] = useState<any>(null);
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
    org_name: '',
    tax_id: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    website: '',
    description: '',
    org_photo_url: '',
  });

  // Load saved authenticated email from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedEmail = (
      localStorage.getItem('lumo_pro_email') ||
      localStorage.getItem('lumo_sitter_email') ||
      localStorage.getItem('lumo_shelter_email') ||
      ''
    ).trim();

    if (savedEmail) {
      setShelterEmail(savedEmail);
      setForm(prev => ({ ...prev, email: savedEmail }));
      fetchExistingShelter(savedEmail);
    } else {
      setLoading(false);
    }
  }, []);

  const [existingConflictMsg, setExistingConflictMsg] = useState('');

  const fetchExistingShelter = async (email: string) => {
    setLoading(true);
    try {
      const checkRes = await fetch(`/api/partnerships/check-email?email=${encodeURIComponent(email)}&target_type=shelter`);
      const checkData = await checkRes.json();
      if (checkRes.ok && checkData.valid === false) {
        setExistingConflictMsg(checkData.error);
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/adoption/shelter?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.shelter) {
          setExistingShelter(data.shelter);
          if (data.shelter.status === 'approved') {
            router.replace('/adoption/shelter/dashboard');
            return; // Keep loading = true to prevent form flash while redirecting!
          }
          setForm({
            org_name: data.shelter.org_name || '',
            tax_id: data.shelter.tax_id || '',
            email: data.shelter.email || email,
            phone: data.shelter.phone || '',
            address: data.shelter.address || '',
            city: data.shelter.city || '',
            state: data.shelter.state || '',
            zip: data.shelter.zip || '',
            website: data.shelter.website || '',
            description: data.shelter.description || '',
            org_photo_url: data.shelter.org_photo_url || '',
          });
        } else {
          setExistingShelter(null);
        }
      }
    } catch (e) {
      console.error('Failed to load shelter info');
    }
    setLoading(false);
  };

  const checkEmailEarly = async (emailVal: string) => {
    const trimmed = emailVal.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) return true;
    try {
      const res = await fetch(`/api/partnerships/check-email?email=${encodeURIComponent(trimmed)}&target_type=shelter`);
      const data = await res.json();
      if (data.valid === false) {
        setOtpError(data.error);
        return false;
      }
      setOtpError('');
      return true;
    } catch (e) {
      return true;
    }
  };

  const handleSendOtp = async () => {
    const trimmed = shelterEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setOtpError('Please enter a valid email address.');
      return;
    }
    setOtpError('');
    setOtpSending(true);
    try {
      const isClean = await checkEmailEarly(trimmed);
      if (!isClean) return;

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
    const trimmedEmail = shelterEmail.trim().toLowerCase();
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

      if (data.sessionToken) {
        localStorage.setItem('lumo_account_session_token', data.sessionToken);
      }
      localStorage.setItem('lumo_pro_email', trimmedEmail);
      document.cookie = `lumo_pro_email=${encodeURIComponent(trimmedEmail)}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
      window.dispatchEvent(new Event('lumo-pro-update'));

      setForm(prev => ({ ...prev, email: trimmedEmail }));
      await fetchExistingShelter(trimmedEmail);
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
      document.cookie = 'lumo_pro_email=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.dispatchEvent(new Event('lumo-pro-update'));
      setShelterEmail('');
      setExistingShelter(null);
      setOtpStep('email');
      setOtpCode('');
      setOtpSent(false);
      setExistingConflictMsg('');
      setForm({
        org_name: '', tax_id: '', email: '', phone: '',
        address: '', city: '', state: '', zip: '', website: '', description: '', org_photo_url: '',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!form.org_name.trim() || !form.email.trim() || !form.city.trim()) {
      setErrorMsg('Organization Name, Contact Email, and City are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/adoption/shelter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setExistingShelter(data.shelter);
      setSubmitted(true);
      if (data.shelter?.status === 'approved') {
        router.push('/adoption/shelter/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFAF7] flex flex-col items-center justify-center p-4">
        <Building2 className="w-12 h-12 text-[#8B5E3C] animate-bounce mb-3" />
        <p className="text-sm font-bold text-[#8B7E7D]">Loading Shelter Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFAF7] py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Top Header */}
        <div className="mb-8">
          <Link
            href="/adoption"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8B7E7D] hover:text-[#191919] transition-colors mb-4 no-underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Adoption
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 border border-orange-200">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#191919] tracking-tight">
                Rescue &amp; Shelter Partner Portal
              </h1>
              <p className="text-sm text-[#8B7E7D]">
                List adoptable pets, receive adopter inquiries, and connect with caring families in your community.
              </p>
            </div>
          </div>
        </div>

        {/* Conflict Message */}
        {existingConflictMsg && (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 sm:p-8 text-center mb-8 shadow-xs">
            <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-3" />
            <h2 className="text-lg font-black text-rose-950 mb-1">Account Conflict</h2>
            <p className="text-xs text-rose-800 leading-relaxed max-w-md mx-auto mb-5">
              {existingConflictMsg}
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-6 rounded-xl text-xs transition-all shadow-xs inline-flex items-center gap-2 border-none cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Sign Out &amp; Use Shelter Email
            </button>
          </div>
        )}

        {/* Existing Application Status View */}
        {!existingConflictMsg && existingShelter && existingShelter.status !== 'approved' && (
          <div className="bg-white border border-[#E8DDD4] rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
            {existingShelter.status === 'pending' && (
              <div className="text-center max-w-lg mx-auto space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 mx-auto font-bold">
                  <Clock className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-gray-900">Application Under Review</h2>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Your shelter application for <strong>{existingShelter.org_name}</strong> has been received and is currently under review by our verification team.
                </p>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-900 text-left space-y-1.5">
                  <p><strong>Organization:</strong> {existingShelter.org_name}</p>
                  <p><strong>Registered Email:</strong> {existingShelter.email}</p>
                  <p><strong>Location:</strong> {existingShelter.city || 'Not specified'}</p>
                  <p><strong>Status:</strong> <span className="bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-md uppercase text-[10px]">PENDING APPROVAL</span></p>
                </div>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="bg-[#FAF6F2] hover:bg-[#F0E6DD] text-gray-700 font-bold py-2.5 px-5 rounded-xl text-xs border border-[#DFD3C7] cursor-pointer transition-all"
                  >
                    Switch Account
                  </button>
                </div>
              </div>
            )}

            {existingShelter.status === 'rejected' && (
              <div className="text-center max-w-lg mx-auto space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto font-bold">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-gray-900">Application Not Approved</h2>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Thank you for your interest. At this time, the application for <strong>{existingShelter.org_name}</strong> was not approved for partner access.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all border-none cursor-pointer"
                  >
                    Sign In with Different Account
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Authentication View if not logged in */}
        {!existingConflictMsg && !existingShelter && !shelterEmail && (
          <div className="bg-white border border-[#E8DDD4] rounded-3xl p-6 sm:p-8 shadow-xs max-w-md mx-auto text-center">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-100">
              <Mail className="w-7 h-7 text-[#8B5E3C]" />
            </div>
            <h2 className="text-xl font-black text-[#191919] mb-1.5">Sign In / Register</h2>
            <p className="text-xs text-[#8B7E7D] leading-relaxed mb-6">
              Enter your contact email to receive a secure 6-digit verification code.
            </p>

            {otpError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl mb-4 font-semibold text-left">
                {otpError}
              </div>
            )}

            {otpStep === 'email' ? (
              <div className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Contact / Organization Email *
                  </label>
                  <input
                    type="email"
                    value={shelterEmail}
                    onChange={e => setShelterEmail(e.target.value)}
                    placeholder="contact@shelter.org"
                    className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-[#8B5E3C]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpSending}
                  className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-50"
                >
                  {otpSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send 6-Digit Code
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Enter 6-Digit Code sent to {shelterEmail}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-3 text-center text-lg tracking-widest font-black text-gray-900 focus:outline-none focus:border-[#8B5E3C]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpVerifying || otpCode.length < 6}
                    className="flex-1 bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold py-3 rounded-xl text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-50"
                  >
                    {otpVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Verify Code
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOtpStep('email'); setOtpCode(''); }}
                    className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-xs cursor-pointer border-none"
                  >
                    Edit Email
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Registration Form View */}
        {!existingConflictMsg && !existingShelter && shelterEmail && (
          <div className="bg-white border border-[#E8DDD4] rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E8DDD4] pb-4 mb-6">
              <div>
                <h2 className="text-lg font-black text-[#191919]">Organization Details</h2>
                <p className="text-xs text-[#8B7E7D]">Signed in as <strong>{shelterEmail}</strong></p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs font-bold text-gray-500 hover:text-gray-900 underline bg-transparent border-none cursor-pointer"
              >
                Sign Out
              </button>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl mb-6 font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1 uppercase tracking-wider">
                    Organization / Rescue Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.org_name}
                    onChange={e => setForm(prev => ({ ...prev, org_name: e.target.value }))}
                    placeholder="e.g. City Humane Society"
                    className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-[#8B5E3C]"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1 uppercase tracking-wider">
                    EIN / 501(c)(3) / Tax ID
                  </label>
                  <input
                    type="text"
                    value={form.tax_id}
                    onChange={e => setForm(prev => ({ ...prev, tax_id: e.target.value }))}
                    placeholder="XX-XXXXXXX"
                    className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-[#8B5E3C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 000-0000"
                    className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-[#8B5E3C]"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1 uppercase tracking-wider">
                    Location (City, State) *
                  </label>
                  <CityAutocompleteInput
                    value={form.city}
                    onChange={c => setForm(prev => ({ ...prev, city: c }))}
                    placeholder="e.g. Austin, TX"
                    className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-[#8B5E3C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1 uppercase tracking-wider">
                    Website or Social URL
                  </label>
                  <input
                    type="url"
                    value={form.website}
                    onChange={e => setForm(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://myshelter.org"
                    className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-[#8B5E3C]"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1 uppercase tracking-wider">
                    Logo / Photo URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={form.org_photo_url}
                    onChange={e => setForm(prev => ({ ...prev, org_photo_url: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                    className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-[#8B5E3C]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1 uppercase tracking-wider">
                  About Your Rescue / Adoption Mission
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell adopters about your rescue organization, intake policies, and mission..."
                  className="w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-[#8B5E3C]"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-black py-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Building2 className="w-5 h-5" />}
                  Submit Shelter Application
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
