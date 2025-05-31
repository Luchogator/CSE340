/**
 * Service Worker Configuration for CSE Motors
 * This file contains the configuration and constants used by the Service Worker
 * 
 * This file follows a centralized configuration pattern to facilitate maintenance
 * and updating the Service Worker's behavior.
 */


// ============================================
// General Configuration
// ============================================


// Cache Version - Increment this number whenever resources are updated
const CACHE_VERSION = 'v2.0.0';

// Prefix for the cache name
const CACHE_PREFIX = 'cse-motors';

// Full cache name
const CACHE_NAME = `${CACHE_PREFIX}-${CACHE_VERSION}`;

// Maximum time in cache (in seconds)
const MAX_AGE = {
  CSS: 60 * 60 * 24 * 7,       // 1 week
  JS: 60 * 60 * 24 * 7,        // 1 week
  IMG: 60 * 60 * 24 * 30,      // 1 month
  FONT: 60 * 60 * 24 * 30,     // 1 month
  HTML: 60 * 60 * 24,          // 1 day
  API: 60 * 5,                 // 5 minutes
  OTHER: 60 * 60 * 24,         // 1 day
  MANIFEST: 60 * 60 * 24 * 7   // 1 week for the manifest
};

// Network request timeout (in seconds)
const NETWORK_TIMEOUT = 5;

// Maximum cache size (in MB)
const MAX_CACHE_SIZE = 50;

// ============================================
// Cache Strategies
// ============================================


/**
 * Available Cache Strategies
 * Defines the caching behavior for different types of resources
 */
const CACHE_STRATEGIES = Object.freeze({
  CACHE_FIRST: 'cache-first',            // Serve from cache first, fallback to network if not available
  NETWORK_FIRST: 'network-first',        // Attempt to fetch from network first, fallback to cache if fails
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate', // Serve from cache and update in the background
  NETWORK_ONLY: 'network-only',          // Network only, no cache
  CACHE_ONLY: 'cache-only'               // Cache only, no network
});

// ============================================
// Push Notification Configuration
// ============================================


/**
 * Configuration for push notifications
 */
const NOTIFICATION_CONFIG = {
  // Notification display time (in seconds)
  DISPLAY_TIME: 10,
  
  // Default image URL for notifications
  DEFAULT_ICON: '/images/notification-icon.png',
  
  // App colors for notifications
  COLORS: {
    PRIMARY: '#1976d2',
    SECONDARY: '#f50057',
    BACKGROUND: '#ffffff',
    TEXT: '#212121',
    ACCENT: '#ff4081'
  },
  
  // Action configuration
  ACTIONS: [
    { action: 'view', title: 'View' },
    { action: 'dismiss', title: 'Dismiss' }
  ],
  
  // Vibration pattern
  VIBRATION_PATTERN: [200, 100, 200, 100, 200, 100, 400]
};

// ============================================
// Resources for Precaching
// ============================================


/**
 * List of resources for precaching during installation
 * These resources will be cached immediately after installation
 */
const PRECACHE_ASSETS = [
  // HTML Pages
  '/',
  '/404.html',
  
  // Service Worker core files
  '/js/register-sw.js',
  '/js/sw-config.js'
];

// ============================================
// Cache Exclusions
// ============================================


/**
 * URL patterns that should never be cached
 * Regular expressions are used to match URL patterns
 */
const NO_CACHE_PATTERNS = [
  /\/api\//,                  // API routes
  /\/auth\//,                // Authentication routes
  /\/admin\//,               // Admin panel
  /\/private\//,             // Private routes
  /\/wp-json\//,             // WordPress API
  /\/graphql/,               // GraphQL endpoints
  /\/socket\.io\//,          // WebSockets
  /\/sockjs-node\//,         // Webpack Dev Server
  /\/__webpack_hmr/,         // Webpack Hot Module Replacement
  /\/browser-sync\//,        // BrowserSync
  /\.(?:json|xml|csv)$/i,    // Data files
  /\/service-worker\.js/     // The service worker itself
];

// ============================================
// Route Strategies
// ============================================


/**
 * Cache strategy configuration per route
 * Allows customizing caching behavior
 * for different routes or URL patterns
 */
