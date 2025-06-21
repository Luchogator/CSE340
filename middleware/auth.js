// middleware/auth.js
// Middleware para verificar si el usuario está autenticado
exports.isAuthenticated = (req, res, next) => {
    if (req.session.user) {
      return next();
    }
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  };
  
  // Middleware para verificar si el usuario es administrador
  exports.isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.account_role === 'Admin') {
      return next();
    }
    req.session.message = 'Acceso denegado: Se requieren privilegios de administrador';
    return res.redirect('/account/login');
  };
  
  // Middleware para verificar si el usuario es empleado o administrador
  exports.isEmployee = (req, res, next) => {
    if (req.session.user && 
        (req.session.user.account_role === 'Employee' || 
         req.session.user.account_role === 'Admin')) {
      return next();
    }
    req.session.message = 'Acceso denegado: Se requieren privilegios de empleado o administrador';
    return res.redirect('/account/login');
  };