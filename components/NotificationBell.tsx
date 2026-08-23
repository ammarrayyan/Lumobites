'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
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
  const seenNotifIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setShowClearConfirm(false);
      setShowMarkConfirm(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const fetchNotifications = async () => {
    if (!email) return;
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await fetch(`/api/notifications?email=${encodeURIComponent(normalizedEmail)}&t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const freshList: Notification[] = data.notifications || [];
        setNotifications(freshList);

        const unreadItems = freshList.filter(n => !n.read);
        if (!initialLoadRef.current) {
          initialLoadRef.current = true;
          unreadItems.forEach(n => seenNotifIdsRef.current.add(n.id));
        } else {
          const brandNew = unreadItems.find(n => !seenNotifIdsRef.current.has(n.id));
          if (brandNew) {
            seenNotifIdsRef.current.add(brandNew.id);
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(brandNew.title, { body: brandNew.message });
              } catch {}
            }
          }
        }
      }
    } catch (e) {
      console.error('Error fetching notifications', e);
    }
  };

  useEffect(() => {
    if (email) {
      fetchNotifications();
      // Poll every 5 seconds on desktop while active
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchNotifications();
        }
      }, 5000);

      const handleFocus = () => fetchNotifications();
      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', handleFocus);

      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleFocus);
      };
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
    <div className="relative">
      <Link 
        href="/notifications"
        className="relative p-2 rounded-full hover:bg-gray-100 transition-transform active:scale-95 flex items-center justify-center text-gray-600 bell-btn text-decoration-none"
        aria-label="View notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>
    </div>
  );
}
