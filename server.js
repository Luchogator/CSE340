const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// EJS configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware for static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'CSE Motors',
        currentYear: new Date().getFullYear()
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
