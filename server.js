require('dotenv').config();
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const app = express();
const port = process.env.PORT || 5500; // Puerto predeterminado restaurado a 5500
const Util = require('./utilities/index');
const static = require("./routes/static")
const baseController = require("./controllers/baseController")
const inventoryRoute = require("./routes/inventoryRoute")
const accountRoute = require("./routes/accountRoute")
const session = require('express-session');
const pool = require('./database');

// EJS configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware for parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Middleware for method override (for DELETE, PUT, etc.)
app.use(methodOverride('_method'));

// Middleware for static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware for express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middleware para navegación dinámica en todas las vistas
app.use(async (req, res, next) => {
  res.locals.nav = await Util.getNav();
  next();
});

/* ***********************
 * Middleware
 * ************************/
// Configuración de la sesión
const pgSession = require('connect-pg-simple')(session);

console.log('=== Configuración de Sesión ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? 'Definido' : 'No definido');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Definido' : 'No definido');

// Asegurarse de que la tabla de sesiones existe
const sessionStore = new pgSession({
  pool: pool,
  tableName: 'session',
  createTableIfMissing: true,
  ttl: 24 * 60 * 60, // 1 día en segundos
  schemaName: 'public',
  pruneSessionInterval: 60 // Minutos entre limpieza de sesiones vencidas
});

const sessionConfig = {
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'secreto-seguro-para-desarrollo',
  resave: false,
  saveUninitialized: false,
  name: 'sessionId',
  proxy: process.env.NODE_ENV === 'production',
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 día en milisegundos
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: process.env.NODE_ENV === 'production' ? '.onrender.com' : undefined
  }
};

// Configurar sesión
app.use(session(sessionConfig));

// Middleware para depurar la sesión
app.use((req, res, next) => {
  console.log('=== Información de Sesión ===');
  console.log('URL:', req.originalUrl);
  console.log('Session ID:', req.sessionID);
  console.log('Session:', req.session);
  console.log('Cookies:', req.cookies);
  console.log('=============================');
  next();
});

// Configurar connect-flash
const flash = require('connect-flash');
app.use(flash());

// Middleware para manejar mensajes de estado desde la URL
app.use((req, res, next) => {
  console.log('=== Inicio del middleware de mensajes de estado ===');
  console.log('URL:', req.originalUrl);
  console.log('Método:', req.method);
  
  // Verificar si hay parámetros de estado en la URL
  if (req.query.status && req.query.message) {
    // Crear objeto de mensaje de estado
    res.locals.statusMessage = {
      type: req.query.status,
      text: decodeURIComponent(req.query.message)
    };
    
    console.log('Mensaje de estado detectado:', res.locals.statusMessage);
  }
  
  console.log('=== Fin del middleware de mensajes de estado ===');
  next();
});

// Set currentYear for all views (move this above all routes and error handlers)
app.use((req, res, next) => {
  res.locals.currentYear = new Date().getFullYear();
  next();
});

// Middleware para exponer mensajes y usuario a todas las vistas (sin connect-flash)
app.use((req, res, next) => {
  res.locals.message = req.session.message;
  res.locals.messageType = req.session.messageType;
  res.locals.user = req.session.user || null;
  // Do NOT delete message here; allow the view to display it.
  // Messages can be cleared explicitly in a later middleware or after response is sent.
  // console.log('Keeping flash message for view:', res.locals.message, res.locals.messageType);
  next();
});




/* ***********************
 * Routes
 *************************/
app.use(static)
//Index Route
const utilities = require('./utilities');
app.get("/", utilities.handleErrors(baseController.buildHome))

// Inventory routes
app.use("/inv", inventoryRoute)

// Account routes
app.use("/", accountRoute)



// Ruta para probar el error 500
app.get('/test-500', (req, res) => {
  console.log('Solicitando página de error 500...');
  const error = new Error('Internal Server Error');
  error.status = 500;
  throw error;
});

// File Not Found Route - must be last route in list
app.use((req, res, next) => {
  const error = new Error('Page Not Found');
  error.status = 404;
  next(error);
});

/* ***********************
* Express Error Handler
* Place after all other middleware
*************************/
// Error handling middleware
app.use(async (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  console.error(`Error ${status}: ${message}`, err.stack);
  
  if (status === 404) {
    console.log(`404 - Ruta no encontrada: ${req.originalUrl}`);
  }
  
  try {
    // Usar la plantilla error.ejs unificada
    res.status(status).render('errors/error', {
      title: `${status} - ${status === 404 ? 'Page Not Found' : 'Server Error'}`,
      status: status,
      message: message,
      nav: res.locals.nav || [],
      currentYear: new Date().getFullYear(),
      layout: 'layouts/main'
    });
  } catch (renderError) {
    console.error('Error al renderizar la página de error:', renderError);
    // Fallback en caso de error al renderizar
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          h1 { color: #dc3545; }
        </style>
      </head>
      <body>
        <h1>${status} - ${status === 404 ? 'Page Not Found' : 'Server Error'}</h1>
        <p>${message}</p>
        <div>
          <a href="/" style="display: inline-block; padding: 10px 20px; margin: 10px; background: #28a745; color: white; text-decoration: none; border-radius: 5px;">Go to Homepage</a>
          <button onclick="window.history.back()" style="padding: 10px 20px; margin: 10px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Go Back</button>
        </div>
      </body>
      </html>
    `);
  }
});




/* ***********************
 * Local Server Information
 * Values from .env (environment) file
 *************************/
const host = process.env.HOST

// Ruta para obtener información de depuración de la sesión
app.get('/debug/session', (req, res) => {
  const sessionData = {
    sessionId: req.sessionID,
    session: req.session,
    cookies: req.cookies,
    signedCookies: req.signedCookies,
    headers: {
      'user-agent': req.headers['user-agent'],
      'cookie': req.headers['cookie']
    }
  };
  
  // Agregar información de mensajes flash
  const flashMessages = {
    success: req.flash('success'),
    error: req.flash('error'),
    info: req.flash('info')
  };
  
  // Verificar si hay mensajes flash
  const hasFlashMessages = Object.values(flashMessages).some(msgs => msgs.length > 0);
  
  res.json({
    environment: process.env.NODE_ENV,
    session: sessionData,
    flashMessages: flashMessages,
    hasFlashMessages: hasFlashMessages,
    resLocals: {
      messages: res.locals.messages || {}
    },
    timestamp: new Date().toISOString()
  });
});

// Ruta de prueba para mensajes flash
app.get('/debug/flash-test', (req, res) => {
  req.flash('success', '¡Este es un mensaje de éxito de prueba!');
  req.flash('error', 'Este es un mensaje de error de prueba.');
  
  // Guardar la sesión antes de redirigir
  req.session.save(() => {
    res.redirect('/');
  });
});

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`)
});
