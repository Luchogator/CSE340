// routes/accountRoute.js
const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const authMiddleware = require('../middleware/auth');

// Rutas de autenticación
router.get('/login', accountController.showLoginForm);
router.post('/login', accountController.login);
router.get('/register', accountController.showRegisterForm);
router.post('/register', accountController.register);
router.get('/logout', accountController.logout);
router.get('/account', authMiddleware.isAuthenticated, accountController.showAccount);
router.post('/account/update', authMiddleware.isAuthenticated, accountController.updateProfile);
router.post('/account/change-password', authMiddleware.isAuthenticated, accountController.changePassword);

module.exports = router;