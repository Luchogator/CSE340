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

// Middleware for static files
app.use(express.static(path.join(__dirname, 'public')));

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
  next(err);
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
