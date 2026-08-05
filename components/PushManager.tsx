'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { app, getToken, onMessage, getMessaging } from '@/lib/firebase';

const clearAppBadgeCount = async () => {
  try {
    // 1. Web PWA Standard API (iOS Safari PWA & Android Chrome PWA)
    if (typeof navigator !== 'undefined') {
      if ('clearAppBadge' in navigator) {
        await (navigator as any).clearAppBadge().catch(() => {});
      } else if ('setAppBadge' in navigator) {
        await (navigator as any).setAppBadge(0).catch(() => {});
      }
    }

    // 2. Capacitor Native API (iOS & Android Native)
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        await PushNotifications.removeAllDeliveredNotifications();
      } catch (e) {}

      try {
        const { Badge } = await import('@capawesome/capacitor-badge');
        await Badge.set({ count: 0 });
      } catch (e) {}
    }
  } catch (err) {
    console.warn('[PushManager] Error clearing app badge:', err);
  }
};

export default function PushManager() {
  const router = useRouter();
  useEffect(() => {
    console.log('[PushManager] *** MOUNTING ***');
    
    // Clear badge count on startup and when foregrounded
    clearAppBadgeCount();

    const handleForeground = () => clearAppBadgeCount();
    window.addEventListener('focus', handleForeground);
    document.addEventListener('visibilitychange', handleForeground);
    console.log('[PushManager] Platform check:', 
      typeof window !== 'undefined' ? (window as any).Capacitor?.getPlatform() ?? 'Capacitor not detected' : 'no window'
    );
    console.log('[PushManager] window.Capacitor exists:', typeof window !== 'undefined' && !!(window as any).Capacitor);
    console.log('[PushManager] User agent:', typeof navigator !== 'undefined' ? navigator.userAgent : 'no navigator');
    const setupPush = async () => {
      try {
        const isCapacitor = typeof window !== 'undefined' && 
          (window as any).Capacitor?.isNativePlatform?.() === true;
        console.log('[PushManager] setupPush running. isCapacitor:', isCapacitor);

        // Send debug info to server so we can see it in Vercel logs
        await fetch('/api/push/debug', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isCapacitor,
            platform: (window as any).Capacitor?.getPlatform() ?? null,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          })
        }).catch(() => {});

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
            const msg = `[PushManager] Permission NOT granted: ${permStatus.receive}`;
            console.warn(msg);
            fetch('/api/push/debug', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: 'permission_denied', receive: permStatus.receive, timestamp: new Date().toISOString() }) }).catch(() => {});
            return;
          }

          fetch('/api/push/debug', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: 'permission_granted', receive: permStatus.receive, timestamp: new Date().toISOString() }) }).catch(() => {});

          // Listen for registration success
          PushNotifications.addListener('registration', async (token) => {
            console.log('[PushManager] Native push registration token event triggered! Token:', token.value.substring(0, 20) + '...');
            fetch('/api/push/debug', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: 'apns_token_received', tokenPrefix: token.value.substring(0, 20), timestamp: new Date().toISOString() }) }).catch(() => {});
            
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
              console.log('[PushManager] No email found — storing pending push token in localStorage');
              localStorage.setItem('lumo_pending_push_token', finalToken);
            }
          });

          PushNotifications.addListener('registrationError', (error) => {
            console.error('[PushManager] Native registration error:', JSON.stringify(error));
            fetch('/api/push/debug', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: 'registration_error', error: JSON.stringify(error), timestamp: new Date().toISOString() }) }).catch(() => {});
          });

          // Handle incoming notifications
          PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('[PushManager] Native push notification received:', notification);
          });

          // Handle notification click / action
          PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            console.log('[PushManager] Native push notification action performed:', action);
            const data = action.notification.data;
            const link = data?.link;
            if (link) {
              console.log('[PushManager] Redirecting tapped notification to link:', link);
              router.push(link);
            }
          });

          console.log('[PushManager] Triggering PushNotifications.register()...');
          await PushNotifications.register();
          console.log('[PushManager] PushNotifications.register() call completed');
          fetch('/api/push/debug', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: 'register_called', timestamp: new Date().toISOString() }) }).catch(() => {});

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

    setupPush();

    // Listen to custom updates or storage updates so we register the token when they log in!
    const handleLogin = () => {
      const token = localStorage.getItem('lumo_pending_push_token');
      const proEmail = localStorage.getItem('lumo_pro_email');
      const sitterEmail = localStorage.getItem('lumo_sitter_email');
      const email = proEmail || sitterEmail;

      console.log('[PushManager] handleLogin listener triggered. Email:', email, 'Pending token:', token ? 'yes' : 'none');

      if (token && email) {
        const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor;
        let deviceName = 'Web';
        if (isCapacitor) {
          const platform = (window as any).Capacitor.getPlatform();
          deviceName = platform === 'ios' ? 'iOS (Capacitor)' : platform === 'android' ? 'Android (Capacitor)' : 'Capacitor';
        } else if (typeof navigator !== 'undefined') {
          deviceName = navigator.userAgent;
        }

        console.log('[PushManager] Registering pending token for newly logged-in user:', email);
        fetch('/api/push/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, token, device: deviceName })
        })
          .then(() => {
            console.log('[PushManager] Pending token registered successfully. Clearing localStorage.');
            localStorage.removeItem('lumo_pending_push_token');
          })
          .catch(err => console.error('[PushManager] Failed to register pending push token:', err));
      }
    };

    window.addEventListener('lumo-pro-update', handleLogin);
    window.addEventListener('storage', handleLogin);
    return () => {
      window.removeEventListener('focus', handleForeground);
      document.removeEventListener('visibilitychange', handleForeground);
      window.removeEventListener('lumo-pro-update', handleLogin);
      window.removeEventListener('storage', handleLogin);
    };
  }, []);

  return null;
}
