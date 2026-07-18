'use client';

import { useEffect } from 'react';
import { app, getToken, onMessage, getMessaging } from '@/lib/firebase';

export default function PushManager() {
  const setupPush = async () => {
    try {
      const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor;
      console.log('[PushManager] setupPush running. isCapacitor:', isCapacitor);

      if (isCapacitor) {
        console.log('[PushManager] Capacitor native environment detected');
        const { PushNotifications } = await import('@capacitor/push-notifications');
        
        let permStatus = await PushNotifications.checkPermissions();
        console.log('[PushManager] Initial native permission status:', JSON.stringify(permStatus));

        if (permStatus.receive === 'prompt') {
          console.log('[PushManager] Requesting native permissions...');
          permStatus = await PushNotifications.requestPermissions();
          console.log('[PushManager] Native permission response status:', JSON.stringify(permStatus));
        }

        if (permStatus.receive !== 'granted') {
          console.warn('[PushManager] Push notification permission not granted natively');
          return;
        }

        // Listen for registration success
        console.log('[PushManager] Adding native push listeners...');
        
        // Remove existing listeners first to avoid duplicate handler accumulation
        try {
          await PushNotifications.removeAllListeners();
          console.log('[PushManager] Existing native listeners removed successfully');
        } catch (e) {
          console.log('[PushManager] No existing listeners to remove or failed to remove:', e);
        }

        await PushNotifications.addListener('registration', async (token) => {
          console.log('[PushManager] Native push registration token event triggered! Token:', token.value);
          
          const platform = (window as any).Capacitor.getPlatform();
          let finalToken = token.value;

          if (platform === 'ios') {
            try {
              console.log('[PushManager] Fetching FCM token via @capacitor-community/fcm...');
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
          
          console.log('[PushManager] Found user email for registration:', email);

          if (email) {
            console.log('[PushManager] Sending registration call to /api/push/register...');
            const res = await fetch('/api/push/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, token: finalToken, device: deviceName })
            });
            console.log('[PushManager] Registration API response status:', res.status);
          } else {
            console.log('[PushManager] Storing pending push token in localStorage');
            localStorage.setItem('lumo_pending_push_token', finalToken);
          }
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('[PushManager] Native registration error:', JSON.stringify(error));
        });

        // Handle incoming notifications
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('[PushManager] Native push notification received:', notification);
        });

        console.log('[PushManager] Triggering PushNotifications.register()...');
        await PushNotifications.register();
        console.log('[PushManager] PushNotifications.register() call completed');

      } else if ('serviceWorker' in navigator && 'PushManager' in window) {
        console.log('[PushManager] Web push environment detected');
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
    console.log('[PushManager] *** MOUNTING ***');
    setupPush();

    // Listen to custom updates or storage updates so we register the token when they log in!
    const handleLogin = () => {
      const proEmail = localStorage.getItem('lumo_pro_email');
      const sitterEmail = localStorage.getItem('lumo_sitter_email');
      const email = proEmail || sitterEmail;
      
      console.log('[PushManager] handleLogin listener triggered. Email:', email);
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
