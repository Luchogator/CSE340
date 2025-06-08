const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const utilities = require('./utils/');
const app = express();
const port = process.env.PORT || 5500;

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
  res.status(status).render('errors/error', {
    title: `${status} Error`,
    message: err.message,
    errorCode: status,
  });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
