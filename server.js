const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const morgan = require('morgan');
const utilities = require('./utils/');
const app = express();
const port = process.env.PORT || 5500;

// Enable request logging
app.use(morgan('dev'));

// EJS configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware for static files with cache control
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      // Don't cache HTML files
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      // Cache other static assets
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// Serve static files from the root directory (for backward compatibility)
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Middleware for express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middleware to inject nav and year
app.use(async (req, res, next) => {
  res.locals.nav = await utilities.getNav();
  res.locals.currentYear = new Date().getFullYear();
  next();
});

// Routes
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Home',
  });
});

// Inventory routes
const inventoryRoutes = require("./routes/inventoryRoute");
app.use("/inv", inventoryRoutes);

// Route to trigger server error for testing
app.get('/error', (req, res, next) => {
  next(new Error('Intentional error'));
});

// 404 handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  console.error(`404 Error: ${req.originalUrl} not found`);
  next(err);
});

// Error handler
app.use((err, req, res, next) => {
  // Log the error
  console.error(`[${new Date().toISOString()}] Error: ${err.message}`);
  console.error(err.stack);
  
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page
  res.status(err.status || 500);
  if (req.accepts('html')) {
    // If the client accepts HTML, render the error page
    res.render('error', {
      title: `Error ${err.status || 500}`,
      message: err.message,
      error: req.app.get('env') === 'development' ? err : {}
    });
  } else if (req.accepts('json')) {
    // If the client accepts JSON, send a JSON response
    res.json({
      error: {
        status: err.status || 500,
        message: err.message
      }
    });
  } else {
    // Default to plain text
    res.type('txt').send(`Error ${err.status || 500}: ${err.message}`);
  }
});

// Error handler
app.use(async (err, req, res, next) => {
  const status = err.status || 500;
  
  // Custom error messages for different status codes
  let errorTitle = 'Error';
  let errorMessage = err.message || 'An unexpected error occurred';
  
  if (status === 404) {
    errorTitle = 'Page Not Found';
    errorMessage = 'The page you requested could not be found.';
  } else if (status === 500) {
    errorTitle = 'Server Error';
    errorMessage = 'An error occurred on the server. Please try again later.';
  } else if (status === 400) {
    errorTitle = 'Bad Request';
    errorMessage = 'The request could not be processed.';
  }
  
  // Registrar el error en la consola
  console.error(`Error ${status}:`, err);
  
  // Renderizar la plantilla de error con la información necesaria
  res.status(status).render('errors/error', {
    title: `${status} - ${errorTitle}`,
    message: errorMessage,
    errorCode: status,
    error: process.env.NODE_ENV === 'development' ? err : null,
    layout: 'layouts/main'  // Asegurarse de usar el layout principal
  });
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  
  // Log all available routes
  console.log('\nAvailable routes:');
  const routes = [
    { path: '/', method: 'GET', description: 'Home page' },
    { path: '/inv/classification/:classificationId', method: 'GET', description: 'View vehicles by classification' },
    { path: '/inv/detail/:inv_id', method: 'GET', description: 'View vehicle details' },
    { path: '/test-classification.html', method: 'GET', description: 'Test classification view' }
  ];
  
  routes.forEach(route => {
    console.log(`${route.method.padEnd(6)} ${route.path.padEnd(40)} - ${route.description}`);
  });
  console.log('\nTo test the classification view, visit:');
  console.log(`http://localhost:${port}/test-classification.html`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  server.close(() => process.exit(1));
});
