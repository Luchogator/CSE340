require('dotenv').config();
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const app = express();
const port = process.env.PORT || 5500;
const Util = require('./utilities/index');
const static = require("./routes/static")
const baseController = require("./controllers/baseController")
const inventoryRoute = require("./routes/inventoryRoute")
const session = require('express-session');
const pool = require('./database');

// EJS configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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
 app.use(session({
  store: new (require('connect-pg-simple')(session))({
    createTableIfMissing: true,
    pool,
  }),
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  name: 'sessionId',
}))

// Express Messages Middleware
app.use(require('connect-flash')())
app.use(function(req, res, next){
  res.locals.messages = require('express-messages')(req, res)
  next()
})

// Set currentYear for all views (move this above all routes and error handlers)
app.use((req, res, next) => {
  res.locals.currentYear = new Date().getFullYear();
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

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
