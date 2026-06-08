importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

// Fetch the config from our API endpoint
fetch('/api/firebase-config')
  .then((response) => response.json())
  .then((config) => {
    firebase.initializeApp(config);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const { title, body, icon } = payload.notification;
      self.registration.showNotification(title, {
        body,
        icon: icon || '/Logo.png',
        badge: '/Logo.png',
        vibrate: [200, 100, 200],
      });
    });
  })
  .catch((err) => {
    console.error('Failed to load Firebase config in Service Worker:', err);
  });
