'use client';

import { useEffect } from 'react';
import { app, getToken, onMessage, getMessaging } from '@/lib/firebase';

export default function PushManager() {
  useEffect(() => {
    console.log('[PushManager] Component mounted');
    
    const setupPush = async () => {
      try {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          // Only proceed automatically if permission is already granted
          if (Notification.permission === 'granted') {
            console.log('[PushManager] Permission already granted, syncing push token');
            const messaging = getMessaging(app);
            
            // Get FCM token
            const token = await getToken(messaging, {
              vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
            });

            if (token) {
              // Now see if we have an email. If we do, save it immediately.
              const proEmail = localStorage.getItem('lumo_pro_email');
              const sitterEmail = localStorage.getItem('lumo_sitter_email');
              const email = proEmail || sitterEmail;
              
              if (email) {
                await fetch('/api/push/register', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, token, device: navigator.userAgent })
                });
                console.log('[PushManager] Registered token for:', email);
              } else {
                // If not logged in yet, save the token to localStorage,
                // and register it once the user logs in!
                localStorage.setItem('lumo_pending_push_token', token);
              }

              // Handle foreground messages
              onMessage(messaging, (payload) => {
                console.log('[PushManager] Foreground push notification received:', payload);
              });
            }
          } else {
            console.log('[PushManager] Permission status:', Notification.permission, '- waiting for user action');
          }
        }
      } catch (err) {
        console.error('[PushManager] Error setting up push notifications:', err);
      }
    };

    setupPush();

    // Listen to custom updates or storage updates so we register the token when they log in!
    const handleLogin = () => {
      const token = localStorage.getItem('lumo_pending_push_token');
      const proEmail = localStorage.getItem('lumo_pro_email');
      const sitterEmail = localStorage.getItem('lumo_sitter_email');
      const email = proEmail || sitterEmail;
      if (token && email) {
        fetch('/api/push/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, token, device: navigator.userAgent })
        }).catch(err => console.error('Failed to register pending push token:', err));
      }
    };

    window.addEventListener('lumo-pro-update', handleLogin);
    window.addEventListener('storage', handleLogin);
    return () => {
      window.removeEventListener('lumo-pro-update', handleLogin);
      window.removeEventListener('storage', handleLogin);
    };
  }, []);

  return null;
}
