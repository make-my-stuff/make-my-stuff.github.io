/*
ses for service workers:
Good Practices:

    Efficient Caching Strategies:
        Cache First: Serve resources from the cache first, then update the cache from the network. Good for static assets like images, CSS, and JavaScript files.
        Network First: Fetch resources from the network first, then fall back to the cache. Useful for dynamic content like API responses.
        Cache and Update: Serve from the cache and simultaneously update the cache in the background. Provides quick responses while keeping the cache updated.

    Cache Versioning:
        Use versioning in cache names to manage updates. This ensures old caches are deleted when new ones are installed, preventing outdated resources from being served.

    Stale-While-Revalidate:
        Serve cached content while fetching new content in the background to update the cache. This balances quick load times with updated content.

    Limit Cache Size:
        Implement logic to limit the number of items or total size of the cache to avoid storage issues. For example, use a Least Recently Used (LRU) cache management strategy.

    Graceful Fallbacks:
        Provide meaningful fallbacks for users when offline. For example, show an offline page or cached version of the site when the network is unavailable.

    Security:
        Ensure service workers are served over HTTPS to prevent man-in-the-middle attacks.
        Validate and sanitize any data before caching to avoid security vulnerabilities.

    Background Sync:
        Use background sync to handle actions like form submissions when the user is offline, syncing them when the connection is restored.

    Push Notifications:
        Implement push notifications to re-engage users with timely updates or messages, enhancing user engagement.

Use Cases:

    Offline Access:
        Enable offline access to your web application by caching essential assets and data. This provides a seamless experience even without an internet connection.

    Performance Optimization:
        Improve load times by caching static assets and serving them directly from the cache. This reduces network latency and improves user experience.

    Background Sync:
        Defer actions until the user has a stable internet connection. For instance, you can sync data to the server when the connection is restored.

    Push Notifications:
        Send push notifications to users to inform them about updates, new content, or other relevant information even when the browser is closed.

    Data Synchronization:
        Keep local data synchronized with the server, ensuring the app has the latest data even if it was updated while the user was offline.

    Enhanced User Experience:
        Provide a more responsive and reliable user experience by preloading resources and handling network failures gracefully
*/




// Register the service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }).catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
    });
  }
  
  // service-worker.js
  
  // List of assets to prefetch
  const PRECACHE = 'precache-v1';
  const RUNTIME = 'runtime';
  const PRECACHE_URLS = [
    '/', // Main HTML file
    '/styles.css', // Stylesheet
    '/script.js', // Main JavaScript file
    '/images/logo.png' // Example image
  ];
  
  // Install event: cache resources
  self.addEventListener('install', event => {
    event.waitUntil(
      caches.open(PRECACHE)
        .then(cache => cache.addAll(PRECACHE_URLS))
        .then(self.skipWaiting())
    );
  });
  
  // Activate event: clean up old caches
  self.addEventListener('activate', event => {
    const currentCaches = [PRECACHE, RUNTIME];
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
      }).then(cachesToDelete => {
        return Promise.all(cachesToDelete.map(cacheToDelete => {
          return caches.delete(cacheToDelete);
        }));
      }).then(() => self.clients.claim())
    );
  });
  
  // Fetch event: serve cached content if available
  self.addEventListener('fetch', event => {
    if (event.request.url.startsWith(self.location.origin)) {
      event.respondWith(
        caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return caches.open(RUNTIME).then(cache => {
            return fetch(event.request).then(response => {
              // Put a copy of the response in the runtime cache.
              return cache.put(event.request, response.clone()).then(() => {
                return response;
              });
            });
          });
        })
      );
    }
  });
  








  const PRECACHE = 'precache-v1';
const RUNTIME = 'runtime';
const PRECACHE_URLS = [
  '/', // Main HTML file
  '/styles.css', // Stylesheet
  '/script.js', // Main JavaScript file
  '/images/logo.png' // Example image
];

const MAX_CACHE_ITEMS = 50;

// Install event: cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting())
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  const currentCaches = [PRECACHE, RUNTIME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Fetch event: serve cached content if available
self.addEventListener('fetch', event => {
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return caches.open(RUNTIME).then(cache => {
          return fetch(event.request).then(response => {
            return cache.put(event.request, response.clone()).then(() => {
              cleanCache(RUNTIME, MAX_CACHE_ITEMS);
              return response;
            });
          });
        });
      })
    );
  }
});

// Clean cache by limiting number of items
function cleanCache(cacheName, maxItems) {
  caches.open(cacheName).then(cache => {
    cache.keys().then(keys => {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(() => cleanCache(cacheName, maxItems));
      }
    });
  });
}

// Background Sync event
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

function syncData() {
  return fetch('/sync', {
    method: 'POST',
    body: JSON.stringify(getLocalData())
  }).then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  }).then(data => {
    console.log('Data synchronized:', data);
  }).catch(error => {
    console.error('Sync failed:', error);
  });
}

function getLocalData() {
  return { key: 'value' };
}

// Push Notification event
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: 'icon.png',
    badge: 'badge.png',
    data: {
      url: data.url
    }
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
