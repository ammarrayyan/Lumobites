'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Stethoscope, Building2, MessageSquare, Clock, CheckCircle2,
  XCircle, Edit3, Save, ArrowLeft, Loader2, RefreshCw,
  Phone, Globe, MapPin, ShieldCheck, LogOut, ChevronDown, ChevronUp,
  Mail, AlertCircle, Star, Trash2, Power,
} from 'lucide-react';
import ChatModal from '@/components/ChatModal';
import CityAutocompleteInput from '@/components/CityAutocompleteInput';
import PartnerBillingBanner from '@/components/PartnerBillingBanner';
import LivePetProfileCard from '@/components/LivePetProfileCard';
import BookingProgressStepper from '@/components/BookingProgressStepper';
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

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
  const [cancelingSubscription, setCancelingSubscription] = useState(false);

  // Chat modal
  const [chatOpen, setChatOpen] = useState(false);
  const [activeInquiry, setActiveInquiry] = useState<any>(null);
  const [expandedInquiries, setExpandedInquiries] = useState<Record<string, boolean>>({});

  const toggleInquiryExpand = (id: string) => {
    setExpandedInquiries(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getSessionHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('lumo_account_session_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'x-account-session': token } : {})
    };
  };

  const handleInquiryAction = async (inqId: string, action: 'accept' | 'decline' | 'complete' | 'no_show') => {
    const actionLabels: Record<string, string> = {
      accept: 'accept this boarding inquiry',
      decline: 'decline this boarding inquiry',
      complete: 'mark this stay as completed',
      no_show: 'mark this appointment as no-show'
    };
    if (!confirm(`Are you sure you want to ${actionLabels[action]}?`)) return;

    try {
      const res = await fetch('/api/vet-boarding/inquiries', {
        method: 'PATCH',
        headers: getSessionHeaders(),
        body: JSON.stringify({ id: inqId, action })
      });
      if (res.ok) {
        const newStatus = action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : action === 'complete' ? 'completed' : 'no_show';
        setInquiries(prev => prev.map(i => i.id === inqId ? { ...i, status: newStatus } : i));
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to update inquiry status.');
      }
    } catch (err) {
      console.error('Failed to update inquiry:', err);
    }
  };

  const handleToggleArchiveInquiry = async (inqId: string, currentArchived: boolean) => {
    if (!currentArchived) {
      if (!confirm('Archive this inquiry? It will be moved to the Archived tab.')) return;
    }
    try {
      const res = await fetch('/api/vet-boarding/inquiries', {
        method: 'PATCH',
        headers: getSessionHeaders(),
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
      fetch(`/api/vet-boarding/inquiries?id=${targetInquiryId}`, {
        headers: getSessionHeaders()
      })
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

      const res = await fetch(`/api/vet-boarding?email=${encodeURIComponent(email)}&_t=${Date.now()}`, { 
        headers: getSessionHeaders(),
        cache: 'no-store' 
      });
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
      const res = await fetch(`/api/vet-boarding/availability?clinic_id=${clinicId}`, {
        headers: getSessionHeaders()
      });
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
        headers: getSessionHeaders(),
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
      const res = await fetch(`/api/vet-boarding/inquiries?clinic_id=${clinicId}`, {
        headers: getSessionHeaders()
      });
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
    const isExpired = clinic.subscription_status !== 'active' && (clinic.subscription_status === 'canceled' || (clinic.trial_end && new Date(clinic.trial_end) < new Date()));
    if (clinic.status === 'paused' && isExpired) return;
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
    setDeletingAccount(true);
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
    } finally {
      setDeletingAccount(false);
      setShowDeleteModal(false);
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

  const handleCancelSubscription = async () => {
    let endDate = 'the end of your current billing period';
    if (clinic.current_period_end) {
      try {
        const t = new Date(clinic.current_period_end).getTime();
        if (!isNaN(t) && t > 0) endDate = new Date(t).toLocaleDateString();
      } catch {}
    }
    if (!window.confirm(`Are you sure you want to cancel your subscription?\n\nYour listing will remain active until ${endDate}, then it will not renew.`)) return;
    setCancelingSubscription(true);
    try {
      const res = await fetch('/api/stripe/cancel-partner-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner_id: clinic.id, partner_type: 'vet_boarding' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel subscription.');
      await loadClinic(clinic.email);
    } catch (err: any) {
      console.error('Cancel subscription error:', err);
    } finally {
      setCancelingSubscription(false);
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

  return (
    <div className="min-h-screen pb-28 font-inter bg-[#F7F3EE]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[#DFD3C7] shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#8B5E3C] rounded-xl flex items-center justify-center shadow-xs">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-black text-[#2E2419] text-sm leading-tight">{clinic.clinic_name}</p>
              <p className="text-xs text-[#8B7E7D]">Veterinary Partner Dashboard</p>
            </div>
          </div>

          {(() => {
            const isExpired = clinic.subscription_status !== 'active' && (clinic.subscription_status === 'canceled' || (clinic.trial_end && new Date(clinic.trial_end) < new Date()));
            return (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTogglePause}
                  disabled={isExpired}
                  title={isExpired ? "Subscribe to enable listing visibility" : "Toggle listing visibility"}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    isExpired
                      ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400 select-none'
                      : clinic.status === 'paused'
                      ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 cursor-pointer'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 cursor-pointer'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  {clinic.status === 'paused' ? 'Paused' : 'Active'}
                </button>
              </div>
            );
          })()}
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Tabs */}
        <div 
          style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
          className="bg-white rounded-2xl p-1.5 border border-[#DFD3C7] flex gap-1 shadow-xs mb-6"
        >
          {[
            { id: 'overview', label: 'Overview', emoji: '📊' },
            { id: 'inquiries', label: `Inquiries${inquiries.length ? ` (${inquiries.length})` : ''}`, emoji: '💬' },
            { id: 'availability', label: 'Availability', emoji: '📅' },
            { id: 'profile', label: 'Profile', emoji: '🏥' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#8B5E3C] text-white shadow-md shadow-[#8B5E3C]/20'
                  : 'text-[#8B7E7D] hover:text-[#2E2419] hover:bg-[#FAF6F2]'
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ───────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 3 Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div 
                style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
                className="bg-white p-6 rounded-2xl border border-[#DFD3C7] shadow-xs"
              >
                <p className="text-xs font-bold text-[#8B7E7D] uppercase tracking-wider">Total Inquiries</p>
                <p className="text-3xl font-black text-[#2E2419] mt-2">{inquiries.length}</p>
              </div>

              <div 
                style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
                className="bg-white p-6 rounded-2xl border border-[#DFD3C7] shadow-xs"
              >
                <p className="text-xs font-bold text-[#8B7E7D] uppercase tracking-wider">Search Status</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`w-3 h-3 rounded-full ${clinic.status === 'paused' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <span className="text-lg font-black text-[#2E2419]">
                    {clinic.status === 'paused' ? 'Paused' : 'Active in Search'}
                  </span>
                </div>
              </div>

              <div 
                style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
                className="bg-white p-6 rounded-2xl border border-[#DFD3C7] shadow-xs"
              >
                <p className="text-xs font-bold text-[#8B7E7D] uppercase tracking-wider">Today&apos;s Availability</p>
                <div className="flex items-center gap-2 mt-2">
                  {fullDates.includes(new Date().toISOString().split('T')[0]) ? (
                    <span className="text-xs font-black bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      FULL / BLOCKED
                    </span>
                  ) : (
                    <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      AVAILABLE
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div 
              style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
              className="bg-white p-6 rounded-2xl border border-[#DFD3C7] shadow-xs"
            >
              <h3 className="text-sm font-extrabold text-[#2E2419] mb-3">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveTab('availability')}
                  className="px-4 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E2D5C8] text-[#8B5E3C] font-bold text-xs hover:bg-[#F0E6DD] transition-colors cursor-pointer"
                >
                  📅 Manage Availability Calendar
                </button>
                <button
                  onClick={() => { setActiveTab('profile'); setIsEditing(true); }}
                  className="px-4 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E2D5C8] text-[#2E2419] font-bold text-xs hover:bg-[#F0E6DD] transition-colors cursor-pointer"
                >
                  ✏️ Edit Clinic Details
                </button>
                <Link
                  href="/vet-boarding"
                  className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs hover:bg-emerald-100 transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  🔍 View Listing on Search Page
                </Link>
              </div>
            </div>

            {/* Clinic info card */}
            <div 
              style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
              className="bg-white rounded-2xl border border-[#DFD3C7] shadow-xs overflow-hidden"
            >
              <div className="bg-[#FAF5EE] px-5 py-3.5 border-b border-[#EADBCE] flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-[#2E2419] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center text-xs">
                    🏥
                  </span>
                  Clinic Overview
                </h3>
                {clinic.status === 'approved' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Partner
                  </span>
                )}
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-start gap-4">
                  {clinic.org_photo_url ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#DFD3C7] shrink-0 flex items-center justify-center bg-white shadow-2xs">
                      <img src={clinic.org_photo_url} alt={clinic.clinic_name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl flex items-center justify-center">
                      <Building2 className="w-7 h-7 text-[#8B5E3C]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="font-extrabold text-[#2E2419] text-lg">{clinic.clinic_name}</h2>
                    <div className="mt-1 space-y-1">
                      {(clinic.address || clinic.city) && (
                        <p className="text-xs text-[#8B7E7D] flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#8B5E3C]" />
                          {clinic.address || clinic.city}
                        </p>
                      )}
                      {clinic.phone && (
                        <p className="text-xs text-[#8B7E7D] flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-[#8B5E3C]" />{clinic.phone}
                        </p>
                      )}
                      {clinic.website && (
                        <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="text-xs text-[#8B5E3C] flex items-center gap-1 hover:underline font-medium">
                          <Globe className="w-3.5 h-3.5" />{clinic.website.replace(/^https?:\/\//, '')}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {clinic.description && (
                  <p className="text-xs text-[#4A3E3D] leading-relaxed border-t border-[#FAF6F2] pt-3">{clinic.description}</p>
                )}
                {clinic.services?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {clinic.services.map((svc: string) => (
                      <span key={svc} className="text-xs font-semibold bg-[#FAF6F2] text-[#8B5E3C] px-2.5 py-1 rounded-full border border-[#E2D5C8]">{svc}</span>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => { setActiveTab('profile'); setIsEditing(true); }}
                  className="w-full flex items-center justify-center gap-2 border border-[#DFD3C7] bg-[#FAF6F2] hover:bg-[#F0E6DD] text-[#8B5E3C] rounded-xl py-2.5 text-xs font-extrabold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Clinic Profile
                </button>
              </div>
            </div>

            {/* Recent inquiries */}
            {clinic.status === 'approved' && inquiries.length > 0 && (
              <div 
                style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
                className="bg-white rounded-2xl border border-[#DFD3C7] shadow-xs overflow-hidden"
              >
                <div className="bg-[#FAF5EE] px-5 py-3.5 border-b border-[#EADBCE] flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-[#2E2419] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center text-xs">
                      💬
                    </span>
                    Recent Inquiries
                  </h3>
                  <button onClick={() => setActiveTab('inquiries')} className="text-xs text-[#8B5E3C] font-extrabold hover:underline">View all</button>
                </div>
                <div className="p-5 space-y-3">
                  {inquiries.slice(0, 3).map(inq => (
                    <div key={inq.id} className="flex items-center gap-3 p-3.5 bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl">
                      <div className="w-8 h-8 bg-[#F0E6DA] text-[#8B5E3C] rounded-full flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-extrabold text-[#2E2419] truncate">{inq.owner_email}</p>
                        <p className="text-[11px] text-[#8B7E7D]">{new Date(inq.created_at).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={() => { setActiveInquiry(inq); setChatOpen(true); }}
                        className="text-xs font-extrabold text-[#8B5E3C] hover:text-[#734A2E] shrink-0"
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
              <div 
                style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
                className="bg-white rounded-2xl p-8 border border-[#DFD3C7] shadow-xs text-center"
              >
                <div className="w-14 h-14 bg-[#FAF6F2] border border-[#E2D5C8] rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-7 h-7 text-[#8B5E3C]" />
                </div>
                <p className="font-extrabold text-[#2E2419] text-sm">No inquiries yet</p>
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
                if (inquiryFilter === 'pending') {
                  filteredInquiries = filteredInquiries.filter(i => !i.status || i.status === 'pending');
                } else if (inquiryFilter === 'accepted') {
                  filteredInquiries = filteredInquiries.filter(i => i.status === 'accepted' || i.status === 'confirmed' || i.status === 'active');
                } else if (inquiryFilter === 'completed') {
                  filteredInquiries = filteredInquiries.filter(i => i.status === 'completed');
                } else if (inquiryFilter === 'unread') {
                  filteredInquiries = filteredInquiries.filter(i => (i.unread_count || 0) > 0);
                } else if (inquiryFilter === 'replied') {
                  filteredInquiries = filteredInquiries.filter(i => i.clinic_replied);
                }
              }

              return (
                <>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex bg-gray-100 p-1 rounded-xl flex-wrap gap-1">
                      <button
                        onClick={() => setInquiryFilter('all')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${inquiryFilter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setInquiryFilter('pending')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${inquiryFilter === 'pending' ? 'bg-white shadow-sm text-amber-800 font-extrabold' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => setInquiryFilter('accepted')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${inquiryFilter === 'accepted' ? 'bg-white shadow-sm text-emerald-800 font-extrabold' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Accepted
                      </button>
                      <button
                        onClick={() => setInquiryFilter('completed')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${inquiryFilter === 'completed' ? 'bg-white shadow-sm text-blue-800 font-extrabold' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Completed
                      </button>
                      <button
                        onClick={() => setInquiryFilter('unread')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${inquiryFilter === 'unread' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Unread
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
                        {filteredInquiries.length} {filteredInquiries.length === 1 ? 'inquiry' : 'inquiries'}
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

                  {!inquiriesLoading && filteredInquiries.map(inq => {
                    const isExpanded = !!expandedInquiries[inq.id];
                    return (
                      <div key={inq.id} className="bg-white rounded-3xl border border-blue-100 shadow-xs hover:border-blue-200 transition-all overflow-hidden">
                        {/* Visual Booking Progress Tracker Stepper */}
                        <div className="border-b border-blue-100 bg-blue-50/20">
                          <BookingProgressStepper
                            status={inq.status || 'pending'}
                            dates={inq.dates || inq.requested_date || (inq.created_at ? new Date(inq.created_at).toLocaleDateString() : '')}
                            createdAt={inq.created_at}
                          />
                        </div>

                        {/* ── CARD HEADER (COLLAPSED / SUMMARY ROW) ── */}
                        <div
                          onClick={() => toggleInquiryExpand(inq.id)}
                          className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-blue-50/30 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shrink-0 shadow-xs">
                              <span className="text-white font-black text-sm">{inq.owner_email?.[0]?.toUpperCase() || '?'}</span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {inq.unread_count > 0 ? (
                                  <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" title="Unread" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-gray-300" title="Read" />
                                )}
                                <p className="font-bold text-[#4A3E3D] text-sm truncate">{inq.owner_email}</p>
                                {inq.pet_name && (
                                  <span className="bg-blue-50 text-blue-700 text-xs font-extrabold px-2 py-0.5 rounded-md border border-blue-200">
                                    🐾 {inq.pet_name}
                                  </span>
                                )}
                                {inq.unread_count > 0 && (
                                  <span className="bg-red-50 text-red-600 border border-red-200 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    {inq.unread_count > 1 ? `${inq.unread_count} New` : 'New'}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                <span className="text-xs text-[#8B7E7D]">
                                  Inquired {new Date(inq.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                {inq.latest_message && (
                                  <span className="text-xs text-gray-500 italic truncate max-w-[200px] sm:max-w-xs">
                                    • "{inq.latest_message}"
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Status Badge + Actions */}
                          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5">
                              {(!inq.status || inq.status === 'pending') && (
                                <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1.5 animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" /> ⏳ Pending
                                </span>
                              )}
                              {(inq.status === 'accepted' || inq.status === 'confirmed' || inq.status === 'active') && (
                                <span className="bg-green-100 text-green-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-green-200 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" /> ✅ Accepted
                                </span>
                              )}
                              {inq.status === 'completed' && (
                                <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" /> 🎉 Completed
                                </span>
                              )}
                              {(inq.status === 'declined' || inq.status === 'denied' || inq.status === 'revoked') && (
                                <span className="bg-red-100 text-red-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-red-200 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" /> ❌ Declined
                                </span>
                              )}
                              {inq.status === 'no_show' && (
                                <span className="bg-orange-100 text-orange-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-orange-200 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" /> ⚠️ No Show
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => { setActiveInquiry(inq); setChatOpen(true); }}
                              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors shadow-xs cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Chat</span>
                            </button>

                            <button
                              onClick={() => toggleInquiryExpand(inq.id)}
                              className="p-1.5 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                              title={isExpanded ? 'Collapse details' : 'Expand details'}
                            >
                              <span className="hidden sm:inline">{isExpanded ? 'Hide' : 'Details'}</span>
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* ── EXPANDED DETAILS SECTION ── */}
                        {isExpanded && (
                          <div className="p-4 sm:p-5 pt-0 border-t border-gray-100 bg-blue-50/20 space-y-4">
                            {/* 🐾 LIVE PET PROFILE CARD */}
                            <div className="pt-3">
                              <LivePetProfileCard petId={inq.pet_id} partnerId={clinic.id} partnerType="vet" />
                            </div>

                            {/* ── APPOINTMENT LIFECYCLE ACTION BAR ── */}
                            <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[11px] font-bold text-[#8B7E7D] uppercase tracking-wider">
                                Appointment Actions
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {(!inq.status || inq.status === 'pending') && (
                                  <>
                                    <button
                                      onClick={() => handleInquiryAction(inq.id, 'accept')}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-3 rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                                    >
                                      ✓ Accept
                                    </button>
                                    <button
                                      onClick={() => handleInquiryAction(inq.id, 'decline')}
                                      className="bg-white hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200 text-xs font-bold py-1.5 px-3 rounded-xl transition-colors cursor-pointer"
                                    >
                                      ✕ Decline
                                    </button>
                                  </>
                                )}
                                {(inq.status === 'accepted' || inq.status === 'confirmed' || inq.status === 'active') && (
                                  <>
                                    <button
                                      onClick={() => handleInquiryAction(inq.id, 'complete')}
                                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                                    >
                                      🎉 Mark Completed
                                    </button>
                                    <button
                                      onClick={() => handleInquiryAction(inq.id, 'no_show')}
                                      className="bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold py-1.5 px-3 rounded-xl transition-colors cursor-pointer"
                                    >
                                      ⚠️ Report No-Show
                                    </button>
                                  </>
                                )}
                                {['completed', 'declined', 'denied', 'revoked', 'no_show'].includes(inq.status) && (
                                  <span className="text-xs font-bold text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-xl">
                                    Archived in History
                                  </span>
                                )}

                                <button
                                  onClick={() => handleToggleArchiveInquiry(inq.id, !!inq.archived)}
                                  title={inq.archived ? 'Restore Inquiry' : 'Archive Inquiry'}
                                  className={`p-1.5 rounded-xl border transition-colors cursor-pointer ml-2 ${
                                    inq.archived
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                                      : 'bg-white border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200'
                                  }`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-[#2E2419]">Clinic Profile Settings</p>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#8B5E3C] border border-[#DFD3C7] bg-[#FAF6F2] hover:bg-[#F0E6DD] px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setIsEditing(false); setEditForm({ ...clinic }); setSaveError(''); }}
                    className="text-xs font-bold text-[#8B7E7D] border border-[#DFD3C7] bg-[#FAF6F2] hover:bg-[#F0E6DD] px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#8B5E3C] hover:bg-[#734A2E] disabled:opacity-60 px-4 py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Changes
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
            <div 
              style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
              className="bg-white rounded-2xl border border-[#DFD3C7] shadow-xs overflow-hidden"
            >
              <div className="bg-[#FAF5EE] px-5 py-3.5 border-b border-[#EADBCE] flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-[#2E2419] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center text-xs">
                    🏢
                  </span>
                  Basic Identity & Credentials
                </h3>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
                <ProfileField
                  label="Photo URL"
                  value={editForm.org_photo_url || ''}
                  editing={isEditing}
                  onChange={v => setEditForm((p: any) => ({ ...p, org_photo_url: v }))}
                  placeholder="https://... or leave blank to auto-fetch from website"
                />
              </div>
            </div>

            {/* Location */}
            <div 
              style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
              className="bg-white rounded-2xl border border-[#DFD3C7] shadow-xs overflow-hidden"
            >
              <div className="bg-[#FAF5EE] px-5 py-3.5 border-b border-[#EADBCE] flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-[#2E2419] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">
                    📍
                  </span>
                  Clinic Location
                </h3>
              </div>

              <div className="p-5 sm:p-6 space-y-3">
                {isEditing ? (
                  <CityAutocompleteInput
                    label="Location / Address *"
                    required
                    value={editForm.address || editForm.city || ''}
                    onChange={val => setEditForm((p: any) => ({ ...p, address: val, city: formatPublicCity(val) }))}
                    placeholder="Search location (e.g. 1239 Lexington Rd, Louisville, KY)…"
                    inputClassName="w-full bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl px-3.5 py-2.5 text-sm text-[#2E2419] focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20"
                  />
                ) : (
                  <p className="text-sm font-bold text-[#2E2419]">
                    {editForm.address || editForm.city || '—'}
                  </p>
                )}
              </div>
            </div>

            {/* Services */}
            <div 
              style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
              className="bg-white rounded-2xl border border-[#DFD3C7] shadow-xs overflow-hidden"
            >
              <div className="bg-[#FAF5EE] px-5 py-3.5 border-b border-[#EADBCE] flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-[#2E2419] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center text-xs">
                    🩺
                  </span>
                  Services Offered
                </h3>
              </div>

              <div className="p-5 sm:p-6">
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-2">
                    {VET_SERVICES.map(svc => {
                      const checked = editForm.services?.includes(svc);
                      return (
                        <button
                          key={svc}
                          type="button"
                          onClick={() => toggleService(svc)}
                          className={`text-left px-3 py-2.5 rounded-xl border text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                            checked ? 'bg-[#8B5E3C] text-white border-[#8B5E3C]' : 'bg-[#FAF6F2] text-[#4A3E3D] border-[#E2D5C8] hover:border-[#8B5E3C]'
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
                          <span key={svc} className="text-xs font-semibold bg-[#FAF6F2] text-[#8B5E3C] px-3 py-1 rounded-full border border-[#E2D5C8]">{svc}</span>
                        ))
                      : <span className="text-sm text-[#8B7E7D]">No services listed.</span>
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div 
              style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
              className="bg-white rounded-2xl border border-[#DFD3C7] shadow-xs overflow-hidden"
            >
              <div className="bg-[#FAF5EE] px-5 py-3.5 border-b border-[#EADBCE] flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-[#2E2419] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center text-xs">
                    📝
                  </span>
                  About Your Clinic
                </h3>
              </div>

              <div className="p-5 sm:p-6">
                {isEditing ? (
                  <textarea
                    value={editForm.description || ''}
                    onChange={e => setEditForm((p: any) => ({ ...p, description: e.target.value }))}
                    rows={4}
                    className="w-full bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl px-3.5 py-2.5 text-sm text-[#2E2419] focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 resize-none"
                  />
                ) : (
                  <p className="text-xs text-[#4A3E3D] leading-relaxed">{clinic.description || <span className="text-[#8B7E7D]">No description yet.</span>}</p>
                )}
              </div>
            </div>

            {/* Account & Billing Card */}
            <div 
              style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
              className="bg-amber-50/70 rounded-2xl p-5 border border-amber-200/70"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider mb-1">Account & Billing Settings</h3>
                  <p className="text-xs text-amber-800">Manage your business subscription, billing details, and account deletion on your unified Account page.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 bg-white border border-gray-200 rounded-xl px-3 py-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </button>
                  <Link
                    href="/account"
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#8B5E3C] hover:bg-[#734A2E] rounded-xl px-4 py-2 transition-colors shadow-sm cursor-pointer"
                  >
                    Manage Account on /account →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base font-extrabold text-gray-900">Delete Clinic Account?</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Are you sure you want to permanently delete <strong>{clinic?.clinic_name}</strong>?
              </p>
              <p className="text-[11px] text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">
                This will automatically cancel any active Stripe subscriptions FIRST, then permanently remove your clinic listing and availability schedule.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleDeleteClinicAccount}
                disabled={deletingAccount}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl border-none cursor-pointer text-xs transition-colors"
              >
                {deletingAccount ? 'Deleting…' : 'Yes, Delete Account'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deletingAccount}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-xl border-none cursor-pointer text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {chatOpen && activeInquiry && (
        <ChatModal
          bookingId={activeInquiry.id}
          bookingDetails={`Boarding Inquiry • ${clinic.clinic_name}`}
          bookingStatus={activeInquiry.status || 'pending'}
          bookingDates={activeInquiry.dates || activeInquiry.requested_date || (activeInquiry.created_at ? new Date(activeInquiry.created_at).toLocaleDateString() : '')}
          bookingCreatedAt={activeInquiry.created_at}
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
      <label className="text-xs text-[#4A3E3D] font-bold block mb-1">{label}</label>
      {editing ? (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl px-3.5 py-2.5 text-sm text-[#2E2419] focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20"
        />
      ) : (
        href && value ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="block text-sm text-[#8B5E3C] font-semibold hover:underline mt-0.5">
            {value}
          </a>
        ) : (
          <div>
            <p className="text-sm font-bold text-[#2E2419] mt-0.5">{value || '—'}</p>
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
