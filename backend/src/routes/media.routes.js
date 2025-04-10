const express = require('express');
const router = express.Router();
const { mediaController } = require('../controllers');
const { auth } = require('../middleware/auth');

// All media routes require authentication except for serving files
router.put('/:id', auth, mediaController.updateMedia);
router.delete('/:id', auth, mediaController.deleteMedia);

// This route would typically be set up differently in the main app.js file
// router.use('/uploads', mediaController.serveMedia);

module.exports = router;
