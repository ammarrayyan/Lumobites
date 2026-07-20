'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

export default function NotificationBell({ 
  email,
  isOpen,
  setIsOpen
}: { 
  email: string; 
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showMarkConfirm, setShowMarkConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) {
      setShowClearConfirm(false);
      setShowMarkConfirm(false);
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    if (!email) return;
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await fetch(`/api/notifications?email=${encodeURIComponent(normalizedEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error('Error fetching notifications', e);
    }
  };

  useEffect(() => {
    if (email) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [email]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        // Prevent closing if we are clicking any bell button or inside any bell dropdown
        // (to avoid collision between desktop/mobile bells rendering simultaneously)
        const target = e.target as HTMLElement;
        if (!target.closest('.bell-btn') && !target.closest('.bell-dropdown')) {
          setIsOpen(false);
        }
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleNotificationClick = (notification: Notification) => {
    // Navigate immediately
    setIsOpen(false);

    if (notification.link) {
      router.push(notification.link);
    } else {
      router.push('/petsitting');
    }
    router.refresh();

    // Mark as read in background (don't await)
    fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: notification.id })
    })
      .then(() => {
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
      })
      .catch((e) => console.error('Failed to mark read in background:', e));
  };

  const markAllAsRead = async () => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, all: true })
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await fetch(`/api/notifications?email=${encodeURIComponent(normalizedEmail)}`, {
        method: 'DELETE'
      });
      setNotifications([]);
    } catch (e) {
      console.error('Failed to clear notifications:', e);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!email) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50 p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-600 bell-btn"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-left bell-dropdown"
          style={{
            top: '100%',
            zIndex: 40
          }}
        >
          <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 min-h-[46px]">
            {showMarkConfirm ? (
              <div className="flex items-center justify-between w-full animate-fade-in">
                <span className="text-xs font-bold text-gray-700">Mark all as read?</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { markAllAsRead(); setShowMarkConfirm(false); }}
                    className="text-[11px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer border-none"
                  >
                    Yes
                  </button>
                  <button 
                    onClick={() => setShowMarkConfirm(false)}
                    className="text-[11px] bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : showClearConfirm ? (
              <div className="flex items-center justify-between w-full animate-fade-in">
                <span className="text-xs font-bold text-red-600">Clear all notifications?</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { clearAllNotifications(); setShowClearConfirm(false); }}
                    className="text-[11px] bg-red-600 hover:bg-red-700 text-white font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer border-none"
                  >
                    Yes
                  </button>
                  <button 
                    onClick={() => setShowClearConfirm(false)}
                    className="text-[11px] bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-gray-800 text-sm">Notifications</h3>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => { setShowMarkConfirm(true); setShowClearConfirm(false); }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer bg-transparent border-none"
                    >
                      <Check size={12} /> Mark read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button 
                      onClick={() => { setShowClearConfirm(true); setShowMarkConfirm(false); }}
                      className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1 cursor-pointer bg-transparent border-none"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full text-left p-3 border-b border-gray-50 last:border-none transition-colors ${notif.read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/50 hover:bg-blue-50'}`}
                >
                  <div className="flex gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm mb-0.5 ${notif.read ? 'text-gray-700 font-medium' : 'text-gray-900 font-bold'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                        {new Date(notif.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="p-2 border-t border-gray-100 bg-gray-50/50 text-center">
            <button 
              onClick={() => {
                setIsOpen(false);
                router.push('/petsitting');
              }}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors bg-transparent border-none cursor-pointer"
            >
              See all activity →
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div 
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toast.type === 'error' ? '#DC2626' : toast.type === 'success' ? '#10B981' : '#1F1F1F',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: '600',
            padding: '12px 16px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: `1px solid ${toast.type === 'error' ? '#EF4444' : toast.type === 'success' ? '#34D399' : '#374151'}`,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <span 
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              display: 'inline-block'
            }}
          />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
