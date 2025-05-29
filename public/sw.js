/**
 * CSE Motors Service Worker
 * Provides offline capabilities and caching
 * 
 * This file implements an advanced Service Worker with the following features:
 * - Static resource precaching
 * - Customizable cache strategies
 * - Offline support with a custom page
 * - Automatic updates
 * - Message handling for communication with the application
 */

// Import configuration
importScripts('/js/sw-config.js');

// Alias for easier access to configuration
const OFFLINE_URL = '/offline.html';
const CACHEABLE_METHODS = ['GET'];
const CACHEABLE_CONTENT_TYPES = [
  'text/css',
  'text/javascript',
  'application/javascript',
  'image/png',
  'image/jpeg',
  'image/svg+xml',
  'image/webp',
  'font/woff',
  'font/woff2',
  'font/ttf',
  'font/otf'
];

/**
 * Checks if a URL matches any exclusion pattern
 * @param {string} url - URL to check
 * @returns {boolean} - True if the URL should be excluded from the cache
 */
const shouldExcludeFromCache = (url) => {
  return NO_CACHE_PATTERNS.some(pattern =>
    typeof pattern === 'string'
      ? url.includes(pattern)
      : pattern.test(url)
  );
};

/**
 * Gets the cache strategy for a specific URL
 * @param {string} url - URL for which the strategy is sought
 * @returns {Object} - Configured cache strategy or the default one
 */
const getCacheStrategy = (url) => {
  const matchedStrategy = ROUTE_STRATEGIES.find(({ pattern }) =>
    pattern.test(url)
  );

  return matchedStrategy || {
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    options: {
      cacheName: CACHE_NAME,
      plugins: [
        { expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 } },
        { cacheableResponse: { statuses: [0, 200] } }
      ]
    }
  };
};

/**
 * Implements the Cache First strategy
 */
const cacheFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // If network fails and no cached response, return error
    return Response.error();
  }
};

/**
 * Implements the Network First strategy
 */
const networkFirst = async (request, cacheName, options = {}) => {
  const { networkTimeoutSeconds = 3 } = options;
  let networkResponse;

  try {
    networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), networkTimeoutSeconds * 1000)
      )
    ]);

    // Cache response if successful
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Fallback to cache if network fails
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // If no cached response, return network error
    return networkResponse || Response.error();
  }
};

/**
 * Implements the Stale While Revalidate strategy
 */
const staleWhileRevalidate = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Update cache in the background
  const updateCache = async () => {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
    } catch (error) {
      // Silent error when updating cache
      console.error('Error updating cache:', error);
    }
  };

  // Start background update
  if (cachedResponse) {
    updateCache();
    return cachedResponse;
  }

  // If no cached response, get from network
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    return Response.error();
  }
};

// ============================================
// Service Worker Events
// ============================================

/**
 * Installation event
 * Precaches the static resources defined in PRECACHE_ASSETS
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Installing and precaching resources');
        const assetsToPrecache = [...PRECACHE_ASSETS, OFFLINE_URL];
        return cache.addAll(assetsToPrecache).catch(error => {
          console.error('[Service Worker] Precache Error:', error);
          console.warn('[Service Worker] Some resources failed to precache.', assetsToPrecache);
          // We can still allow the service worker to install even if some precaching fails
          // depending on requirements. For now, re-throwing the error to make it visible.
          throw error;
        });
      })
      .then(() => self.skipWaiting())
  );
});

/**
 * Activation event
 * Cleans up old caches and claims clients
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name.startsWith('cse-motors-'))
            .map((name) => caches.delete(name))
        );
      }),

      // Claim clients immediately
      self.clients.claim()
    ])
  );
});

/**
 * Fetch event
 * Handles all network requests and applies caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests and same-origin requests
  if (!CACHEABLE_METHODS.includes(request.method) ||
    !url.origin.startsWith(self.location.origin)) {
    return;
  }

  // Exclude certain paths from cache
  if (shouldExcludeFromCache(url.pathname)) {
    return event.respondWith(fetch(request));
  }

  // Determine the caching strategy to use
  const { strategy, options = {} } = getCacheStrategy(url.pathname);
  const { cacheName = CACHE_NAME } = options;

  // Handle navigation requests (HTML) specially
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, cacheName, options)
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Apply caching strategy as appropriate
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      event.respondWith(cacheFirst(request, cacheName));
      break;

    case CACHE_STRATEGIES.NETWORK_FIRST:
      event.respondWith(networkFirst(request, cacheName, options));
      break;

    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      event.respondWith(staleWhileRevalidate(request, cacheName));
      break;

    case CACHE_STRATEGIES.NETWORK_ONLY:
      event.respondWith(fetch(request));
      break;

    case CACHE_STRATEGIES.CACHE_ONLY:
      event.respondWith(caches.match(request));
      break;

    default:
      event.respondWith(staleWhileRevalidate(request, cacheName));
  }
});

/**
 * Message event
 * Handles communication with the application
 */
self.addEventListener('message', (event) => {
  if (!event.data) return;

  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME);
      break;

    case 'GET_CACHE_STATUS':
      caches.has(CACHE_NAME).then((hasCache) => {
        event.ports[0].postMessage({ hasCache });
      });
      break;

    // Add more message types as needed
  }
});

/**
 * Background sync event
 * Useful for updates when the user regains connection
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('[Service Worker] Background sync');
    // Implement sync logic
  }
});

/**
 * Push notification event
 * Handles received push notifications
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const { title, body, icon, data } = event.data.json();

  const options = {
    body,
    icon: icon || NOTIFICATION_CONFIG.DEFAULT_ICON,
    badge: '/images/badge.png',
    data: data || {},
    vibrate: [100, 50, 100],
    timestamp: Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * Notification click event
 * Handles actions when the user interacts with a notification
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { action, notification } = event;
  const { data } = notification;

  // Handle custom actions
  switch (action) {
    case 'view':
      if (data && data.url) {
        clients.openWindow(data.url);
      }
      break;

    case 'dismiss':
      // Do nothing, just close the notification
      break;

    default:
      // Default action: open the application
      clients.openWindow('/');
  }
});
