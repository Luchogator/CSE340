document.addEventListener('DOMContentLoaded', function() {
  // Cerrar mensajes automáticamente después de 5 segundos
  const alerts = document.querySelectorAll('.alert');
  
  alerts.forEach(alert => {
    // Configurar tiempo de cierre automático (5 segundos)
    const timeoutId = setTimeout(() => {
      closeAlert(alert);
    }, 5000);
    
    // Pausar el cierre automático al hacer hover
    alert.addEventListener('mouseenter', () => {
      clearTimeout(timeoutId);
    });
    
    // Reanudar el cierre automático al quitar el hover
    alert.addEventListener('mouseleave', () => {
      setTimeout(() => {
        closeAlert(alert);
      }, 2000);
    });
    
    // Cerrar al hacer clic en el botón de cerrar
    const closeBtn = alert.querySelector('.close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        closeAlert(alert);
      });
    }
  });
  
  // Función para cerrar un mensaje con animación
  function closeAlert(alert) {
    if (!alert) return;
    
    alert.style.animation = 'fadeOut 0.3s ease-out';
    alert.style.opacity = '0';
    
    // Eliminar el mensaje después de la animación
    setTimeout(() => {
      if (alert && alert.parentNode) {
        alert.parentNode.removeChild(alert);
      }
    }, 300);
  }
});

// Añadir la animación de fadeOut al documento
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(20px); }
  }
  
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;
document.head.appendChild(style);
