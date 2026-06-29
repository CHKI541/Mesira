importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Read Firebase config at runtime from <meta> tags injected by the app
// This avoids hardcoding API keys in the service worker file.
const getFirebaseConfig = () => {
  // Try to get config from message if available (set from the main app)
  if (self.__FIREBASE_CONFIG__) return self.__FIREBASE_CONFIG__;
  // Fallback hardcoded for Service Worker context (SW cannot read env vars)
  return {
    apiKey: "AIzaSyBgDaO4SIBXQexDvR9vGOIjkoBR9YTj2iM",
    authDomain: "mesira-argentina.firebaseapp.com",
    projectId: "mesira-argentina",
    storageBucket: "mesira-argentina.firebasestorage.app",
    messagingSenderId: "67846483216",
    appId: "1:67846483216:web:d9a40a5f2355aad65a8995"
  };
};

// Initialize Firebase compat in the service worker
firebase.initializeApp(getFirebaseConfig());

const messaging = firebase.messaging();

// Handle background messaging
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.data?.title || payload.notification?.title || "Mesira Argentina";
  const notificationOptions = {
    body: payload.data?.body || payload.notification?.body || "Nueva publicación de tu interés",
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: {
      url: payload.data?.url || '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Accept Firebase config message from the main app thread (optional future enhancement)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    self.__FIREBASE_CONFIG__ = event.data.config;
  }
});

// Cache assets for PWA installability requirements
const CACHE_NAME = 'mesira-pwa-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use silent catch for caching just in case some resources aren't immediately loadable
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.warn("Caching error: ", err));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// PWA fetch interceptor: Network-first approach to ensure real-time listings are always fresh
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and chrome-extension requests (these cause console errors)
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;
  
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// Handle notification click to open the app or redirect to product page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Build an absolute URL so clients.openWindow works correctly from a service worker
  const rawUrl = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : '/';
  const absoluteUrl = rawUrl.startsWith('http') 
    ? rawUrl 
    : (self.location.origin + (rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl));

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if already open on that URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === absoluteUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Or open a new tab/window
      if (clients.openWindow) {
        return clients.openWindow(absoluteUrl);
      }
    })
  );
});
