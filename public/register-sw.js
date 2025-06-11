/**
 * Registra el Service Worker para habilitar capacidades sin conexión
 * y notificaciones push.
 */

// Verificar si el navegador es compatible con Service Workers
if ('serviceWorker' in navigator) {
  // Esperar a que la página cargue completamente
  window.addEventListener('load', () => {
    // Registrar el Service Worker
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        
        // Verificar si hay una nueva versión del Service Worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            // Cuando el nuevo Service Worker esté instalado, mostrar un mensaje
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Nueva versión disponible. Por favor, actualiza la página.');
              // Aquí podrías mostrar un botón para actualizar la aplicación
              showUpdateNotification();
            }
          });
        });
      })
      .catch((error) => {
        console.error('Error al registrar el ServiceWorker: ', error);
      });

    // Verificar si la página se está mostrando desde la caché
    if (navigator.serviceWorker.controller) {
      console.log('La aplicación se está ejecutando sin conexión');
    } else {
      console.log('La aplicación se está ejecutando en línea');
    }
  });
}

// Mostrar notificación de actualización
function showUpdateNotification() {
  // Verificar si Notification API está disponible
  if (!('Notification' in window)) {
    return;
  }

  // Verificar si ya se mostró la notificación
  if (Notification.permission === 'granted') {
    createNotification();
  } else if (Notification.permission !== 'denied') {
    // Solicitar permiso para mostrar notificaciones
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        createNotification();
      }
    });
  }
}

// Crear notificación de actualización
function createNotification() {
  const notification = new Notification('¡Nueva actualización disponible!', {
    body: 'Haz clic para actualizar la aplicación',
    icon: '/images/icon-192x192.png',
    tag: 'update-notification'
  });

  notification.onclick = () => {
    // Recargar la página para aplicar la actualización
    window.location.reload();
  };
}

// Verificar actualizaciones periódicamente
function checkForUpdates() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        registration.update().then(() => {
          console.log('Buscando actualizaciones...');
        }).catch((error) => {
          console.error('Error al buscar actualizaciones:', error);
        });
      }
    });
  }
}

// Verificar actualizaciones cada hora
setInterval(checkForUpdates, 60 * 60 * 1000);

// Verificar actualizaciones cuando la conexión se restablezca
window.addEventListener('online', checkForUpdates);

// Instalar la aplicación en la pantalla de inicio
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevenir que Chrome 67 y versiones anteriores muestren automáticamente el mensaje
  e.preventDefault();
  // Guardar el evento para que se pueda activar más tarde
  deferredPrompt = e;
  // Mostrar un botón de instalación personalizado
  showInstallPromotion();
});

function showInstallPromotion() {
  // Aquí podrías mostrar un botón o banner que llame a deferredPrompt.prompt()
  // cuando el usuario haga clic en él
  console.log('La aplicación se puede instalar en la pantalla de inicio');
  
  // Ejemplo de cómo mostrar un botón de instalación
  const installButton = document.createElement('button');
  installButton.textContent = 'Instalar aplicación';
  installButton.style.position = 'fixed';
  installButton.style.bottom = '20px';
  installButton.style.right = '20px';
  installButton.style.padding = '10px 20px';
  installButton.style.background = '#ff9900';
  installButton.style.color = 'white';
  installButton.style.border = 'none';
  installButton.style.borderRadius = '20px';
  installButton.style.cursor = 'pointer';
  installButton.style.zIndex = '1000';
  installButton.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  
  installButton.addEventListener('click', () => {
    // Ocultar el botón
    installButton.style.display = 'none';
    // Mostrar el mensaje de instalación
    deferredPrompt.prompt();
    // Esperar a que el usuario responda al mensaje
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('El usuario aceptó instalar la aplicación');
      } else {
        console.log('El usuario rechazó instalar la aplicación');
      }
      // Limpiar el evento guardado
      deferredPrompt = null;
    });
  });
  
  document.body.appendChild(installButton);
}