const ROUTE_STRATEGIES = Object.freeze([
  // Main pages - Stale While Revalidate for dynamic content
  {
    pattern: /^\/(|about|contact|vehicles|upgrades)$/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    options: {
      cacheName: `${CACHE_NAME}-pages`,
      networkTimeoutSeconds: NETWORK_TIMEOUT,
      plugins: [
        { 
          expiration: { 
            maxEntries: 20, 
            maxAgeSeconds: MAX_AGE.HTML,
            purgeOnQuotaError: true
          } 
        },
        { 
          cacheableResponse: { 
            statuses: [0, 200],
            headers: { 'Content-Type': ['text/html', 'text/plain'] }
          } 
        }
      ]
    }
  },
  
  // CSS Files - Cache First with validation
  {
    pattern: /\.css(?:\?.*)?$/i,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    options: {
      cacheName: `${CACHE_NAME}-styles`,
      plugins: [
        { 
          expiration: { 
            maxEntries: 30, 
            maxAgeSeconds: MAX_AGE.CSS,
            purgeOnQuotaError: true
          } 
        },
        { 
          cacheableResponse: { 
            statuses: [0, 200]
          } 
        }
      ]
    }
  },
  
  // JS Scripts - Cache First with validation
  {
    pattern: /\.js(?:\?.*)?$/i,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    options: {
      cacheName: `${CACHE_NAME}-scripts`,
      plugins: [
        { 
          expiration: { 
            maxEntries: 30, 
            maxAgeSeconds: MAX_AGE.JS,
            purgeOnQuotaError: true
          } 
        },
        { 
          cacheableResponse: { 
            statuses: [0, 200]
          } 
        }
      ]
    }
  },
  
  // Images - Cache First with validation
  {
    pattern: /\.(?:png|jpg|jpeg|webp|gif|svg|ico)(?:\?.*)?$/i,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    options: {
      cacheName: `${CACHE_NAME}-images`,
      plugins: [
        { 
          expiration: { 
            maxEntries: 100, 
            maxAgeSeconds: MAX_AGE.IMG,
            purgeOnQuotaError: true
          } 
        },
        { 
          cacheableResponse: { 
            statuses: [0, 200]
          } 
        }
      ]
    }
  },
  
  // Fonts - Cache First with validation
  {
    pattern: /\.(?:woff|woff2|ttf|eot|otf)(?:\?.*)?$/i,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    options: {
      cacheName: `${CACHE_NAME}-fonts`,
      plugins: [
        { 
          expiration: { 
            maxEntries: 20, 
            maxAgeSeconds: MAX_AGE.FONT,
            purgeOnQuotaError: true
          } 
        },
        { 
          cacheableResponse: { 
            statuses: [0, 200]
          } 
        }
      ]
    }
  },
  
  // Third-party resources - Stale While Revalidate
  {
    pattern: /^https?:\/\/(?:fonts\.googleapis\.com|cdn\.jsdelivr\.net|unpkg\.com)/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    options: {
      cacheName: `${CACHE_NAME}-third-party`,
      networkTimeoutSeconds: NETWORK_TIMEOUT,
      plugins: [
        { 
          expiration: { 
            maxEntries: 50, 
            maxAgeSeconds: MAX_AGE.OTHER * 7, // 1 week
            purgeOnQuotaError: true
          } 
        },
        { 
          cacheableResponse: { 
            statuses: [0, 200]
          } 
        }
      ]
    }
  },
  
  // Static assets - Cache First with validation
  {
    pattern: /\.(?:js|css|woff2?|ttf|eot)$/i,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    options: {
      cacheName: `${CACHE_NAME}-static-assets`,
      plugins: [
        { 
          expiration: { 
            maxEntries: 50, 
            maxAgeSeconds: MAX_AGE.JS,
            purgeOnQuotaError: true
          } 
        },
        { 
          cacheableResponse: { 
            statuses: [0, 200]
          } 
        }
      ]
    }
  },
  
  // API requests - Network First with cache fallback
  {
    pattern: /\/api\//i,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    options: {
      cacheName: `${CACHE_NAME}-api`,
      networkTimeoutSeconds: 5,
      plugins: [
        { 
          expiration: { 
            maxEntries: 30, 
            maxAgeSeconds: MAX_AGE.API,
            purgeOnQuotaError: true
          } 
        },
        { 
          cacheableResponse: { 
            statuses: [0, 200, 404]
          } 
        }
      ]
    }
  }
]);

// Export Configuration
const ServiceWorkerConfig = {
  CACHE_VERSION,
  CACHE_PREFIX,
  CACHE_NAME,
  MAX_AGE,
  CACHE_STRATEGIES,
  PRECACHE_ASSETS,
  NO_CACHE_PATTERNS,
  ROUTE_STRATEGIES,
  NOTIFICATION_CONFIG,
  NETWORK_TIMEOUT,
  MAX_CACHE_SIZE
};
