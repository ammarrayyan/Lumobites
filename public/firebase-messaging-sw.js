importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

// Fetch the config from our API endpoint
fetch('/api/firebase-config')
  .then((response) => response.json())
  .then((config) => {
    firebase.initializeApp(config);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const { title, body, icon } = payload.notification || {};
      const link = payload.data?.link || payload.data?.url || '/';
      self.registration.showNotification(title || 'New Notification', {
        body: body || '',
        icon: icon || '/Logo.png',
        badge: '/Logo.png',
        vibrate: [200, 100, 200],
        data: { link },
      });
    });
  })
  .catch((err) => {
    console.error('Failed to load Firebase config in Service Worker:', err);
  });

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification?.data?.link || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(link);
      }
    })
  );
});
