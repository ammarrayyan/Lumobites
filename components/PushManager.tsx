'use client';

import { useEffect } from 'react';
import { app, getToken, onMessage, getMessaging } from '@/lib/firebase';

export default function PushManager() {
  useEffect(() => {
    const setupPush = async () => {
      // Check if user is logged in
      const proEmail = localStorage.getItem('lumo_pro_email');
      const sitterEmail = localStorage.getItem('lumo_sitter_email');
      const email = proEmail || sitterEmail;
      
      if (!email) return;

      try {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const permission = await Notification.requestPermission();
          
          if (permission === 'granted') {
            const messaging = getMessaging(app);
            
            // Get FCM token
            const token = await getToken(messaging, {
              vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
            });

            if (token) {
              // Save token
              await fetch('/api/push/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token, device: navigator.userAgent })
              });

              // Handle foreground messages
              onMessage(messaging, (payload) => {
                console.log('Foreground push notification received:', payload);
                if (payload.notification) {
                  // Optionally show a toast notification here
                }
              });
            }
          }
        }
      } catch (err) {
        console.error('Error setting up push notifications:', err);
      }
    };

    setupPush();
  }, []);

  return null;
}
