'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Stethoscope, Building2, MessageSquare, Clock, CheckCircle2,
  XCircle, Edit3, Save, ArrowLeft, Loader2, RefreshCw,
  Phone, Globe, MapPin, ShieldCheck, LogOut, ChevronDown, ChevronUp,
  Mail, AlertCircle, Star, Trash2,
} from 'lucide-react';
import ChatModal from '@/components/ChatModal';
import CityAutocompleteInput from '@/components/CityAutocompleteInput';
import PartnerBillingBanner from '@/components/PartnerBillingBanner';
import { formatPublicCity } from '@/lib/formatCity';

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

const STATUS_CONFIG = {
  pending: { label: 'Pending Review', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock },
  approved: { label: 'Approved & Active', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle2 },
  rejected: { label: 'Not Approved', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle },
  paused: { label: 'Listing Paused', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', icon: AlertCircle },
};

export default function VetBoardingDashboardPage() {
  const router = useRouter();
  const [clinicEmail, setClinicEmail] = useState('');
  const [clinic, setClinic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [monthlyPrice, setMonthlyPrice] = useState<number>(40);

  // Inquiries
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'inquiries' | 'availability' | 'profile'>('overview');

  // Availability Calendar State
  const [fullDates, setFullDates] = useState<string[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [calMonthOffset, setCalMonthOffset] = useState(0); // 0 = current month
  const [togglingDate, setTogglingDate] = useState<string | null>(null);

  // Profile Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [inquiryFilter, setInquiryFilter] = useState<'all' | 'unread' | 'replied' | 'archived'>('all');

  // Chat modal
  const [chatOpen, setChatOpen] = useState(false);
  const [activeInquiry, setActiveInquiry] = useState<any>(null);

  const handleToggleArchiveInquiry = async (inqId: string, currentArchived: boolean) => {
    if (!currentArchived) {
      if (!confirm('Archive this inquiry? It will be moved to the Archived tab.')) return;
    }
    try {
      const res = await fetch('/api/vet-boarding/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inqId, archived: !currentArchived })
      });
      if (res.ok) {
        setInquiries(prev => prev.map(i => i.id === inqId ? { ...i, archived: !currentArchived } : i));
      }
    } catch (err) {
      console.error('Failed to toggle archive status:', err);
    }
  };

  // ─── Load clinic on mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const email = (
      localStorage.getItem('lumo_pro_email') ||
      localStorage.getItem('lumo_sitter_email') ||
      localStorage.getItem('lumo_shelter_email') ||
      ''
    ).trim();
    if (!email) {
      router.push('/vet-boarding');
      return;
    }
    setClinicEmail(email);
    loadClinic(email);

    const params = new URLSearchParams(window.location.search);
    const targetInquiryId = params.get('inquiry');
    if (targetInquiryId) {
      fetch(`/api/vet-boarding/inquiries?id=${targetInquiryId}`)
        .then(r => r.json())
        .then(data => {
          if (data.inquiry) {
            setActiveInquiry(data.inquiry);
            setChatOpen(true);
          }
        })
        .catch(() => {});
    }
  }, []);

  const loadClinic = async (email: string) => {
    setLoading(true);
    try {
      // Fetch live pricing setting
      fetch('/api/partner-pricing?type=vet_boarding')
        .then(r => r.json())
        .then(d => { if (d?.pricing?.monthly_price_usd) setMonthlyPrice(Number(d.pricing.monthly_price_usd)); })
        .catch(() => {});

      const res = await fetch(`/api/vet-boarding?email=${encodeURIComponent(email)}&_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.clinic) {
          setClinic(data.clinic);
          setEditForm({ ...data.clinic });
          if (data.clinic.status === 'approved' || data.clinic.status === 'paused') {
            loadInquiries(data.clinic.id);
            loadAvailability(data.clinic.id);
          }
        } else {
          // No clinic — redirect to registration
          router.push('/vet-boarding');
        }
      }
    } catch {
      console.error('Failed to load clinic');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async (clinicId: string) => {
    setLoadingAvailability(true);
    try {
      const res = await fetch(`/api/vet-boarding/availability?clinic_id=${clinicId}`);
      if (res.ok) {
        const data = await res.json();
        setFullDates(data.full_dates || []);
      }
    } catch {
      console.error('Failed to load availability');
    } finally {
      setLoadingAvailability(false);
    }
  };

  const toggleDateAvailability = async (dateStr: string) => {
    if (!clinic?.id) return;
    setTogglingDate(dateStr);
    const isCurrentlyFull = fullDates.includes(dateStr);
    const newStatus = isCurrentlyFull ? 'available' : 'full';

    try {
      const res = await fetch('/api/vet-boarding/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_id: clinic.id,
          email: clinic.email,
          date: dateStr,
          status: newStatus,
        }),
      });

      if (res.ok) {
        if (newStatus === 'full') {
          setFullDates(prev => [...prev, dateStr]);
        } else {
          setFullDates(prev => prev.filter(d => d !== dateStr));
        }
      }
    } catch {
      console.error('Failed to toggle date availability');
    } finally {
      setTogglingDate(null);
    }
  };

  const loadInquiries = async (clinicId: string) => {
    setInquiriesLoading(true);
    try {
      const res = await fetch(`/api/vet-boarding/inquiries?clinic_id=${clinicId}`);
      if (res.ok) {
        const data = await res.json();
        const loadedInqs = data.inquiries || [];
        setInquiries(loadedInqs);

        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const targetInquiryId = params.get('inquiry');
          if (targetInquiryId) {
            const match = loadedInqs.find((i: any) => i.id === targetInquiryId);
            if (match) {
              setActiveInquiry(match);
              setChatOpen(true);
            }
          }
        }
      }
    } catch {
      console.error('Failed to load inquiries');
    } finally {
      setInquiriesLoading(false);
    }
  };

  // ─── Save profile changes ──────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/vet-boarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: clinic.id, ...editForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setClinic(data.clinic);
      setEditForm({ ...data.clinic });
      setIsEditing(false);
    } catch (err: any) {
      setSaveError(err.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const toggleService = (svc: string) => {
    setEditForm((prev: any) => ({
      ...prev,
      services: prev.services?.includes(svc)
        ? prev.services.filter((s: string) => s !== svc)
        : [...(prev.services || []), svc],
    }));
  };

  const handleTogglePause = async () => {
    const isExpired = clinic.subscription_status === 'canceled' || (clinic.trial_end && new Date(clinic.trial_end) < new Date());
    if (clinic.status === 'paused' && isExpired) {
      alert('Your 1-month free trial has ended. Please subscribe to reactivate your public search listing visibility.');
      return;
    }
    const newStatus = clinic.status === 'approved' ? 'paused' : 'approved';
    try {
      const res = await fetch('/api/vet-boarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: clinic.id, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) setClinic(data.clinic);
    } catch (e) { console.error(e); }
  };

  const handleDeleteClinicAccount = async () => {
    if (!clinic || !clinic.email) return;
    const confirmName = prompt(`PERMANENT ACCOUNT DELETION WARNING:\n\nTo delete your veterinary clinic account and all availability schedules, please type your clinic name "${clinic.clinic_name}" below to confirm:`);
    if (confirmName !== clinic.clinic_name) {
      if (confirmName !== null) alert('Clinic name mismatch. Deletion cancelled.');
      return;
    }
    try {
      const res = await fetch(`/api/vet-boarding?id=${clinic.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        localStorage.removeItem('lumo_pro_email');
        localStorage.removeItem('lumo_sitter_email');
        localStorage.removeItem('lumo_shelter_email');
        localStorage.removeItem('lumo_sitter_id');
        window.dispatchEvent(new Event('lumo-pro-update'));
        alert('Your clinic account and all associated data have been deleted.');
        router.push('/vet-boarding');
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to delete clinic account.');
      }
    } catch {
      alert('Error deleting clinic account.');
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
      router.push('/vet-boarding');
    }
  };

  // ─── Loading / not found ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EEF4FF 0%, #F0FDF4 100%)' }}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }
  if (!clinic) return null;

  const statusCfg = STATUS_CONFIG[clinic.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="min-h-screen pb-28" style={{ background: 'linear-gradient(135deg, #EEF4FF 0%, #F0FDF4 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-blue-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-black text-[#4A3E3D] text-sm leading-tight">{clinic.clinic_name}</p>
              <p className="text-xs text-[#8B7E7D]">Clinic Dashboard</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="p-2 rounded-xl hover:bg-red-50 transition-colors">
            <LogOut className="w-4 h-4 text-[#8B7E7D]" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-5">
        {/* Status card */}
        <div className={`rounded-3xl p-5 border ${statusCfg.bg} ${statusCfg.border} flex items-start gap-4`}>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${statusCfg.bg} border ${statusCfg.border}`}>
            <StatusIcon className={`w-5 h-5 ${statusCfg.color}`} />
          </div>
          <div className="flex-1">
            <p className={`font-black text-sm ${statusCfg.color}`}>{statusCfg.label}</p>
            {clinic.status === 'pending' && (
              <p className="text-xs text-[#8B7E7D] mt-1">Your application is under review. We&apos;ll email you at <span className="font-medium">{clinic.email}</span> within 2–3 business days.</p>
            )}
            {clinic.status === 'approved' && (
              <p className="text-xs text-green-700 mt-1">Your clinic is publicly listed on the Find a Sitter page. Pet owners can send inquiries directly.</p>
            )}
            {clinic.status === 'rejected' && (
              <div>
                <p className="text-xs text-red-600 mt-1">{clinic.rejection_reason || 'Your application was not approved.'}</p>
                <Link href="/vet-boarding" className="mt-2 inline-block text-xs font-bold text-red-700 underline">Re-apply →</Link>
              </div>
            )}
            {clinic.status === 'paused' && (
              <p className="text-xs text-gray-500 mt-1">Your listing is hidden from search results. Resume anytime below.</p>
            )}
          </div>
          {clinic.status === 'approved' && (
            <button
              onClick={handleTogglePause}
              className="shrink-0 text-xs font-bold text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-1.5 transition-colors"
            >
              Pause Listing
            </button>
          )}
          {clinic.status === 'paused' && (
            <button
              onClick={handleTogglePause}
              className="shrink-0 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white border border-blue-200 rounded-xl px-3 py-1.5 transition-colors"
            >
              Resume
            </button>
          )}
        </div>

        {/* Partner Billing Banner */}
        <PartnerBillingBanner
          partnerId={clinic.id}
          partnerType="vet_boarding"
          email={clinic.email}
          status={clinic.status}
          subscriptionStatus={clinic.subscription_status || 'trialing'}
          trialEnd={clinic.trial_end}
          currentPeriodEnd={clinic.current_period_end}
          cancelAtPeriodEnd={clinic.cancel_at_period_end}
          monthlyPriceUsd={monthlyPrice}
          isPaused={clinic.status === 'paused'}
          onRefresh={() => loadClinic(clinic.email)}
        />

        {/* Tabs */}
        <div className="bg-white rounded-3xl p-1.5 border border-blue-100 flex gap-1 shadow-sm">
          {[
            { id: 'overview', label: 'Overview', emoji: '📊' },
            { id: 'inquiries', label: `Inquiries${inquiries.length ? ` (${inquiries.length})` : ''}`, emoji: '💬' },
            { id: 'availability', label: 'Availability', emoji: '📅' },
            { id: 'profile', label: 'Profile', emoji: '🏥' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'text-[#8B7E7D] hover:text-[#4A3E3D]'
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ───────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Inquiries', value: inquiries.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Pending', value: inquiries.filter(i => i.status === 'pending').length, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Services', value: clinic.services?.length || 0, color: 'text-green-600', bg: 'bg-green-50' },
              ].map(stat => (
                <div key={stat.label} className={`rounded-2xl p-4 ${stat.bg} border border-white text-center`}>
                  <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-[#8B7E7D] font-semibold mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Clinic info card */}
            <div className="bg-white rounded-3xl p-5 border border-blue-100 shadow-sm">
              <div className="flex items-start gap-4">
                {clinic.org_photo_url ? (
                  <img src={clinic.org_photo_url} alt={clinic.clinic_name} className="w-16 h-16 rounded-2xl object-cover border border-blue-100" />
                ) : (
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-blue-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-black text-[#4A3E3D]">{clinic.clinic_name}</h2>
                    {clinic.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                  <div className="mt-1 space-y-1">
                    {(clinic.address || clinic.city) && (
                      <p className="text-xs text-[#8B7E7D] flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {clinic.address || clinic.city}
                      </p>
                    )}
                    {clinic.phone && (
                      <p className="text-xs text-[#8B7E7D] flex items-center gap-1">
                        <Phone className="w-3 h-3" />{clinic.phone}
                      </p>
                    )}
                    {clinic.website && (
                      <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                        <Globe className="w-3 h-3" />{clinic.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                </div>
              </div>
              {clinic.description && (
                <p className="mt-3 text-sm text-[#4A3E3D] leading-relaxed border-t border-gray-100 pt-3">{clinic.description}</p>
              )}
              {clinic.services?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {clinic.services.map((svc: string) => (
                    <span key={svc} className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">{svc}</span>
                  ))}
                </div>
              )}
              <button
                onClick={() => { setActiveTab('profile'); setIsEditing(true); }}
                className="mt-4 w-full flex items-center justify-center gap-2 border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-2xl py-2 text-sm font-bold transition-colors"
              >
                <Edit3 className="w-4 h-4" /> Edit Profile
              </button>
            </div>

            {/* Recent inquiries */}
            {clinic.status === 'approved' && inquiries.length > 0 && (
              <div className="bg-white rounded-3xl p-5 border border-blue-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-[#4A3E3D] text-sm">Recent Inquiries</h3>
                  <button onClick={() => setActiveTab('inquiries')} className="text-xs text-blue-600 font-bold hover:underline">View all</button>
                </div>
                <div className="space-y-3">
                  {inquiries.slice(0, 3).map(inq => (
                    <div key={inq.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#4A3E3D] truncate">{inq.owner_email}</p>
                        <p className="text-xs text-[#8B7E7D]">{new Date(inq.created_at).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={() => { setActiveInquiry(inq); setChatOpen(true); }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 shrink-0"
                      >
                        Reply →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No inquiries empty state */}
            {clinic.status === 'approved' && inquiries.length === 0 && !inquiriesLoading && (
              <div className="bg-white rounded-3xl p-8 border border-blue-100 shadow-sm text-center">
                <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-7 h-7 text-blue-300" />
                </div>
                <p className="font-bold text-[#4A3E3D] text-sm">No inquiries yet</p>
                <p className="text-xs text-[#8B7E7D] mt-1">Pet owners who find your clinic in search will be able to message you here.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Inquiries Tab ──────────────────────────────────────────── */}
        {activeTab === 'inquiries' && (
          <div className="space-y-3">
            {(() => {
              let filteredInquiries = [...inquiries];
              if (inquiryFilter === 'archived') {
                filteredInquiries = filteredInquiries.filter(i => i.archived === true);
              } else {
                filteredInquiries = filteredInquiries.filter(i => !i.archived);
                if (inquiryFilter === 'unread') {
                  filteredInquiries = filteredInquiries.filter(i => (i.unread_count || 0) > 0);
                } else if (inquiryFilter === 'replied') {
                  filteredInquiries = filteredInquiries.filter(i => i.clinic_replied);
                }
              }

              return (
                <>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                      <button
                        onClick={() => setInquiryFilter('all')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${inquiryFilter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setInquiryFilter('unread')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${inquiryFilter === 'unread' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Unread
                      </button>
                      <button
                        onClick={() => setInquiryFilter('replied')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${inquiryFilter === 'replied' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Replied
                      </button>
                      <button
                        onClick={() => setInquiryFilter('archived')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${inquiryFilter === 'archived' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Archived
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-xl">
                        {filteredInquiries.length} {filteredInquiries.length === 1 ? 'conversation' : 'conversations'}
                      </span>
                      <button
                        onClick={() => clinic?.id && loadInquiries(clinic.id)}
                        className="p-2 rounded-xl hover:bg-white transition-colors"
                        disabled={inquiriesLoading}
                      >
                        <RefreshCw className={`w-4 h-4 text-[#8B7E7D] ${inquiriesLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {inquiriesLoading && (
                    <div className="bg-white rounded-3xl p-8 text-center border border-blue-100">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                    </div>
                  )}

                  {!inquiriesLoading && filteredInquiries.length === 0 && (
                    <div className="bg-white rounded-3xl p-10 border border-blue-100 shadow-sm text-center">
                      <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <MessageSquare className="w-7 h-7 text-blue-300" />
                      </div>
                      <p className="font-bold text-[#4A3E3D]">No inquiries found</p>
                      <p className="text-xs text-[#8B7E7D] mt-1">Try changing your filters or check back later.</p>
                    </div>
                  )}

                  {!inquiriesLoading && filteredInquiries.map(inq => (
                    <div key={inq.id} className="bg-white rounded-3xl p-5 border border-blue-100 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-white font-black text-sm">{inq.owner_email?.[0]?.toUpperCase() || '?'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {inq.unread_count > 0 ? (
                              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" title="Unread" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-gray-300" title="Read" />
                            )}
                            <p className="font-bold text-[#4A3E3D] text-sm truncate">{inq.owner_email}</p>
                            {inq.unread_count > 0 && (
                              <span className="bg-red-50 text-red-600 border border-red-200 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {inq.unread_count > 1 ? `${inq.unread_count} New` : 'New'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#8B7E7D] mt-0.5">Inquired {new Date(inq.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          {inq.latest_message && (
                            <p className="text-xs text-gray-600 italic line-clamp-1 mt-1">"{inq.latest_message}"</p>
                          )}
                          <div className="mt-1 flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              inq.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              inq.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {inq.status === 'pending' ? '⏳ Awaiting Reply' : inq.status === 'confirmed' ? '✅ Confirmed' : inq.status}
                            </span>
                            {inq.clinic_replied && (
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                ✓ Replied
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <button
                            onClick={() => { setActiveInquiry(inq); setChatOpen(true); }}
                            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-2xl transition-colors shadow-md shadow-blue-200 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Chat
                          </button>
                          <button
                            onClick={() => handleToggleArchiveInquiry(inq.id, !!inq.archived)}
                            title={inq.archived ? 'Restore Inquiry' : 'Archive Inquiry'}
                            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                              inq.archived
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                                : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              );
            })()}
          </div>
        )}

        {/* ── Availability Tab ────────────────────────────────────────── */}
        {activeTab === 'availability' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-base font-bold text-[#4A3E3D] flex items-center gap-2">
                    📅 Boarding Availability Calendar
                  </h3>
                  <p className="text-xs text-[#8B7E7D] mt-0.5">
                    Click any date to toggle between <strong>Available</strong> and <strong>Full</strong>. Unset dates default to Available.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => setCalMonthOffset(prev => prev - 1)}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold hover:bg-gray-50 text-[#4A3E3D]"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs font-bold text-[#4A3E3D] min-w-[120px] text-center">
                    {(() => {
                      const d = new Date();
                      d.setDate(1);
                      d.setMonth(d.getMonth() + calMonthOffset);
                      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    })()}
                  </span>
                  <button
                    onClick={() => setCalMonthOffset(prev => prev + 1)}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold hover:bg-gray-50 text-[#4A3E3D]"
                  >
                    Next →
                  </button>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-5 mb-4 text-xs font-medium border-t border-b border-gray-100 py-3">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block"></span>
                  <span className="text-[#4A3E3D]">Available (Default)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-500 inline-block"></span>
                  <span className="text-[#4A3E3D]">Full / Blocked</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-gray-300 inline-block"></span>
                  <span className="text-gray-400">Past Date (Non-editable)</span>
                </div>
              </div>

              {/* Calendar Grid */}
              {(() => {
                const targetDate = new Date();
                targetDate.setDate(1);
                targetDate.setMonth(targetDate.getMonth() + calMonthOffset);

                const year = targetDate.getFullYear();
                const month = targetDate.getMonth();

                const firstDayIndex = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();

                const todayStr = new Date().toISOString().split('T')[0];
                const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

                return (
                  <div>
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                      {dayHeaders.map(dh => (
                        <div key={dh} className="text-[11px] font-bold text-gray-400 uppercase tracking-wider py-1">
                          {dh}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1.5">
                      {Array.from({ length: firstDayIndex }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-16 rounded-xl bg-gray-50/50" />
                      ))}

                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const dateObj = new Date(year, month, dayNum);
                        const yyyy = dateObj.getFullYear();
                        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const dd = String(dateObj.getDate()).padStart(2, '0');
                        const dateStr = `${yyyy}-${mm}-${dd}`;

                        const isFull = fullDates.includes(dateStr);
                        const isToday = dateStr === todayStr;
                        const isPast = dateStr < todayStr;
                        const isToggling = togglingDate === dateStr;

                        return (
                          <button
                            key={dateStr}
                            disabled={isPast || isToggling}
                            onClick={() => !isPast && toggleDateAvailability(dateStr)}
                            className={`h-16 rounded-2xl p-2 flex flex-col justify-between items-start transition-all border text-left relative ${
                              isPast
                                ? 'bg-gray-50/70 border-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                                : isFull
                                ? 'bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-800 cursor-pointer'
                                : 'bg-emerald-50/60 border-emerald-100 hover:bg-emerald-100/80 text-emerald-900 cursor-pointer'
                            } ${isToday ? 'ring-2 ring-blue-500 shadow-sm' : ''}`}
                          >
                            <div className="w-full flex items-center justify-between">
                              <span className={`text-xs font-black ${isPast ? 'text-gray-400 font-normal' : isToday ? 'text-blue-600' : 'text-[#4A3E3D]'}`}>
                                {dayNum}
                              </span>
                              {isToday && (
                                <span className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded font-black">Today</span>
                              )}
                            </div>
                            <div className="w-full mt-1">
                              {isPast ? (
                                <span className="text-[9px] font-medium text-gray-400 block text-center uppercase tracking-wider">
                                  Passed
                                </span>
                              ) : isToggling ? (
                                <span className="text-[9px] text-gray-400 animate-pulse font-medium">Updating...</span>
                              ) : isFull ? (
                                <span className="text-[9px] font-black bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded border border-rose-300 block text-center uppercase tracking-wider">
                                  FULL
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-emerald-700 block text-center bg-emerald-100/70 py-0.5 rounded">
                                  Available
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── Profile Tab ────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-[#4A3E3D]">Clinic Profile</p>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 px-3 py-2 rounded-xl transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setIsEditing(false); setEditForm({ ...clinic }); setSaveError(''); }}
                    className="text-xs font-bold text-[#8B7E7D] border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-3 py-2 rounded-xl transition-colors"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save
                  </button>
                </div>
              )}
            </div>

            {saveError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-600 font-medium">
                {saveError}
              </div>
            )}

            {/* Basic info */}
            <div className="bg-white rounded-3xl p-5 border border-blue-100 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-[#8B7E7D] uppercase tracking-wider">Basic Info</h3>

              <ProfileField
                label="Clinic Name"
                value={editForm.clinic_name || ''}
                editing={isEditing && clinic.status !== 'approved' && clinic.status !== 'paused'}
                onChange={v => setEditForm((p: any) => ({ ...p, clinic_name: v }))}
                readOnlyNote={(clinic.status === 'approved' || clinic.status === 'paused') ? "Contact support to update your business name or license number" : undefined}
              />
              <ProfileField
                label="License Number"
                value={editForm.license_number || ''}
                editing={isEditing && clinic.status !== 'approved' && clinic.status !== 'paused'}
                onChange={v => setEditForm((p: any) => ({ ...p, license_number: v }))}
                readOnlyNote={(clinic.status === 'approved' || clinic.status === 'paused') ? "Contact support to update your business name or license number" : undefined}
              />
              <ProfileField
                label="Phone"
                value={editForm.phone || ''}
                editing={isEditing}
                onChange={v => setEditForm((p: any) => ({ ...p, phone: v }))}
              />
              <ProfileField
                label="Website"
                value={editForm.website || ''}
                editing={isEditing}
                onChange={v => setEditForm((p: any) => ({ ...p, website: v }))}
                href={isEditing ? undefined : editForm.website}
              />
              <ProfileField
                label="Photo URL"
                value={editForm.org_photo_url || ''}
                editing={isEditing}
                onChange={v => setEditForm((p: any) => ({ ...p, org_photo_url: v }))}
                placeholder="https://... or leave blank to auto-fetch from website"
              />
            </div>

            {/* Location */}
            <div className="bg-white rounded-3xl p-5 border border-blue-100 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-[#8B7E7D] uppercase tracking-wider">Location</h3>
              {isEditing ? (
                <CityAutocompleteInput
                  label="Location / Address *"
                  required
                  value={editForm.address || editForm.city || ''}
                  onChange={val => setEditForm((p: any) => ({ ...p, address: val, city: formatPublicCity(val) }))}
                  placeholder="Search location (e.g. 1239 Lexington Rd, Louisville, KY)…"
                  inputClassName="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              ) : (
                <p className="text-sm text-[#4A3E3D]">
                  {editForm.address || editForm.city || '—'}
                </p>
              )}
            </div>

            {/* Services */}
            <div className="bg-white rounded-3xl p-5 border border-blue-100 shadow-sm">
              <h3 className="text-xs font-black text-[#8B7E7D] uppercase tracking-wider mb-3">Services Offered</h3>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-2">
                  {VET_SERVICES.map(svc => {
                    const checked = editForm.services?.includes(svc);
                    return (
                      <button
                        key={svc}
                        type="button"
                        onClick={() => toggleService(svc)}
                        className={`text-left px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                          checked ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-[#4A3E3D] border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {checked ? '✓ ' : ''}{svc}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(clinic.services || []).length > 0
                    ? clinic.services.map((svc: string) => (
                        <span key={svc} className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">{svc}</span>
                      ))
                    : <span className="text-sm text-[#8B7E7D]">No services listed.</span>
                  }
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-3xl p-5 border border-blue-100 shadow-sm">
              <h3 className="text-xs font-black text-[#8B7E7D] uppercase tracking-wider mb-3">About Your Clinic</h3>
              {isEditing ? (
                <textarea
                  value={editForm.description || ''}
                  onChange={e => setEditForm((p: any) => ({ ...p, description: e.target.value }))}
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                />
              ) : (
                <p className="text-sm text-[#4A3E3D] leading-relaxed">{clinic.description || <span className="text-[#8B7E7D]">No description yet.</span>}</p>
              )}
            </div>

            {/* Danger zone */}
            <div className="bg-red-50 rounded-3xl p-5 border border-red-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-red-700 uppercase tracking-wider mb-1">Account</h3>
                <p className="text-xs text-red-500">Sign out or permanently delete your clinic account.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 bg-white border border-gray-200 rounded-xl px-3 py-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
                <button
                  onClick={handleDeleteClinicAccount}
                  className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-100/80 hover:bg-red-200 border border-red-200 rounded-xl px-3 py-2 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {chatOpen && activeInquiry && (
        <ChatModal
          bookingId={activeInquiry.id}
          bookingDetails={`Boarding Inquiry • ${clinic.clinic_name}`}
          isOpen={chatOpen}
          onClose={() => { setChatOpen(false); setActiveInquiry(null); }}
          currentUserEmail={clinic.email}
          otherUserName={activeInquiry.owner_email?.split('@')[0] || 'Pet Owner'}
          otherUserEmail={activeInquiry.owner_email || ''}
          otherUserType="user"
        />
      )}
    </div>
  );
}

// ─── Helper component ──────────────────────────────────────────────────────────
function ProfileField({
  label,
  value,
  editing,
  onChange,
  href,
  placeholder,
  readOnlyNote,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  href?: string;
  placeholder?: string;
  readOnlyNote?: string;
}) {
  return (
    <div>
      <label className="text-xs text-[#8B7E7D] font-semibold">{label}</label>
      {editing ? (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      ) : (
        href && value ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="block text-sm text-blue-600 hover:underline mt-0.5">
            {value}
          </a>
        ) : (
          <div>
            <p className="text-sm font-bold text-[#4A3E3D] mt-0.5">{value || '—'}</p>
            {readOnlyNote && (
              <p className="text-[11px] text-[#8B7E7D] mt-0.5 font-medium italic">
                {readOnlyNote}
              </p>
            )}
          </div>
        )
      )}
    </div>
  );
}
