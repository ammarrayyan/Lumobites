'use client';

import { useEffect } from 'react';
import { app, getToken, onMessage, getMessaging } from '@/lib/firebase';

export default function PushManager() {
  const setupPush = async () => {
    try {
      const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor;

      if (isCapacitor) {
        console.log('[PushManager] Capacitor native environment detected');
        const { PushNotifications } = await import('@capacitor/push-notifications');
        
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.warn('[PushManager] Push notification permission not granted natively');
          return;
        }

        // Listen for registration success
        PushNotifications.addListener('registration', async (token) => {
          console.log('[PushManager] Native push registration token (APNs on iOS, FCM on Android):', token.value);
          
          const platform = (window as any).Capacitor.getPlatform();
          let finalToken = token.value;

          if (platform === 'ios') {
            try {
              const { FCM } = await import('@capacitor-community/fcm');
              const fcmTokenRes = await FCM.getToken();
              finalToken = fcmTokenRes.token;
              console.log('[PushManager] Retrieved FCM token for iOS:', finalToken);
            } catch (err) {
              console.error('[PushManager] Error fetching FCM token on iOS, falling back to native token:', err);
            }
          }

          const proEmail = localStorage.getItem('lumo_pro_email');
          const sitterEmail = localStorage.getItem('lumo_sitter_email');
          const email = proEmail || sitterEmail;
          const deviceName = platform === 'ios' ? 'iOS (Capacitor)' : platform === 'android' ? 'Android (Capacitor)' : 'Capacitor';
          
          if (email) {
            await fetch('/api/push/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, token: finalToken, device: deviceName })
            });
            console.log('[PushManager] Registered native token for:', email);
          } else {
            localStorage.setItem('lumo_pending_push_token', finalToken);
          }
        });

        // Handle incoming notifications
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('[PushManager] Native push notification received:', notification);
        });

        await PushNotifications.register();

      } else if ('serviceWorker' in navigator && 'PushManager' in window) {
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

  useEffect(() => {
    console.log('[PushManager] Component mounted');
    setupPush();

    // Listen to custom updates or storage updates so we register the token when they log in!
    const handleLogin = () => {
      const proEmail = localStorage.getItem('lumo_pro_email');
      const sitterEmail = localStorage.getItem('lumo_sitter_email');
      const email = proEmail || sitterEmail;
      
      if (!email) return;

      // Re-run full push setup on login
      setupPush();
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
