/**
 * Service Worker para CSE Motors
 * Proporciona capacidades sin conexión y almacenamiento en caché
 * 
 * Este archivo implementa un Service Worker avanzado con las siguientes características:
 * - Precaching de recursos estáticos
 * - Estrategias de caché personalizables
 * - Soporte offline con página personalizada
 * - Actualizaciones automáticas
 * - Manejo de mensajes para comunicación con la aplicación
 */

// Importar configuración
importScripts('/js/sw-config.js');

// Alias para acceder más fácilmente a la configuración
const { 
  CACHE_NAME, 
  PRECACHE_ASSETS, 
  NO_CACHE_PATTERNS,
  ROUTE_STRATEGIES,
  CACHE_STRATEGIES,
  NOTIFICATION_CONFIG 
} = self.__WB_MANIFEST || {};

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
 * Verifica si una URL coincide con algún patrón de exclusión
 * @param {string} url - URL a verificar
 * @returns {boolean} - True si la URL debe ser excluida del caché
 */
const shouldExcludeFromCache = (url) => {
  return NO_CACHE_PATTERNS.some(pattern => 
    typeof pattern === 'string' 
      ? url.includes(pattern) 
      : pattern.test(url)
  );
};

/**
 * Obtiene la estrategia de caché para una URL específica
 * @param {string} url - URL para la que se busca la estrategia
 * @returns {Object} - Estrategia de caché configurada o la predeterminada
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
 * Implementa la estrategia Cache First
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
    // Si falla la red y no hay respuesta en caché, devolver error
    return Response.error();
  }
};

/**
 * Implementa la estrategia Network First
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
    
    // Almacenar respuesta en caché si es exitosa
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback a caché si la red falla
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Si no hay respuesta en caché, devolver error de red
    return networkResponse || Response.error();
  }
};

/**
 * Implementa la estrategia Stale While Revalidate
 */
const staleWhileRevalidate = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Actualizar caché en segundo plano
  const updateCache = async () => {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
    } catch (error) {
      // Error silencioso al actualizar la caché
      console.error('Error al actualizar caché:', error);
    }
  };
  
  // Iniciar actualización en segundo plano
  if (cachedResponse) {
    updateCache();
    return cachedResponse;
  }
  
  // Si no hay respuesta en caché, obtener de la red
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
// Eventos del Service Worker
// ============================================

/**
 * Evento de instalación
 * Precarga los recursos estáticos definidos en PRECACHE_ASSETS
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Instalando y precargando recursos');
        return cache.addAll([...PRECACHE_ASSETS, OFFLINE_URL]);
      })
      .then(() => self.skipWaiting())
  );
});

/**
 * Evento de activación
 * Limpia cachés antiguas y reclama el control de los clientes
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Limpiar cachés antiguas
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name.startsWith('cse-motors-'))
            .map((name) => caches.delete(name))
        );
      }),
      
      // Reclamar control de los clientes inmediatamente
      self.clients.claim()
    ])
  );
});

/**
 * Evento de fetch
 * Maneja todas las solicitudes de red y aplica las estrategias de caché
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo manejar solicitudes GET y del mismo origen
  if (!CACHEABLE_METHODS.includes(request.method) || 
      !url.origin.startsWith(self.location.origin)) {
    return;
  }
  
  // Excluir ciertas rutas del caché
  if (shouldExcludeFromCache(url.pathname)) {
    return event.respondWith(fetch(request));
  }
  
  // Determinar la estrategia de caché a utilizar
  const { strategy, options = {} } = getCacheStrategy(url.pathname);
  const { cacheName = CACHE_NAME } = options;
  
  // Manejar solicitudes de navegación (HTML) de manera especial
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, cacheName, options)
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }
  
  // Aplicar estrategia de caché según corresponda
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
 * Evento de mensaje
 * Maneja la comunicación con la aplicación
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
      
    // Agregar más tipos de mensajes según sea necesario
  }
});

/**
 * Evento de sincronización en segundo plano
 * Útil para actualizaciones cuando el usuario vuelve a tener conexión
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('[Service Worker] Sincronización en segundo plano');
    // Implementar lógica de sincronización
  }
});

/**
 * Evento de notificación push
 * Maneja las notificaciones push recibidas
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
 * Evento de clic en notificación
 * Maneja las acciones cuando el usuario interactúa con una notificación
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const { action, notification } = event;
  const { data } = notification;
  
  // Manejar acciones personalizadas
  switch (action) {
    case 'view':
      if (data && data.url) {
        clients.openWindow(data.url);
      }
      break;
      
    case 'dismiss':
      // No hacer nada, solo cerrar la notificación
      break;
      
    default:
      // Acción por defecto: abrir la aplicación
      clients.openWindow('/');
  }
});
