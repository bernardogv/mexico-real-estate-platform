const express = require('express');
const router = express.Router();
const { userController } = require('../controllers');
const { auth, authorize } = require('../middleware/auth');

// All user routes require authentication
router.use(auth);

// Admin-only routes
router.get('/', authorize(['ADMIN']), userController.getAllUsers);

// User-specific routes (self or admin access)
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// User's favorites and saved searches
router.get('/:id/favorites', userController.getUserFavorites);
router.get('/:id/saved-searches', userController.getUserSavedSearches);

module.exports = router;
