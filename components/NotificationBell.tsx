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

export default function NotificationBell({ email }: { email: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = async () => {
    if (!email) return;
    try {
      const res = await fetch(`/api/notifications?email=${encodeURIComponent(email)}`);
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
        setShowDropdown(false);
      }
    };
    if (showDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read first
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notification.id })
      });
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }
    
    // Navigate based on type
    switch(notification.type) {
      case 'booking_request':
        // Take sitter to their pending requests
        router.push('/petsitting?section=sitter-dashboard&tab=requests');
        break;
      case 'booking_accepted':
        // Take owner to their accepted bookings
        router.push('/petsitting?section=owner-dashboard&tab=bookings');
        break;
      case 'booking_declined':
        // Take owner to their booking history
        router.push('/petsitting?section=owner-dashboard&tab=bookings');
        break;
      case 'booking_cancelled':
        alert('This booking has been cancelled');
        router.push(notification.link || '/petsitting?section=sitter-dashboard&tab=requests');
        break;
      case 'new_message':
      case 'message':
        // Open chat for this specific booking
        // Store booking ID in localStorage then navigate
        if (notification.booking_id) {
          localStorage.setItem('open_chat_booking_id', notification.booking_id);
        }
        router.push('/petsitting?section=messages');
        break;
      case 'booking_completed':
        router.push('/petsitting?section=owner-dashboard&tab=bookings');
        break;
      case 'no_show':
        router.push('/petsitting?section=sitter-dashboard&tab=requests');
        break;
      case 'review_request':
        router.push(`/petsitting/review/${notification.sitter_id}`);
        break;
      default:
        router.push('/petsitting');
    }
    
    // Close the notification dropdown
    setShowDropdown(false);
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, all: true })
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!email) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-600"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="fixed sm:absolute right-4 sm:right-0 top-[60px] sm:top-auto sm:mt-2 sm:w-80 w-[calc(100vw-32px)] bg-white border border-gray-200 rounded-2xl shadow-2xl z-[300] overflow-hidden flex flex-col text-left mx-auto sm:mx-0">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-bold text-gray-800 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                <Check size={12} /> Mark all read
              </button>
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
                  className={`w-full text-left p-3 border-b border-gray-50 last:border-none transition-colors \${notif.read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/50 hover:bg-blue-50'}`}
                >
                  <div className="flex gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm mb-0.5 \${notif.read ? 'text-gray-700 font-medium' : 'text-gray-900 font-bold'}`}>
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
            <a href="/petsitting" className="text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors">
              See all activity →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
