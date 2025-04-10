const express = require('express');
const router = express.Router();
const { propertyController, mediaController } = require('../controllers');
const { auth, authorize } = require('../middleware/auth');
const { validate, propertySchemas } = require('../middleware/validation');

// Public routes - no authentication required
router.get('/', validate(propertySchemas.propertySearch, 'query'), propertyController.getProperties);
router.get('/:id', propertyController.getPropertyById);

// Protected routes - authentication required
router.post('/', auth, validate(propertySchemas.createProperty), propertyController.createProperty);
router.put('/:id', auth, validate(propertySchemas.updateProperty), propertyController.updateProperty);
router.delete('/:id', auth, propertyController.deleteProperty);

// Favorites
router.post('/:id/favorite', auth, propertyController.addToFavorites);
router.delete('/:id/favorite', auth, propertyController.removeFromFavorites);

// Media routes
router.get('/:propertyId/media', mediaController.getPropertyMedia);
router.post('/:propertyId/media', auth, mediaController.uploadMedia);

module.exports = router;
