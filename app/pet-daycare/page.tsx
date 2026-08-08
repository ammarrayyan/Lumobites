'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, ArrowLeft, CheckCircle2, ShieldAlert, Sparkles, Send, Lock, Clock, LogOut } from 'lucide-react';
import CityAutocompleteInput from '@/components/CityAutocompleteInput';
import { formatPublicCity } from '@/lib/formatCity';

const DAYCARE_SERVICES = [
  'Group Play',
  'Supervised Outdoor Time',
  'Puppy Socialization',
  'Webcam/Live Monitoring',
  'Basic Grooming/Bath Add-On',
  'Training Reinforcement',
  'Small Dog / Large Dog Separation',
  'Cat Daycare'
];

export default function DaycareRegistrationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingDaycare, setExistingDaycare] = useState<any>(null);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // OTP Sign-In State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [daycareEmail, setDaycareEmail] = useState('');
  const [otpStep, setOtpStep] = useState<'email' | 'code'>('email');
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Form State
  const [form, setForm] = useState({
    business_name: '',
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('lumo_pro_email') || localStorage.getItem('lumo_sitter_email') || '';
      if (cached) {
        setDaycareEmail(cached);
        setForm(prev => ({ ...prev, email: cached }));
        setIsAuthenticated(true);
        fetchExistingDaycare(cached);
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchExistingDaycare = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pet-daycare?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.daycare) {
          setExistingDaycare(data.daycare);
          if (data.daycare.status === 'approved') {
            router.replace('/pet-daycare/dashboard');
            return; // Keep loading = true to prevent form flash while redirecting!
          }
          setForm({
            business_name: data.daycare.business_name || '',
            license_number: data.daycare.license_number || '',
            email: data.daycare.email || email,
            phone: data.daycare.phone || '',
            address: data.daycare.address || '',
            city: data.daycare.city || '',
            state: data.daycare.state || '',
            zip: data.daycare.zip || '',
            website: data.daycare.website || '',
            description: data.daycare.description || '',
            services: data.daycare.services || [],
          });
        } else {
          setExistingDaycare(null);
        }
      }
    } catch (e) {
      console.error('Failed to load daycare info');
    }
    setLoading(false);
  };

  const checkEmailEarly = async (emailVal: string) => {
    const trimmed = emailVal.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) return true;
    try {
      const res = await fetch(`/api/partnerships/check-email?email=${encodeURIComponent(trimmed)}&target_type=pet_daycare`);
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
    const trimmed = daycareEmail.trim().toLowerCase();
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
    } catch (err: any) {
      setOtpError(err.message || 'Error sending code.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    const trimmedEmail = daycareEmail.trim().toLowerCase();
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
      if (data.sessionToken) {
        localStorage.setItem('lumo_account_session_token', data.sessionToken);
      }
      localStorage.setItem('lumo_pro_email', trimmedEmail);
      document.cookie = `lumo_pro_email=${encodeURIComponent(trimmedEmail)}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
      window.dispatchEvent(new Event('lumo-pro-update'));

      setIsAuthenticated(true);
      setForm(prev => ({ ...prev, email: trimmedEmail }));
      await fetchExistingDaycare(trimmedEmail);
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
      setDaycareEmail('');
      setIsAuthenticated(false);
      setExistingDaycare(null);
      setOtpStep('email');
      setOtpCode('');
      setForm({
        business_name: '', license_number: '', email: '', phone: '',
        address: '', city: '', state: '', zip: '', website: '', description: '', services: [],
      });
    }
  };

  const toggleService = (svc: string) => {
    setForm(prev => ({
      ...prev,
      services: prev.services.includes(svc)
        ? prev.services.filter(s => s !== svc)
        : [...prev.services, svc]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess(false);

    if (!form.business_name || !form.email || !form.city) {
      setSubmitError('Please fill in required fields (Business Name, Email, City).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/pet-daycare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit application.');

      setSubmitSuccess(true);
      setExistingDaycare(data.daycare);
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFAF7] flex items-center justify-center p-6">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not authenticated -> Show OTP Sign-In Portal
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FDFAF7] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#E8DDD4]">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <span className="text-3xl">🐕</span>
          </div>

          <h1 className="text-2xl font-black text-[#4A3E3D] text-center mb-1">
            Pet Daycare Portal
          </h1>
          <p className="text-[#8B7E7D] text-xs text-center mb-6">
            Sign in with your email to access your daycare dashboard or submit a partner application.
          </p>

          {otpError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              {otpError}
            </div>
          )}

          {otpStep === 'email' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4A3E3D] uppercase tracking-wider mb-1.5">
                  Business / Contact Email
                </label>
                <input
                  type="email"
                  value={daycareEmail}
                  onChange={e => { setDaycareEmail(e.target.value); setOtpError(''); }}
                  onBlur={e => checkEmailEarly(e.target.value)}
                  placeholder="daycare@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-[#FDFAF7] border border-[#E8DDD4] text-sm text-[#4A3E3D] focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <button
                onClick={handleSendOtp}
                disabled={otpSending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md border-none cursor-pointer flex items-center justify-center gap-2 text-sm"
              >
                {otpSending ? 'Sending Code...' : (
                  <>
                    <Send className="w-4 h-4" /> Send Verification Code
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl mb-2">
                <p className="text-xs text-emerald-800">
                  Verification code sent to <strong>{daycareEmail}</strong>
                </p>
                <button
                  onClick={() => setOtpStep('email')}
                  className="text-[11px] font-bold text-emerald-700 underline mt-1 border-none bg-transparent cursor-pointer"
                >
                  Change Email
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3E3D] uppercase tracking-wider mb-1.5">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-3 rounded-xl bg-[#FDFAF7] border border-[#E8DDD4] text-center text-lg font-mono font-bold text-[#4A3E3D] tracking-widest focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={otpVerifying}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md border-none cursor-pointer flex items-center justify-center gap-2 text-sm"
              >
                {otpVerifying ? 'Verifying...' : (
                  <>
                    <Lock className="w-4 h-4" /> Verify Code & Access Portal
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Pending Status Screen
  if (existingDaycare && existingDaycare.status === 'pending') {
    return (
      <div className="min-h-screen bg-[#FDFAF7] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#E8DDD4] text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-black text-[#4A3E3D] mb-2">Application Pending Review</h1>
          <p className="text-sm text-[#8B7E7D] leading-relaxed mb-6">
            Thank you for applying! <strong>{existingDaycare.business_name}</strong> is currently under review by our admin team. You will receive an email once approved.
          </p>
          <div className="flex justify-center">
            <button
              onClick={handleSignOut}
              className="px-6 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Registration Form
  return (
    <div className="min-h-screen bg-[#FDFAF7] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-[#E8DDD4]">
        <div className="flex items-center justify-end mb-6">
          <button
            onClick={handleSignOut}
            className="text-xs font-bold text-gray-500 hover:text-gray-700 flex items-center gap-1 border-none bg-transparent cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out ({daycareEmail})
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-100">
            <span className="text-3xl">🐕</span>
          </div>
          <h1 className="text-2xl font-black text-[#4A3E3D] mb-1">
            Partner Registration: Pet Daycare
          </h1>
          <p className="text-xs text-[#8B7E7D]">
            List your daycare facility alongside verified sitters & clinics on Lumo Bites.
          </p>
        </div>

        {submitError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            {submitError}
          </div>
        )}

        {submitSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            Application submitted successfully! Our team will review your details shortly.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Business Details */}
          <div>
            <h3 className="text-sm font-black text-[#4A3E3D] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" /> Business Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  value={form.business_name}
                  onChange={e => setForm({ ...form, business_name: e.target.value })}
                  placeholder="Happy Paws Pet Daycare"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FDFAF7] border border-[#E8DDD4] text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4A3E3D] mb-1">License Number (Optional)</label>
                <input
                  type="text"
                  value={form.license_number}
                  onChange={e => setForm({ ...form, license_number: e.target.value })}
                  placeholder="LIC-998822"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FDFAF7] border border-[#E8DDD4] text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div>
            <h3 className="text-sm font-black text-[#4A3E3D] uppercase tracking-wider mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Email *</label>
                <input
                  type="email"
                  required
                  disabled
                  value={form.email}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-sm text-gray-600 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="(555) 000-0000"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FDFAF7] border border-[#E8DDD4] text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Location */}
          <div>
            <h3 className="text-sm font-black text-[#4A3E3D] uppercase tracking-wider mb-3">Location</h3>
            <CityAutocompleteInput
              label="Address / Location *"
              required
              value={form.address || form.city}
              onChange={val => {
                setForm(p => ({ ...p, address: val, city: formatPublicCity(val) }));
              }}
              placeholder="e.g. 1239 Lexington Rd, Louisville, KY or Louisville, KY"
              inputClassName="w-full px-4 py-2.5 rounded-xl bg-[#FDFAF7] border border-[#E8DDD4] text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Section 4: Website & Description */}
          <div>
            <h3 className="text-sm font-black text-[#4A3E3D] uppercase tracking-wider mb-3">Online Presence & Description</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Website URL (Auto-fetches photo/logo)</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={e => setForm({ ...form, website: e.target.value })}
                  placeholder="https://www.happypawsdaycare.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FDFAF7] border border-[#E8DDD4] text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Facility Overview / Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Tell pet owners about your daycare facility, outdoor play areas, and staff qualifications..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FDFAF7] border border-[#E8DDD4] text-sm focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Services Offered */}
          <div>
            <h3 className="text-sm font-black text-[#4A3E3D] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" /> Services Offered
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DAYCARE_SERVICES.map(svc => {
                const checked = form.services.includes(svc);
                return (
                  <button
                    key={svc}
                    type="button"
                    onClick={() => toggleService(svc)}
                    className={`p-3 rounded-xl text-xs font-bold text-left transition-all border flex items-center justify-between cursor-pointer ${
                      checked
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm'
                        : 'bg-[#FDFAF7] border-[#E8DDD4] text-[#4A3E3D] hover:border-emerald-300'
                    }`}
                  >
                    <span>{svc}</span>
                    {checked && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-all shadow-md hover:shadow-lg border-none cursor-pointer flex items-center justify-center gap-2 text-base"
          >
            {submitting ? 'Submitting Application...' : 'Submit Partner Application'}
          </button>
        </form>
      </div>
    </div>
  );
}
