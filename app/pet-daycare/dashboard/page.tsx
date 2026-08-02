'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ChatModal from '@/components/ChatModal';
import CityAutocompleteInput from '@/components/CityAutocompleteInput';
import PartnerBillingBanner from '@/components/PartnerBillingBanner';
import { formatPublicCity } from '@/lib/formatCity';
import {
  Building2,
  Calendar,
  MessageSquare,
  User,
  Power,
  Edit3,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  LogOut,
  MapPin,
  Globe,
  Phone,
  CheckCircle2,
  Trash2,
  RefreshCw
} from 'lucide-react';

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

export default function DaycareDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [daycare, setDaycare] = useState<any>(null);
  const [monthlyPrice, setMonthlyPrice] = useState<number>(30);
  const [activeTab, setActiveTab] = useState<'overview' | 'inquiries' | 'calendar' | 'profile'>('overview');

  // Inquiries
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [activeInquiry, setActiveInquiry] = useState<any>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [inquiryFilter, setInquiryFilter] = useState<'all' | 'unread' | 'replied' | 'archived'>('all');

  const handleToggleArchiveInquiry = async (inqId: string, currentArchived: boolean) => {
    if (!currentArchived) {
      if (!confirm('Archive this inquiry? It will be moved to the Archived tab.')) return;
    }
    try {
      const res = await fetch('/api/pet-daycare/inquiries', {
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

  // Calendar Availability
  const [calMonthOffset, setCalMonthOffset] = useState(0);
  const [fullDates, setFullDates] = useState<string[]>([]);
  const [togglingDate, setTogglingDate] = useState<string | null>(null);

  // Profile Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [cancelingSubscription, setCancelingSubscription] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cachedEmail = localStorage.getItem('lumo_pro_email') || localStorage.getItem('lumo_sitter_email') || '';
      if (!cachedEmail) {
        router.push('/pet-daycare');
        return;
      }
      loadDaycare(cachedEmail);

      const params = new URLSearchParams(window.location.search);
      const targetInquiryId = params.get('inquiry');
      if (targetInquiryId) {
        fetch(`/api/pet-daycare/inquiries?id=${targetInquiryId}`)
          .then(r => r.json())
          .then(data => {
            if (data.inquiry) {
              setActiveInquiry(data.inquiry);
              setChatOpen(true);
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  const loadDaycare = async (email: string) => {
    setLoading(true);
    try {
      // Fetch live pricing setting
      fetch('/api/partner-pricing?type=pet_daycare')
        .then(r => r.json())
        .then(d => { if (d?.pricing?.monthly_price_usd) setMonthlyPrice(Number(d.pricing.monthly_price_usd)); })
        .catch(() => {});

      const res = await fetch(`/api/pet-daycare?email=${encodeURIComponent(email)}&_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.daycare && data.daycare.status === 'approved') {
          setDaycare(data.daycare);
          setEditForm({ ...data.daycare });
          fetchInquiries(data.daycare.id);
          fetchAvailability(data.daycare.id);
        } else {
          router.push('/pet-daycare');
        }
      } else {
        router.push('/pet-daycare');
      }
    } catch (err) {
      console.error('Failed to load daycare profile', err);
      router.push('/pet-daycare');
    } finally {
      setLoading(false);
    }
  };

  const fetchInquiries = async (daycareId: string) => {
    setInquiriesLoading(true);
    try {
      const res = await fetch(`/api/pet-daycare/inquiries?daycare_id=${daycareId}`);
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
    } catch (e) {
      console.error('Failed to fetch inquiries:', e);
    } finally {
      setInquiriesLoading(false);
    }
  };

  const fetchAvailability = async (daycareId: string) => {
    try {
      const res = await fetch(`/api/pet-daycare/availability?daycare_id=${daycareId}`);
      if (res.ok) {
        const data = await res.json();
        const dates = (data.availability || [])
          .filter((a: any) => a.status === 'full')
          .map((a: any) => a.date);
        setFullDates(dates);
      }
    } catch (e) {
      console.error('Failed to fetch availability:', e);
    }
  };

  const toggleDateAvailability = async (dateStr: string) => {
    if (!daycare) return;
    setTogglingDate(dateStr);
    const isCurrentlyFull = fullDates.includes(dateStr);
    const newStatus = isCurrentlyFull ? 'available' : 'full';

    try {
      const res = await fetch('/api/pet-daycare/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daycare_id: daycare.id,
          date: dateStr,
          status: newStatus
        })
      });

      if (res.ok) {
        if (newStatus === 'full') {
          setFullDates(prev => [...prev, dateStr]);
        } else {
          setFullDates(prev => prev.filter(d => d !== dateStr));
        }
      }
    } catch (e) {
      console.error('Failed to toggle availability:', e);
    } finally {
      setTogglingDate(null);
    }
  };

  const handleTogglePause = async () => {
    if (!daycare) return;
    const isExpired = daycare.subscription_status !== 'active' && (daycare.subscription_status === 'canceled' || (daycare.trial_end && new Date(daycare.trial_end) < new Date()));
    if (daycare.is_paused && isExpired) return;
    const newPausedState = !daycare.is_paused;
    try {
      const res = await fetch('/api/pet-daycare', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: daycare.id, is_paused: newPausedState })
      });
      if (res.ok) {
        const data = await res.json();
        setDaycare(data.daycare);
        setEditForm(data.daycare);
      }
    } catch (e) {
      console.error('Failed to toggle paused state:', e);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    setSaveLoading(true);
    try {
      const res = await fetch('/api/pet-daycare', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: daycare.id, ...editForm })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save profile.');
      setDaycare(data.daycare);
      setIsEditing(false);
    } catch (err: any) {
      setSaveError(err.message || 'Error saving profile.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lumo_pro_email');
      localStorage.removeItem('lumo_sitter_email');
      localStorage.removeItem('lumo_shelter_email');
      document.cookie = 'lumo_pro_email=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.dispatchEvent(new Event('lumo-pro-update'));
      router.push('/pet-daycare');
    }
  };

  const handleDeleteDaycareAccount = async () => {
    if (!daycare || !daycare.email) return;
    const confirmName = prompt(`PERMANENT ACCOUNT DELETION WARNING:\n\nTo delete your pet daycare account and all availability schedules, please type your business name "${daycare.business_name}" below to confirm:`);
    if (confirmName !== daycare.business_name) {
      if (confirmName !== null) alert('Business name mismatch. Deletion cancelled.');
      return;
    }
    try {
      const res = await fetch(`/api/pet-daycare?id=${daycare.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        localStorage.removeItem('lumo_pro_email');
        localStorage.removeItem('lumo_sitter_email');
        localStorage.removeItem('lumo_shelter_email');
        window.dispatchEvent(new Event('lumo-pro-update'));
        alert('Your daycare account and all associated data have been deleted.');
        router.push('/pet-daycare');
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to delete daycare account.');
      }
    } catch {
      alert('Error deleting daycare account.');
    }
  };

  const handleCancelSubscription = async () => {
    const endDate = daycare.current_period_end
      ? new Date(daycare.current_period_end).toLocaleDateString()
      : 'the end of your current billing period';
    if (!window.confirm(`Are you sure you want to cancel your subscription?\n\nYour listing will remain active until ${endDate}, then it will not renew.`)) return;
    setCancelingSubscription(true);
    try {
      const res = await fetch('/api/stripe/cancel-partner-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner_id: daycare.id, partner_type: 'pet_daycare' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel subscription.');
      await loadDaycare(daycare.email);
    } catch (err: any) {
      console.error('Cancel subscription error:', err);
    } finally {
      setCancelingSubscription(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFAF7] flex items-center justify-center p-6">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!daycare) return null;

  return (
    <div className="min-h-screen bg-[#FDFAF7] text-[#555555]">
      {/* HEADER */}
      <header className="bg-white border-b border-[#E8DDD4] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center border border-emerald-200 shrink-0">
              <span className="text-xl">🐕</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-[#4A3E3D]">{daycare.business_name}</h1>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Partner Portal
                </span>
              </div>
              <p className="text-xs text-[#8B7E7D]">{daycare.city}, {daycare.state}</p>
            </div>
          </div>

          {(() => {
            const isExpired = daycare.subscription_status !== 'active' && (daycare.subscription_status === 'canceled' || (daycare.trial_end && new Date(daycare.trial_end) < new Date()));
            return (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTogglePause}
                  disabled={isExpired}
                  title={isExpired ? "Subscribe to enable listing visibility" : "Toggle listing visibility"}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    isExpired
                      ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400 select-none'
                      : daycare.is_paused
                      ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 cursor-pointer'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 cursor-pointer'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  {daycare.is_paused ? 'Paused' : 'Active'}
                </button>
              </div>
            );
          })()}
        </div>
      </header>

      {/* DASHBOARD CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Partner Billing Banner */}
        <PartnerBillingBanner
          partnerId={daycare.id}
          partnerType="pet_daycare"
          email={daycare.email}
          status={daycare.status}
          subscriptionStatus={daycare.subscription_status || 'trialing'}
          trialEnd={daycare.trial_end}
          currentPeriodEnd={daycare.current_period_end}
          cancelAtPeriodEnd={daycare.cancel_at_period_end}
          monthlyPriceUsd={monthlyPrice}
          isPaused={daycare.is_paused}
          onRefresh={() => loadDaycare(daycare.email)}
        />

        {/* TAB NAVIGATION */}
        <div className="flex gap-2 border-b border-[#E8DDD4] mb-8 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border-none cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-[#8B7E7D] hover:bg-white hover:text-[#4A3E3D]'
            }`}
          >
            <Building2 className="w-4 h-4" /> Overview
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border-none cursor-pointer ${
              activeTab === 'inquiries'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-[#8B7E7D] hover:bg-white hover:text-[#4A3E3D]'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Inquiries ({inquiries.length})
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border-none cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-[#8B7E7D] hover:bg-white hover:text-[#4A3E3D]'
            }`}
          >
            <Calendar className="w-4 h-4" /> Availability Calendar
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border-none cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-[#8B7E7D] hover:bg-white hover:text-[#4A3E3D]'
            }`}
          >
            <User className="w-4 h-4" /> Profile
          </button>
        </div>

        {/* ── Overview Tab ─────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white p-6 rounded-3xl border border-[#E8DDD4] shadow-sm">
                <p className="text-xs font-bold text-[#8B7E7D] uppercase tracking-wider">Total Inquiries</p>
                <p className="text-3xl font-black text-[#4A3E3D] mt-2">{inquiries.length}</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-[#E8DDD4] shadow-sm">
                <p className="text-xs font-bold text-[#8B7E7D] uppercase tracking-wider">Search Status</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`w-3 h-3 rounded-full ${daycare.is_paused ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <span className="text-lg font-black text-[#4A3E3D]">
                    {daycare.is_paused ? 'Paused' : 'Active in Search'}
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-[#E8DDD4] shadow-sm">
                <p className="text-xs font-bold text-[#8B7E7D] uppercase tracking-wider">Today&apos;s Availability</p>
                <div className="flex items-center gap-2 mt-2">
                  {fullDates.includes(new Date().toISOString().split('T')[0]) ? (
                    <span className="text-sm font-black bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      FULL / BLOCKED
                    </span>
                  ) : (
                    <span className="text-sm font-black bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      AVAILABLE
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-3xl border border-[#E8DDD4] shadow-sm">
              <h3 className="text-sm font-black text-[#4A3E3D] mb-3">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveTab('calendar')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  📅 Manage Availability Calendar
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  ✏️ Edit Daycare Details
                </button>
                <Link
                  href="/petsitting"
                  className="px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-bold text-xs hover:bg-blue-100 transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  🔍 View Listing on Search Page
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Inquiries Tab ─────────────────────────────────────────────── */}
        {activeTab === 'inquiries' && (
          <div className="bg-white rounded-3xl border border-[#E8DDD4] p-6 shadow-sm">
            {(() => {
              let filteredInquiries = [...inquiries];
              if (inquiryFilter === 'archived') {
                filteredInquiries = filteredInquiries.filter((i: any) => i.archived === true);
              } else {
                filteredInquiries = filteredInquiries.filter((i: any) => !i.archived);
                if (inquiryFilter === 'unread') {
                  filteredInquiries = filteredInquiries.filter((i: any) => (i.unread_count || 0) > 0);
                } else if (inquiryFilter === 'replied') {
                  filteredInquiries = filteredInquiries.filter((i: any) => i.daycare_replied);
                }
              }

              return (
                <>
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                    <h2 className="text-base font-black text-[#4A3E3D]">Owner Inquiries</h2>

                    <div className="flex items-center gap-3">
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
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl">
                          {filteredInquiries.length} {filteredInquiries.length === 1 ? 'conversation' : 'conversations'}
                        </span>
                        <button
                          onClick={() => daycare?.id && fetchInquiries(daycare.id)}
                          className="p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer border-none"
                          title="Refresh inquiries"
                          disabled={inquiriesLoading}
                        >
                          <RefreshCw className={`w-4 h-4 text-gray-500 ${inquiriesLoading ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {inquiriesLoading ? (
                    <div className="text-center py-8 text-xs text-gray-500">Loading inquiries...</div>
                  ) : filteredInquiries.length === 0 ? (
                    <div className="text-center py-12 text-[#8B7E7D]">
                      <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-bold">No daycare inquiries found</p>
                      <p className="text-xs">Try changing your filters or check back later.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredInquiries.map((inq: any) => (
                        <div
                          key={inq.id}
                          className="p-4 rounded-2xl bg-[#FDFAF7] border border-[#E8DDD4] flex items-center justify-between hover:border-emerald-400 transition-all"
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              {inq.unread_count > 0 ? (
                                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" title="Unread" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-gray-300" title="Read" />
                              )}
                              <p className="text-sm font-bold text-[#4A3E3D] truncate">{inq.owner_email}</p>
                              {inq.unread_count > 0 && (
                                <span className="bg-red-50 text-red-600 border border-red-200 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  {inq.unread_count > 1 ? `${inq.unread_count} New` : 'New'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#8B7E7D] mt-0.5">
                              Inquiry Date: {new Date(inq.created_at).toLocaleDateString()}
                            </p>
                            {inq.latest_message && (
                              <p className="text-xs text-gray-600 italic line-clamp-1 mt-1">"{inq.latest_message}"</p>
                            )}
                            {inq.daycare_replied && (
                              <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                ✓ Replied
                              </span>
                            )}
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            <button
                              onClick={() => { setActiveInquiry(inq); setChatOpen(true); }}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors border-none cursor-pointer"
                            >
                              Open Chat Thread
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
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* ── Availability Calendar Tab ──────────────────────────────────── */}
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-3xl border border-[#E8DDD4] p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-black text-[#4A3E3D]">Availability Calendar</h2>
                <p className="text-xs text-[#8B7E7D]">
                  Click on today or future dates to toggle between <strong>Available</strong> and <strong>FULL</strong>. Past dates are automatically disabled.
                </p>
              </div>

              {/* Month Selector Controls */}
              <div className="flex items-center gap-2 bg-[#FDFAF7] border border-[#E8DDD4] rounded-2xl p-1 shrink-0">
                <button
                  onClick={() => setCalMonthOffset(prev => prev - 1)}
                  className="p-1.5 rounded-xl hover:bg-white text-[#4A3E3D] transition-colors border-none cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-[#4A3E3D] px-3">
                  {(() => {
                    const d = new Date();
                    d.setDate(1);
                    d.setMonth(d.getMonth() + calMonthOffset);
                    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
                  })()}
                </span>
                <button
                  onClick={() => setCalMonthOffset(prev => prev + 1)}
                  className="p-1.5 rounded-xl hover:bg-white text-[#4A3E3D] transition-colors border-none cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
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
                          } ${isToday ? 'ring-2 ring-emerald-500 shadow-sm' : ''}`}
                        >
                          <div className="w-full flex items-center justify-between">
                            <span className={`text-xs font-black ${isPast ? 'text-gray-400 font-normal' : isToday ? 'text-emerald-700' : 'text-[#4A3E3D]'}`}>
                              {dayNum}
                            </span>
                            {isToday && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-black">Today</span>
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
        )}

        {/* ── Profile Tab ───────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-[#4A3E3D]">Daycare Profile</p>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 border border-emerald-200 bg-white hover:bg-emerald-50 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setIsEditing(false); setEditForm({ ...daycare }); setSaveError(''); }}
                    className="text-xs font-bold text-[#8B7E7D] border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saveLoading}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl transition-colors border-none cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> {saveLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            {saveError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" /> {saveError}
              </div>
            )}

            {!isEditing ? (
              <div className="bg-white rounded-3xl border border-[#E8DDD4] p-6 shadow-sm space-y-4">
                <div className="flex items-start gap-4">
                  {daycare.logo_url ? (
                    <img src={daycare.logo_url} alt={daycare.business_name} className="w-20 h-20 rounded-2xl object-cover border border-[#E8DDD4]" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                      <span className="text-3xl">🐕</span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-black text-[#4A3E3D]">{daycare.business_name}</h3>
                    {daycare.license_number && <p className="text-xs text-[#8B7E7D]">License: {daycare.license_number}</p>}
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {daycare.address || daycare.city || '—'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <p className="text-xs font-bold text-[#4A3E3D]">Facility Overview</p>
                  <p className="text-xs text-[#8B7E7D] leading-relaxed">{daycare.description || 'No description provided.'}</p>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <p className="text-xs font-bold text-[#4A3E3D]">Services Offered</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(daycare.services || []).map((s: string) => (
                      <span key={s} className="text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-[#E8DDD4] p-6 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Business Name</label>
                    {(daycare.status === 'approved' || daycare.status === 'paused') ? (
                      <div>
                        <p className="text-sm font-bold text-[#4A3E3D] py-1">{editForm.business_name || daycare.business_name || '—'}</p>
                        <p className="text-[11px] text-[#8B7E7D] mt-0.5 font-medium italic">Contact support to update your business name or license number</p>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={editForm.business_name || ''}
                        onChange={e => setEditForm({ ...editForm, business_name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#FDFAF7] border border-[#E8DDD4] text-xs focus:outline-none focus:border-emerald-500"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4A3E3D] mb-1">License Number</label>
                    {(daycare.status === 'approved' || daycare.status === 'paused') ? (
                      <div>
                        <p className="text-sm font-bold text-[#4A3E3D] py-1">{editForm.license_number || daycare.license_number || '—'}</p>
                        <p className="text-[11px] text-[#8B7E7D] mt-0.5 font-medium italic">Contact support to update your business name or license number</p>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={editForm.license_number || ''}
                        onChange={e => setEditForm({ ...editForm, license_number: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#FDFAF7] border border-[#E8DDD4] text-xs focus:outline-none focus:border-emerald-500"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Logo / Photo URL</label>
                    <input
                      type="url"
                      value={editForm.logo_url || ''}
                      onChange={e => setEditForm({ ...editForm, logo_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-xl bg-[#FDFAF7] border border-[#E8DDD4] text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Phone</label>
                    <input
                      type="tel"
                      value={editForm.phone || ''}
                      onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="(555) 555-5555"
                      className="w-full px-3 py-2 rounded-xl bg-[#FDFAF7] border border-[#E8DDD4] text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Website</label>
                    <input
                      type="url"
                      value={editForm.website || ''}
                      onChange={e => setEditForm({ ...editForm, website: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-xl bg-[#FDFAF7] border border-[#E8DDD4] text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <CityAutocompleteInput
                      label="Location / Address *"
                      required
                      value={editForm.address || editForm.city || ''}
                      onChange={val => setEditForm({ ...editForm, address: val, city: formatPublicCity(val) })}
                      placeholder="Search location (e.g. 1239 Lexington Rd, Louisville, KY)…"
                      inputClassName="w-full px-3 py-2 rounded-xl bg-[#FDFAF7] border border-[#E8DDD4] text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Facility Description</label>
                  <textarea
                    rows={3}
                    value={editForm.description || ''}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FDFAF7] border border-[#E8DDD4] text-xs focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-2">Services Offered</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DAYCARE_SERVICES.map(svc => {
                      const checked = (editForm.services || []).includes(svc);
                      return (
                        <button
                          key={svc}
                          type="button"
                          onClick={() => {
                            const cur = editForm.services || [];
                            const next = checked ? cur.filter((s: string) => s !== svc) : [...cur, svc];
                            setEditForm({ ...editForm, services: next });
                          }}
                          className={`p-2.5 rounded-xl text-xs font-bold text-left border flex items-center justify-between cursor-pointer ${
                            checked
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                              : 'bg-[#FDFAF7] border-[#E8DDD4] text-[#4A3E3D]'
                          }`}
                        >
                          <span>{svc}</span>
                          {checked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Danger zone */}
                <div className="bg-red-50 rounded-3xl p-5 border border-red-100 mt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black text-red-700 uppercase tracking-wider mb-1">Account Danger Zone</h3>
                      <p className="text-xs text-red-500">Sign out or permanently delete your daycare account and all listings.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 bg-white border border-gray-200 rounded-xl px-3 py-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign out
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteDaycareAccount}
                        className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-100/80 hover:bg-red-200 border border-red-200 rounded-xl px-3 py-2 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Account
                      </button>
                    </div>
                  </div>
                  {daycare.subscription_status === 'active' && !daycare.cancel_at_period_end && (
                    <div className="mt-4 pt-4 border-t border-red-200">
                      <p className="text-xs text-red-500 mb-2">
                        Cancel your subscription — your listing stays active until{' '}
                        <span className="font-semibold">
                          {daycare.current_period_end ? new Date(daycare.current_period_end).toLocaleDateString() : 'period end'}
                        </span>
                        , then will not renew.
                      </p>
                      <button
                        type="button"
                        onClick={handleCancelSubscription}
                        disabled={cancelingSubscription}
                        className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-white border border-red-300 rounded-xl px-3 py-2 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {cancelingSubscription ? 'Canceling...' : 'Cancel Subscription'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* CHAT MODAL FOR INQUIRY THREADS */}
      {chatOpen && activeInquiry && (
        <ChatModal
          isOpen={chatOpen}
          onClose={() => { setChatOpen(false); setActiveInquiry(null); }}
          bookingId={activeInquiry.id}
          bookingDetails={`Daycare Inquiry • ${daycare?.business_name || 'Pet Daycare'}`}
          currentUserEmail={daycare?.email || ''}
          otherUserName={activeInquiry.owner_email?.split('@')[0] || 'Pet Owner'}
          otherUserEmail={activeInquiry.owner_email || ''}
          otherUserType="user"
          onReport={() => {}}
        />
      )}
    </div>
  );
}
