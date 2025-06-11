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



// File Not Found Route - must be last route in list
app.use(async (req, res, next) => {
  next({status: 404, message: 'Sorry, we appear to have lost that page.'})
})


/* ***********************
* Express Error Handler
* Place after all other middleware
*************************/
app.use(async (err, req, res, next) => {
  let nav = await utilities.getNav();
  res.status(err.status || 500).render("layouts/main", {
    title: "Error",
    nav,
    currentYear: new Date().getFullYear(),
    body: `<h1>Error</h1><p>${err.message || 'Internal Server Error'}</p>`
  });
})




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
