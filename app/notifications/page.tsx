'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  ArrowLeft, 
  CheckCheck, 
  Trash2, 
  PawPrint, 
  Calendar, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight,
  RefreshCw
} from 'lucide-react';

interface Notification {
  id: string;
  recipient_email: string;
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  created_at: string;
  booking_id?: string;
  sitter_id?: string;
}

type FilterTab = 'all' | 'access' | 'bookings' | 'system';

export default function NotificationsPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showMarkConfirm, setShowMarkConfirm] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // 1. Identify User Session
  useEffect(() => {
    const identifyUser = async () => {
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
          if (data.email) {
            setEmail(data.email);
            return;
          }
        }
      } catch (err) {
        console.error('Session lookup failed:', err);
      } finally {
        setIsLoading(false);
      }
    };
    identifyUser();
  }, []);

  // 2. Fetch Notifications
  const fetchNotifications = async () => {
    if (!email) return;
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await fetch(`/api/notifications?email=${encodeURIComponent(normalizedEmail)}&t=${Date.now()}`, { 
        cache: 'no-store' 
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  };

  useEffect(() => {
    if (email) {
      fetchNotifications();
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchNotifications();
        }
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [email]);

  const handleNotificationClick = async (notif: Notification) => {
    // Mark as read in background
    fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: notif.id })
    }).catch(() => {});

    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));

    if (notif.link) {
      router.push(notif.link);
    } else {
      router.push('/petsitting');
    }
  };

  const markAllAsRead = async () => {
    if (!email) return;
    setIsActionLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, all: true })
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setShowMarkConfirm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  const clearAllNotifications = async () => {
    if (!email) return;
    setIsActionLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await fetch(`/api/notifications?email=${encodeURIComponent(normalizedEmail)}`, {
        method: 'DELETE'
      });
      setNotifications([]);
      setShowClearConfirm(false);
    } catch (e) {
      console.error('Failed to clear notifications:', e);
    } finally {
      setIsActionLoading(false);
    }
  };

  // 3. Filter notifications
  const filteredNotifications = notifications.filter(notif => {
    if (filterTab === 'access') {
      return notif.type.includes('pet_access') || notif.type.includes('access');
    }
    if (filterTab === 'bookings') {
      return notif.type.includes('booking') || notif.type.includes('inquiry') || notif.type.includes('sitter') || notif.type.includes('vet') || notif.type.includes('daycare');
    }
    if (filterTab === 'system') {
      return !notif.type.includes('pet_access') && !notif.type.includes('access') && !notif.type.includes('booking') && !notif.type.includes('inquiry');
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    if (type.includes('pet_access') || type.includes('access')) {
      return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
    }
    if (type.includes('booking') || type.includes('inquiry') || type.includes('sitter')) {
      return <Calendar className="w-5 h-5 text-sky-600" />;
    }
    if (type.includes('vet') || type.includes('daycare') || type.includes('lost_pet')) {
      return <PawPrint className="w-5 h-5 text-[#8B5E3C]" />;
    }
    return <Sparkles className="w-5 h-5 text-amber-600" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF9F6] flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-gray-500 font-semibold text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-[#8B5E3C]" />
          Loading notifications...
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="min-h-screen bg-[#FBF9F6] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-lg border border-[#E8DDD4] flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[#FAF6F4] flex items-center justify-center text-[#8B5E3C] mb-4">
            <Bell size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to view notifications</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Please sign in with your email to see your pet access approvals, booking requests, and activity alerts.
          </p>
          <Link
            href="/account"
            className="w-full py-3 bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-sm rounded-xl transition-colors shadow-sm text-decoration-none"
          >
            Sign In / Manage Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F6] pb-24 pt-4 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-5">
        
        {/* Top Navigation & Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => setShowMarkConfirm(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50/80 border border-blue-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <CheckCheck size={15} /> Mark read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-800 bg-red-50/80 border border-red-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 size={15} /> Clear all
              </button>
            )}
          </div>
        </div>

        {/* Confirmation Banners */}
        {showMarkConfirm && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between animate-fade-in">
            <span className="text-xs font-bold text-blue-900">Mark all notifications as read?</span>
            <div className="flex gap-2">
              <button
                onClick={markAllAsRead}
                disabled={isActionLoading}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer border-none"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowMarkConfirm(false)}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-300 cursor-pointer border-none"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {showClearConfirm && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between animate-fade-in">
            <span className="text-xs font-bold text-red-900">Clear all notifications permanently?</span>
            <div className="flex gap-2">
              <button
                onClick={clearAllNotifications}
                disabled={isActionLoading}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 cursor-pointer border-none"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-300 cursor-pointer border-none"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Title & Stats */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E8DDD4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
              Notifications & Activity
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Account updates, pet access requests, and booking status alerts for {email}
            </p>
          </div>

          {/* Quick Refresh */}
          <button
            onClick={fetchNotifications}
            className="self-start sm:self-auto p-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'All', count: notifications.length },
            { id: 'access', label: '🐾 Pet Access', count: notifications.filter(n => n.type.includes('pet_access') || n.type.includes('access')).length },
            { id: 'bookings', label: '📅 Bookings', count: notifications.filter(n => n.type.includes('booking') || n.type.includes('inquiry') || n.type.includes('sitter') || n.type.includes('vet') || n.type.includes('daycare')).length },
            { id: 'system', label: '🔔 System & Plan', count: notifications.filter(n => !n.type.includes('pet_access') && !n.type.includes('access') && !n.type.includes('booking') && !n.type.includes('inquiry')).length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as FilterTab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                filterTab === tab.id
                  ? 'bg-[#8B5E3C] text-white border-[#8B5E3C] shadow-xs'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="flex flex-col gap-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#E8DDD4] shadow-xs flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                <Bell size={24} />
              </div>
              <h3 className="font-bold text-gray-800 text-base mb-1">No notifications found</h3>
              <p className="text-xs text-gray-400 max-w-sm">
                You're completely caught up! New booking updates and pet profile access requests will appear here.
              </p>
            </div>
          ) : (
            filteredNotifications.map(notif => {
              const formattedDate = new Date(notif.created_at).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                    notif.read
                      ? 'bg-white border-gray-200/80 hover:border-[#8B5E3C]/40 hover:shadow-md'
                      : 'bg-[#FDFBF7] border-[#8B5E3C]/30 shadow-xs hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    {/* Category Icon */}
                    <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-center justify-center shrink-0 mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                        <h4 className={`text-sm font-bold truncate ${notif.read ? 'text-gray-800' : 'text-gray-900 font-extrabold'}`}>
                          {notif.title}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-gray-400 font-semibold mt-2 inline-block">
                        {formattedDate}
                      </span>
                    </div>
                  </div>

                  {/* Action Link Button */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <span className="text-xs font-bold text-[#8B5E3C] group-hover:text-[#734A2E] flex items-center gap-1">
                      Open <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
