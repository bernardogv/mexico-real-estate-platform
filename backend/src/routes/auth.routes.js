const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const { auth } = require('../middleware/auth');
const { validate, userSchemas } = require('../middleware/validation');

// Public routes
router.post('/register', validate(userSchemas.register), authController.register);
router.post('/login', validate(userSchemas.login), authController.login);

// Protected routes
router.post('/refresh-token', auth, authController.refreshToken);
router.get('/me', auth, authController.getMe);

module.exports = router;
