/**
 * Adapter for Media Controller tests
 * This adapter maps the function names used in tests to the actual controller functions
 */
const { mediaController } = require('../src/controllers');

// Create an adapter object that maps test function names to actual controller functions
const mediaControllerAdapter = {
  // Map uploadPropertyImage to uploadMedia
  uploadPropertyImage: mediaController.uploadMedia,
  
  // Map getPropertyImages to getPropertyMedia
  getPropertyImages: mediaController.getPropertyMedia,
  
  // Map deletePropertyImage to deleteMedia
  deletePropertyImage: mediaController.deleteMedia
};

module.exports = mediaControllerAdapter;
