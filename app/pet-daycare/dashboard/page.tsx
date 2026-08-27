'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ChatModal from '@/components/ChatModal';
import CityAutocompleteInput from '@/components/CityAutocompleteInput';
import PartnerBillingBanner from '@/components/PartnerBillingBanner';
import LivePetProfileCard from '@/components/LivePetProfileCard';
import BookingProgressStepper from '@/components/BookingProgressStepper';
import PartnerHoursEditor from '@/components/PartnerHoursEditor';
import PartnerGalleryUploader from '@/components/PartnerGalleryUploader';
import { extractPartnerMeta, formatPartnerHoursSummary } from '@/lib/partnerProfileHelper';
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
  RefreshCw,
  ChevronDown,
  ChevronUp
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
  const [activeTab, setActiveTab] = useState<'overview' | 'inquiries' | 'calendar' | 'profile' | 'reviews'>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Reviews State
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Inquiries
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [activeInquiry, setActiveInquiry] = useState<any>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [inquiryFilter, setInquiryFilter] = useState<'all' | 'unread' | 'replied' | 'archived'>('all');
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
      accept: 'accept this daycare inquiry',
      decline: 'decline this daycare inquiry',
      complete: 'mark this daycare visit as completed',
      no_show: 'mark this appointment as no-show'
    };
    if (!confirm(`Are you sure you want to ${actionLabels[action]}?`)) return;

    try {
      const res = await fetch('/api/pet-daycare/inquiries', {
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
      const res = await fetch('/api/pet-daycare/inquiries', {
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
        fetch(`/api/pet-daycare/inquiries?id=${targetInquiryId}`, {
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

      const res = await fetch(`/api/pet-daycare?email=${encodeURIComponent(email)}&_t=${Date.now()}`, { 
        headers: getSessionHeaders(),
        cache: 'no-store' 
      });
      if (res.ok) {
        const data = await res.json();
        if (data.daycare && data.daycare.status === 'approved') {
          const meta = extractPartnerMeta(data.daycare);
          const enrichedDaycare = {
            ...data.daycare,
            description: meta.cleanDescription,
            hours: meta.hours || {},
            gallery_urls: meta.gallery || [],
            starting_rate: meta.pricing.startingRate,
            pricing_type: meta.pricing.pricingType || 'starting_from',
            pricing_note: meta.pricing.pricingNote || '',
            avg_rating: meta.avgRating,
            review_count: meta.reviewCount,
          };
          setDaycare(enrichedDaycare);
          setEditForm({ ...enrichedDaycare });
          fetchInquiries(data.daycare.id);
          fetchAvailability(data.daycare.id);
          loadReviews(data.daycare.id);
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

  const loadReviews = async (daycareId: string) => {
    setLoadingReviews(true);
    try {
      const res = await fetch(`/api/pet-daycare/reviews?daycare_id=${daycareId}`);
      if (res.ok) {
        const data = await res.json();
        setReviewsList(data.reviews || []);
      }
    } catch (e) {
      console.error('Failed to load daycare reviews:', e);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchInquiries = async (daycareId: string) => {
    setInquiriesLoading(true);
    try {
      const res = await fetch(`/api/pet-daycare/inquiries?daycare_id=${daycareId}`, {
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
    } catch (e) {
      console.error('Failed to fetch inquiries:', e);
    } finally {
      setInquiriesLoading(false);
    }
  };

  const fetchAvailability = async (daycareId: string) => {
    try {
      const res = await fetch(`/api/pet-daycare/availability?daycare_id=${daycareId}`, {
        headers: getSessionHeaders()
      });
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
        headers: getSessionHeaders(),
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
        headers: getSessionHeaders(),
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
        headers: getSessionHeaders(),
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
      localStorage.removeItem('lumo_account_session_token');
      document.cookie = 'lumo_pro_email=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'lumo_account_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.dispatchEvent(new Event('lumo-pro-update'));
      router.push('/pet-daycare');
    }
  };

  const handleDeleteDaycareAccount = async () => {
    if (!confirm('Are you sure you want to delete your Pet Daycare listing? This cannot be undone.')) return;
    setDeletingAccount(true);
    try {
      const res = await fetch('/api/pet-daycare', {
        method: 'DELETE',
        headers: getSessionHeaders(),
        body: JSON.stringify({ id: daycare?.id, email: daycare?.email })
      });
      if (res.ok) {
        localStorage.removeItem('lumo_pro_email');
        localStorage.removeItem('lumo_sitter_email');
        localStorage.removeItem('lumo_shelter_email');
        localStorage.removeItem('lumo_account_session_token');
        window.dispatchEvent(new Event('lumo-pro-update'));
        alert('Your daycare account and all associated data have been deleted.');
        router.push('/pet-daycare');
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to delete daycare account.');
      }
    } catch {
      alert('Error deleting daycare account.');
    } finally {
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  const handleCancelSubscription = async () => {
    let endDate = 'the end of your current billing period';
    if (daycare.current_period_end) {
      try {
        const t = new Date(daycare.current_period_end).getTime();
        if (!isNaN(t) && t > 0) endDate = new Date(t).toLocaleDateString();
      } catch {}
    }
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
      <div className="min-h-screen bg-[#F7F3EE] flex items-center justify-center p-6">
        <div className="animate-spin w-8 h-8 border-4 border-[#8B5E3C] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!daycare) return null;

  return (
    <div className="min-h-screen bg-[#F7F3EE] text-[#555555] font-inter">
      {/* HEADER */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-[#DFD3C7] sticky top-0 z-40 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {daycare.logo_url ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#DFD3C7] shrink-0 flex items-center justify-center bg-white shadow-2xs">
                <img src={daycare.logo_url} alt={daycare.business_name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#FAF6F2] flex items-center justify-center border border-[#E2D5C8] shrink-0">
                <span className="text-xl">🐕</span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-[#2E2419]">{daycare.business_name}</h1>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Partner Portal
                </span>
              </div>
              <p className="text-xs text-[#8B7E7D]">
                {daycare.city && daycare.state ? (
                  daycare.city.toLowerCase().includes(daycare.state.toLowerCase()) ? daycare.city : `${daycare.city}, ${daycare.state}`
                ) : daycare.city || daycare.state || ''}
              </p>
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                    isExpired
                      ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400 select-none'
                      : daycare.is_paused
                      ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
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
        {/* TAB NAVIGATION */}
        <div 
          style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
          className="bg-white rounded-2xl p-1.5 border border-[#DFD3C7] flex gap-1 shadow-xs mb-8 overflow-x-auto"
        >
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 border-none cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#8B5E3C] text-white shadow-md shadow-[#8B5E3C]/20'
                : 'text-[#8B7E7D] hover:bg-[#FAF6F2] hover:text-[#2E2419]'
            }`}
          >
            <Building2 className="w-4 h-4" /> Overview
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 border-none cursor-pointer ${
              activeTab === 'inquiries'
                ? 'bg-[#8B5E3C] text-white shadow-md shadow-[#8B5E3C]/20'
                : 'text-[#8B7E7D] hover:bg-[#FAF6F2] hover:text-[#2E2419]'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Inquiries ({inquiries.length})
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 border-none cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-[#8B5E3C] text-white shadow-md shadow-[#8B5E3C]/20'
                : 'text-[#8B7E7D] hover:bg-[#FAF6F2] hover:text-[#2E2419]'
            }`}
          >
            <Calendar className="w-4 h-4" /> Availability Calendar
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 border-none cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#8B5E3C] text-white shadow-md shadow-[#8B5E3C]/20'
                : 'text-[#8B7E7D] hover:bg-[#FAF6F2] hover:text-[#2E2419]'
            }`}
          >
            <User className="w-4 h-4" /> Profile
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 border-none cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-[#8B5E3C] text-white shadow-md shadow-[#8B5E3C]/20'
                : 'text-[#8B7E7D] hover:bg-[#FAF6F2] hover:text-[#2E2419]'
            }`}
          >
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Reviews ({reviewsList.length})
          </button>
        </div>

        {/* ── Overview Tab ─────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
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
                  <span className={`w-3 h-3 rounded-full ${daycare.is_paused ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <span className="text-lg font-black text-[#2E2419]">
                    {daycare.is_paused ? 'Paused' : 'Active in Search'}
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
                  onClick={() => setActiveTab('calendar')}
                  className="px-4 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E2D5C8] text-[#8B5E3C] font-bold text-xs hover:bg-[#F0E6DD] transition-colors cursor-pointer"
                >
                  📅 Manage Availability Calendar
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="px-4 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E2D5C8] text-[#2E2419] font-bold text-xs hover:bg-[#F0E6DD] transition-colors cursor-pointer"
                >
                  ✏️ Edit Daycare Details
                </button>
                <Link
                  href="/petsitting"
                  className="px-4 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E2D5C8] text-[#2E2419] font-bold text-xs hover:bg-[#F0E6DD] transition-colors"
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
          <div 
            style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
            className="bg-white rounded-2xl border border-[#DFD3C7] p-6 shadow-xs"
          >
            {(() => {
              let filteredInquiries = [...inquiries];
              if (inquiryFilter === 'archived') {
                filteredInquiries = filteredInquiries.filter((i: any) => i.archived === true);
              } else {
                filteredInquiries = filteredInquiries.filter((i: any) => !i.archived);
                if (inquiryFilter === 'pending') {
                  filteredInquiries = filteredInquiries.filter((i: any) => !i.status || i.status === 'pending');
                } else if (inquiryFilter === 'accepted') {
                  filteredInquiries = filteredInquiries.filter((i: any) => i.status === 'accepted' || i.status === 'confirmed' || i.status === 'active');
                } else if (inquiryFilter === 'completed') {
                  filteredInquiries = filteredInquiries.filter((i: any) => i.status === 'completed');
                } else if (inquiryFilter === 'unread') {
                  filteredInquiries = filteredInquiries.filter((i: any) => (i.unread_count || 0) > 0);
                } else if (inquiryFilter === 'replied') {
                  filteredInquiries = filteredInquiries.filter((i: any) => i.daycare_replied);
                }
              }

              return (
                <>
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                    <h2 className="text-base font-black text-[#2E2419]">Owner Inquiries</h2>

                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex bg-[#FAF6F2] p-1 rounded-xl border border-[#E2D5C8] flex-wrap gap-1">
                        <button
                          onClick={() => setInquiryFilter('all')}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer border-none ${inquiryFilter === 'all' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setInquiryFilter('pending')}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer border-none ${inquiryFilter === 'pending' ? 'bg-white shadow-xs text-amber-800 font-extrabold' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          Pending
                        </button>
                        <button
                          onClick={() => setInquiryFilter('accepted')}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer border-none ${inquiryFilter === 'accepted' ? 'bg-white shadow-xs text-emerald-800 font-extrabold' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          Accepted
                        </button>
                        <button
                          onClick={() => setInquiryFilter('completed')}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer border-none ${inquiryFilter === 'completed' ? 'bg-white shadow-xs text-blue-800 font-extrabold' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          Completed
                        </button>
                        <button
                          onClick={() => setInquiryFilter('unread')}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer border-none ${inquiryFilter === 'unread' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          Unread
                        </button>
                        <button
                          onClick={() => setInquiryFilter('archived')}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer border-none ${inquiryFilter === 'archived' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          Archived
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="bg-[#FAF6F2] border border-[#E2D5C8] text-[#8B5E3C] text-xs font-bold px-3 py-1.5 rounded-xl">
                          {filteredInquiries.length} {filteredInquiries.length === 1 ? 'inquiry' : 'inquiries'}
                        </span>
                        <button
                          onClick={() => daycare?.id && fetchInquiries(daycare.id)}
                          className="p-2 rounded-xl hover:bg-[#FAF6F2] transition-colors cursor-pointer border-none"
                          title="Refresh inquiries"
                          disabled={inquiriesLoading}
                        >
                          <RefreshCw className={`w-4 h-4 text-[#8B7E7D] ${inquiriesLoading ? 'animate-spin' : ''}`} />
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
                      {filteredInquiries.map((inq: any) => {
                        const isExpanded = !!expandedInquiries[inq.id];
                        return (
                          <div
                            key={inq.id}
                            className="bg-[#FAF6F2] border border-[#E2D5C8] rounded-2xl overflow-hidden hover:border-[#8B5E3C] transition-all"
                          >
                            {/* Visual Booking Progress Tracker Stepper */}
                            <div className="border-b border-[#E2D5C8] bg-white/40">
                              <BookingProgressStepper
                                status={inq.status || 'pending'}
                                dates={inq.dates || inq.requested_date || (inq.created_at ? new Date(inq.created_at).toLocaleDateString() : '')}
                                createdAt={inq.created_at}
                              />
                            </div>

                            {/* ── CARD HEADER (COLLAPSED / SUMMARY ROW) ── */}
                            <div
                              onClick={() => toggleInquiryExpand(inq.id)}
                              className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-white/60 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#8B5E3C] to-[#5C3D26] rounded-full flex items-center justify-center shrink-0 shadow-xs">
                                  <span className="text-white font-black text-sm">{inq.owner_email?.[0]?.toUpperCase() || '?'}</span>
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {inq.unread_count > 0 ? (
                                      <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" title="Unread" />
                                    ) : (
                                      <div className="w-2 h-2 rounded-full bg-gray-300" title="Read" />
                                    )}
                                    <p className="text-sm font-bold text-[#2E2419] truncate">{inq.owner_email}</p>
                                    {inq.pet_name && (
                                      <span className="bg-[#EFE5DA] text-[#8B5E3C] text-xs font-extrabold px-2 py-0.5 rounded-md border border-[#E2D5C8]">
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
                                      Inquiry Date: {new Date(inq.created_at).toLocaleDateString()}
                                    </span>
                                    {inq.latest_message && (
                                      <span className="text-xs text-gray-600 italic truncate max-w-[200px] sm:max-w-xs">
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
                                  className="px-3 py-1.5 text-xs font-bold text-white bg-[#8B5E3C] hover:bg-[#734A2E] rounded-xl transition-colors cursor-pointer border-none shadow-xs flex items-center gap-1"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Chat</span>
                                </button>

                                <button
                                  onClick={() => toggleInquiryExpand(inq.id)}
                                  className="p-1.5 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                                  title={isExpanded ? 'Collapse details' : 'Expand details'}
                                >
                                  <span className="hidden sm:inline">{isExpanded ? 'Hide' : 'Details'}</span>
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            {/* ── EXPANDED DETAILS SECTION ── */}
                            {isExpanded && (
                              <div className="p-4 pt-0 border-t border-[#E2D5C8] bg-white/50 space-y-4">
                                {/* 🐾 LIVE PET PROFILE CARD */}
                                <div className="pt-3">
                                  <LivePetProfileCard petId={inq.pet_id} partnerId={center.id} partnerType="daycare" />
                                </div>

                                {/* ── APPOINTMENT LIFECYCLE ACTION BAR ── */}
                                <div className="pt-3 border-t border-[#E2D5C8] flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-[11px] font-bold text-[#8B7E7D] uppercase tracking-wider">
                                    Appointment Actions
                                  </span>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {(!inq.status || inq.status === 'pending') && (
                                      <>
                                        <button
                                          onClick={() => handleInquiryAction(inq.id, 'accept')}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-3 rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1 border-none"
                                        >
                                          ✓ Accept
                                        </button>
                                        <button
                                          onClick={() => handleInquiryAction(inq.id, 'decline')}
                                          className="bg-white hover:bg-red-50 text-gray-600 hover:text-red-600 border border-[#E2D5C8] hover:border-red-200 text-xs font-bold py-1.5 px-3 rounded-xl transition-colors cursor-pointer"
                                        >
                                          ✕ Decline
                                        </button>
                                      </>
                                    )}
                                    {(inq.status === 'accepted' || inq.status === 'confirmed' || inq.status === 'active') && (
                                      <>
                                        <button
                                          onClick={() => handleInquiryAction(inq.id, 'complete')}
                                          className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white text-xs font-bold py-1.5 px-3 rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1 border-none"
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
                                      <span className="text-xs font-bold text-gray-500 bg-white border border-[#E2D5C8] px-2.5 py-1 rounded-xl">
                                        Archived in History
                                      </span>
                                    )}

                                    <button
                                      onClick={() => handleToggleArchiveInquiry(inq.id, inq.archived)}
                                      className="px-2.5 py-1.5 text-xs text-[#8B7E7D] hover:text-gray-900 border border-[#E2D5C8] rounded-xl hover:bg-white transition-colors cursor-pointer ml-2"
                                    >
                                      {inq.archived ? 'Unarchive' : 'Archive'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* ── Availability Calendar Tab ──────────────────────────────────── */}
        {activeTab === 'calendar' && (
          <div 
            style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
            className="bg-white rounded-2xl border border-[#DFD3C7] p-6 shadow-xs"
          >
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <h2 className="text-base font-black text-[#2E2419]">Daycare Availability Calendar</h2>
                <p className="text-xs text-[#8B7E7D] mt-0.5">Click any date to toggle between Available and Full/Blocked.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCalMonthOffset(p => p - 1)}
                  disabled={calMonthOffset <= 0}
                  className="p-2 rounded-xl border border-[#DFD3C7] bg-[#FAF6F2] hover:bg-[#F0E6DD] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-[#2E2419]" />
                </button>
                <span className="text-xs font-black text-[#2E2419] px-2 min-w-[120px] text-center">
                  {(() => {
                    const d = new Date();
                    d.setDate(1);
                    d.setMonth(d.getMonth() + calMonthOffset);
                    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
                  })()}
                </span>
                <button
                  onClick={() => setCalMonthOffset(p => p + 1)}
                  disabled={calMonthOffset >= 3}
                  className="p-2 rounded-xl border border-[#DFD3C7] bg-[#FAF6F2] hover:bg-[#F0E6DD] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 text-[#2E2419]" />
                </button>
              </div>
            </div>

            {/* Calendar Legend */}
            <div className="flex items-center gap-4 text-xs font-bold mb-4 pb-4 border-b border-[#FAF6F2]">
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
                          } ${isToday ? 'ring-2 ring-[#8B5E3C] shadow-sm' : ''}`}
                        >
                          <div className="w-full flex items-center justify-between">
                            <span className={`text-xs font-black ${isPast ? 'text-gray-400 font-normal' : isToday ? 'text-[#8B5E3C]' : 'text-[#4A3E3D]'}`}>
                              {dayNum}
                            </span>
                            {isToday && (
                              <span className="text-[9px] bg-[#F0E6DA] text-[#8B5E3C] px-1 rounded font-black">Today</span>
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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-[#2E2419]">Daycare Profile Settings</h2>
              {!isEditing ? (
                <button
                  onClick={() => { setIsEditing(true); setEditForm({ ...daycare }); }}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#8B5E3C] border border-[#DFD3C7] bg-[#FAF6F2] hover:bg-[#F0E6DD] px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setIsEditing(false); setSaveError(''); }}
                    className="text-xs font-bold text-[#8B7E7D] border border-[#DFD3C7] bg-[#FAF6F2] hover:bg-[#F0E6DD] px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saveLoading}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#8B5E3C] hover:bg-[#734A2E] px-4 py-2 rounded-xl transition-colors border-none cursor-pointer shadow-sm"
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
              <div 
                style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
                className="bg-white rounded-2xl border border-[#DFD3C7] p-6 shadow-xs space-y-4"
              >
                <div className="flex items-start gap-4">
                  {daycare.logo_url ? (
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-[#DFD3C7] shrink-0 flex items-center justify-center bg-white shadow-2xs">
                      <img src={daycare.logo_url} alt={daycare.business_name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-[#FAF6F2] border border-[#E2D5C8] flex items-center justify-center shrink-0">
                      <span className="text-3xl">🐕</span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-black text-[#2E2419]">{daycare.business_name}</h3>
                    {daycare.license_number && <p className="text-xs text-[#8B7E7D]">License: {daycare.license_number}</p>}
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#8B5E3C]" /> {daycare.address || daycare.city || '—'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#FAF6F2] pt-4 space-y-2">
                  <p className="text-xs font-bold text-[#4A3E3D]">Facility Overview</p>
                  <p className="text-xs text-[#8B7E7D] leading-relaxed">{daycare.description || 'No description provided.'}</p>
                </div>

                <div className="border-t border-[#FAF6F2] pt-4 space-y-2">
                  <p className="text-xs font-bold text-[#4A3E3D]">Services Offered</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(daycare.services || []).map((s: string) => (
                      <span key={s} className="text-[11px] font-bold bg-[#FAF6F2] text-[#8B5E3C] border border-[#E2D5C8] px-2.5 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div 
                style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
                className="bg-white rounded-2xl border border-[#DFD3C7] p-6 shadow-xs space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Business Name</label>
                    {(daycare.status === 'approved' || daycare.status === 'paused') ? (
                      <div>
                        <p className="text-sm font-bold text-[#2E2419] py-1">{editForm.business_name || daycare.business_name || '—'}</p>
                        <p className="text-[11px] text-[#8B7E7D] mt-0.5 font-medium italic">Contact support to update your business name or license number</p>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={editForm.business_name || ''}
                        onChange={e => setEditForm({ ...editForm, business_name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E2D5C8] text-sm text-[#2E2419] focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4A3E3D] mb-1">License Number</label>
                    {(daycare.status === 'approved' || daycare.status === 'paused') ? (
                      <div>
                        <p className="text-sm font-bold text-[#2E2419] py-1">{editForm.license_number || daycare.license_number || '—'}</p>
                        <p className="text-[11px] text-[#8B7E7D] mt-0.5 font-medium italic">Contact support to update your business name or license number</p>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={editForm.license_number || ''}
                        onChange={e => setEditForm({ ...editForm, license_number: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E2D5C8] text-sm text-[#2E2419] focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20"
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E2D5C8] text-sm text-[#2E2419] focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Phone</label>
                    <input
                      type="tel"
                      value={editForm.phone || ''}
                      onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="(555) 555-5555"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E2D5C8] text-sm text-[#2E2419] focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20"
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E2D5C8] text-sm text-[#2E2419] focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20"
                    />
                  </div>
                  <div>
                    <CityAutocompleteInput
                      label="Location / Address *"
                      required
                      value={editForm.address || editForm.city || ''}
                      onChange={val => setEditForm({ ...editForm, address: val, city: formatPublicCity(val) })}
                      placeholder="Search location (e.g. 1239 Lexington Rd, Louisville, KY)…"
                      inputClassName="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E2D5C8] text-sm text-[#2E2419] focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3E3D] mb-1">Facility Description</label>
                  <textarea
                    rows={3}
                    value={editForm.description || ''}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F2] border border-[#E2D5C8] text-sm text-[#2E2419] focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 resize-none"
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

                {/* Pricing Display Configuration */}
                <div className="bg-[#FAF6F2] border border-[#E2D5C8] rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-black text-[#2E2419] flex items-center gap-1.5">
                    💲 Pricing Display & Rates
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#2E2419] block mb-1">Pricing Model</label>
                      <select
                        value={editForm.pricing_type || 'starting_from'}
                        onChange={e => setEditForm({ ...editForm, pricing_type: e.target.value })}
                        className="w-full bg-white border border-[#E2D5C8] rounded-xl px-3 py-2 text-xs text-[#2E2419] focus:outline-hidden focus:border-[#8B5E3C]"
                      >
                        <option value="starting_from">Starting From Day Rate ($/day)</option>
                        <option value="inquire">Contact for Rates & Custom Packages</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#2E2419] block mb-1">Starting Base Rate ($ / day)</label>
                      <input
                        type="number"
                        value={editForm.starting_rate || ''}
                        onChange={e => setEditForm({ ...editForm, starting_rate: e.target.value ? Number(e.target.value) : null })}
                        placeholder="e.g. 30"
                        className="w-full bg-white border border-[#E2D5C8] rounded-xl px-3 py-2 text-xs text-[#2E2419] focus:outline-hidden focus:border-[#8B5E3C]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#2E2419] block mb-1">Pricing Notes / Package Policy</label>
                    <input
                      type="text"
                      value={editForm.pricing_note || ''}
                      onChange={e => setEditForm({ ...editForm, pricing_note: e.target.value })}
                      placeholder="e.g. Half-day, multi-day, and sibling discounts available"
                      className="w-full bg-white border border-[#E2D5C8] rounded-xl px-3 py-2 text-xs text-[#2E2419] focus:outline-hidden focus:border-[#8B5E3C]"
                    />
                  </div>
                </div>

                {/* Hours of Operation Editor */}
                <PartnerHoursEditor
                  hours={editForm.hours}
                  onChange={h => setEditForm({ ...editForm, hours: h })}
                  showEmergencyToggle={false}
                />

                {/* Photo Gallery Uploader */}
                <PartnerGalleryUploader
                  gallery={editForm.gallery_urls}
                  onChange={g => setEditForm({ ...editForm, gallery_urls: g })}
                />

                {/* Account & Billing Card */}
                <div className="bg-amber-50/70 rounded-3xl p-5 border border-amber-200/70 mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider mb-1">Account & Billing Settings</h3>
                    <p className="text-xs text-amber-800">Manage your business subscription, billing details, and account deletion on your unified Account page.</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
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
            )}
          </div>
        )}

        {/* ── Reviews Tab ─────────────────────────────────────────────── */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div 
              style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
              className="bg-white rounded-2xl border border-[#DFD3C7] shadow-xs p-6"
            >
              <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-[#E2D5C8]">
                <div>
                  <h2 className="text-base font-black text-[#2E2419]">Client Reviews & Feedback</h2>
                  <p className="text-xs text-[#8B7E7D]">Verified feedback left by pet parents for your daycare</p>
                </div>
                <div className="flex items-center gap-2 bg-[#FAF6F2] px-3.5 py-2 rounded-xl border border-[#E2D5C8]">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-black text-[#2E2419]">{daycare.avg_rating > 0 ? daycare.avg_rating.toFixed(1) : 'New'}</span>
                  <span className="text-xs text-[#8B7E7D]">({reviewsList.length} {reviewsList.length === 1 ? 'review' : 'reviews'})</span>
                </div>
              </div>

              <div className="pt-5 space-y-3">
                {loadingReviews ? (
                  <div className="text-center py-10 text-[#8B7E7D]">
                    <div className="w-6 h-6 border-2 border-[#8B5E3C] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs mt-2">Loading reviews...</p>
                  </div>
                ) : reviewsList.length === 0 ? (
                  <div className="text-center py-10 text-[#8B7E7D] space-y-2">
                    <Star className="w-8 h-8 mx-auto opacity-30 text-amber-500" />
                    <p className="text-sm font-bold text-[#2E2419]">No reviews yet</p>
                    <p className="text-xs">When pet parents complete daycare visits, their verified reviews will appear here.</p>
                  </div>
                ) : (
                  reviewsList.map((r, i) => (
                    <div key={r.id || i} className="bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                            {(r.ownerName || 'P')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-black text-[#2E2419]">{r.ownerName || 'Verified Pet Parent'}</p>
                            <p className="text-[10px] text-[#8B7E7D]">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center text-amber-400">
                          {[...Array(r.rating || 5)].map((_, idx) => (
                            <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-[#4A3E3D] italic">&quot;{r.reviewText}&quot;</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base font-extrabold text-gray-900">Delete Daycare Account?</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Are you sure you want to permanently delete <strong>{daycare?.business_name}</strong>?
              </p>
              <p className="text-[11px] text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">
                This will automatically cancel any active Stripe subscriptions FIRST, then permanently remove your daycare listing and availability schedule.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleDeleteDaycareAccount}
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

      {/* CHAT MODAL FOR INQUIRY THREADS */}
      {chatOpen && activeInquiry && (
        <ChatModal
          isOpen={chatOpen}
          onClose={() => { setChatOpen(false); setActiveInquiry(null); }}
          bookingId={activeInquiry.id}
          bookingDetails={`Daycare Inquiry • ${daycare?.business_name || 'Pet Daycare'}`}
          bookingStatus={activeInquiry.status || 'pending'}
          bookingDates={activeInquiry.dates || activeInquiry.requested_date || (activeInquiry.created_at ? new Date(activeInquiry.created_at).toLocaleDateString() : '')}
          bookingCreatedAt={activeInquiry.created_at}
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
