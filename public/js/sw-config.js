/**
 * Configuración del Service Worker para CSE Motors
 * Este archivo contiene la configuración y las constantes utilizadas por el Service Worker
 * 
 * Este archivo sigue el patrón de configuración centralizada para facilitar el mantenimiento
 * y la actualización del comportamiento del Service Worker.
 */


// ============================================
// Configuración General
// ============================================


// Versión de la caché - Incrementar este número cada vez que se actualicen los recursos
const CACHE_VERSION = 'v2.0.0';

// Prefijo para el nombre de la caché
const CACHE_PREFIX = 'cse-motors';

// Nombre completo de la caché
const CACHE_NAME = `${CACHE_PREFIX}-${CACHE_VERSION}`;

// Tiempo máximo de vida en caché (en segundos)
const MAX_AGE = {
  CSS: 60 * 60 * 24 * 7,       // 1 semana
  JS: 60 * 60 * 24 * 7,        // 1 semana
  IMG: 60 * 60 * 24 * 30,      // 1 mes
  FONT: 60 * 60 * 24 * 30,     // 1 mes
  HTML: 60 * 60 * 24,          // 1 día
  API: 60 * 5,                 // 5 minutos
  OTHER: 60 * 60 * 24,         // 1 día
  MANIFEST: 60 * 60 * 24 * 7   // 1 semana para el manifest
};

// Tiempo de espera para las solicitudes de red (en segundos)
const NETWORK_TIMEOUT = 5;

// Tamaño máximo de la caché (en MB)
const MAX_CACHE_SIZE = 50;

// ============================================
// Estrategias de Caché
// ============================================


/**
 * Estrategias de caché disponibles
 * Define el comportamiento de almacenamiento en caché para diferentes tipos de recursos
 */
const CACHE_STRATEGIES = Object.freeze({
  CACHE_FIRST: 'cache-first',            // Sirve de la caché primero, si no está, va a la red
  NETWORK_FIRST: 'network-first',        // Intenta obtener de la red primero, si falla usa caché
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate', // Sirve de caché y actualiza en segundo plano
  NETWORK_ONLY: 'network-only',          // Solo red, sin caché
  CACHE_ONLY: 'cache-only'               // Solo caché, sin red
});

// ============================================
// Configuración de Notificaciones Push
// ============================================


/**
 * Configuración para notificaciones push
 */
const NOTIFICATION_CONFIG = {
  // Tiempo de visualización de notificaciones (en segundos)
  DISPLAY_TIME: 10,
  
  // URL de la imagen por defecto para notificaciones
  DEFAULT_ICON: '/images/notification-icon.png',
  
  // Colores de la aplicación para notificaciones
  COLORS: {
    PRIMARY: '#1976d2',
    SECONDARY: '#f50057',
    BACKGROUND: '#ffffff',
    TEXT: '#212121',
    ACCENT: '#ff4081'
  },
  
  // Configuración de acciones
  ACTIONS: [
    { action: 'view', title: 'Ver' },
    { action: 'dismiss', title: 'Descartar' }
  ],
  
  // Configuración de vibración
  VIBRATION_PATTERN: [200, 100, 200, 100, 200, 100, 400]
};

// ============================================
// Recursos para Precaching
// ============================================


/**
 * Lista de recursos para precaching durante la instalación
 * Estos recursos se almacenarán en caché inmediatamente después de la instalación
 */
const PRECACHE_ASSETS = [
  // Páginas HTML
  '/',
  '/offline.html',
  '/404.html',
  
  // Hojas de estilo
  '/css/styles.css',
  '/css/error-pages.css',
  
  // Scripts
  '/js/keyboard-navigation.js',
  '/js/register-sw.js',
  '/js/sw-config.js',
  
  // Imágenes
  '/images/logo.png',
  '/images/logo-192x192.png',
  '/images/logo-512x512.png',
  '/images/delorean.jpg',
  '/images/upgrades/flux-cap.png',
  '/images/upgrades/bumper-sticker.jpg',
  '/images/upgrades/hub-cap.jpg',
  
  // Fuentes
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
  
  // Favicons y recursos PWA
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/safari-pinned-tab.svg',
  '/site.webmanifest',
  
  // SEO
  '/sitemap.xml',
  '/robots.txt'
];

// ============================================
// Exclusiones de Caché
// ============================================


/**
 * Patrones de URL que nunca deben almacenarse en caché
 * Se utilizan expresiones regulares para hacer coincidir patrones de URL
 */
const NO_CACHE_PATTERNS = [
  /\/api\//,                  // Rutas de API
  /\/auth\//,                // Rutas de autenticación
  /\/admin\//,               // Panel de administración
  /\/private\//,             // Rutas privadas
  /\/wp-json\//,             // API de WordPress
  /\/graphql/,               // GraphQL endpoints
  /\/socket\.io\//,          // WebSockets
  /\/sockjs-node\//,         // Webpack Dev Server
  /\/__webpack_hmr/,         // Webpack Hot Module Replacement
  /\/browser-sync\//,        // BrowserSync
  /\.(?:json|xml|csv)$/i,    // Archivos de datos
  /\/service-worker\.js/     // El propio service worker
];

// ============================================
// Estrategias por Ruta
// ============================================


/**
 * Configuración de estrategias de caché por ruta
 * Permite personalizar el comportamiento de almacenamiento en caché
 * para diferentes rutas o patrones de URL
 */
const ROUTE_STRATEGIES = Object.freeze([
  // Páginas principales - Stale While Revalidate para contenido dinámico
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
            headers: { 'Content-Type': [ 'text/html', 'text/plain' ] }
          } 
        }
      ]
    }
  },
  
  // Archivos CSS - Cache First con validación
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
  
  // Scripts JS - Cache First con validación
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
  
  // Imágenes - Cache First con validación
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
  
  // Fuentes - Cache First con validación
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
  
  // Recursos de terceros - Stale While Revalidate
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
            maxAgeSeconds: MAX_AGE.OTHER * 7, // 1 semana
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
  
  // Assets estáticos - Cache First con validación
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
  
  // Peticiones de API - Network First con fallback a caché
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
];

// Exportar configuración
export {
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
