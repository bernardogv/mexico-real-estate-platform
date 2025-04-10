const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const prisma = new PrismaClient();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const propertyDir = path.join(uploadDir, req.params.propertyId || 'temp');
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(propertyDir)) {
      fs.mkdirSync(propertyDir, { recursive: true });
    }
    
    cb(null, propertyDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// Configure multer upload
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // Default 5MB
  },
  fileFilter: (req, file, cb) => {
    // Accept only images and PDFs
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF are allowed.'));
    }
  }
}).array('files', 10); // Allow up to 10 files at once

/**
 * Upload media for a property
 * @route POST /api/properties/:propertyId/media
 */
const uploadMedia = async (req, res) => {
  // Use multer upload middleware
  upload(req, res, async (err) => {
    try {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ message: err.message });
      }

      const { propertyId } = req.params;
      const userId = req.userId; // From auth middleware
      const { type = 'IMAGE', isMain = false } = req.body;

      // Check if property exists and user is the owner or admin
      const property = await prisma.property.findUnique({
        where: { id: parseInt(propertyId) }
      });

      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }

      // Get user role
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      // Check if user has permission
      if (property.ownerId !== userId && user?.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Not authorized to upload media for this property' });
      }

      // No files uploaded
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      // If setting as main, unset other main images
      if (isMain === true || isMain === 'true') {
        await prisma.media.updateMany({
          where: { 
            propertyId: parseInt(propertyId),
            type: 'IMAGE',
            isMain: true
          },
          data: { isMain: false }
        });
      }

      // Create media records for each uploaded file
      const mediaPromises = req.files.map((file, index) => {
        // If it's the first image and no explicit isMain setting, mark as main
        const shouldBeMain = 
          (isMain === true || isMain === 'true') ||
          (index === 0 && isMain !== false && isMain !== 'false');

        // Build URL (in a real app, this might be a CDN URL)
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
        const fileUrl = `${baseUrl}/${file.path.replace(/\\/g, '/')}`;

        return prisma.media.create({
          data: {
            propertyId: parseInt(propertyId),
            type,
            url: fileUrl,
            isMain: shouldBeMain
          }
        });
      });

      const createdMedia = await Promise.all(mediaPromises);

      res.status(201).json({
        message: 'Media uploaded successfully',
        media: createdMedia
      });
    } catch (error) {
      console.error('Media upload error:', error);
      res.status(500).json({ message: 'Server error uploading media', error: error.message });
    }
  });
};

/**
 * Get media for a property
 * @route GET /api/properties/:propertyId/media
 */
const getPropertyMedia = async (req, res) => {
  try {
    const { propertyId } = req.params;

    const media = await prisma.media.findMany({
      where: {
        propertyId: parseInt(propertyId)
      },
      orderBy: [
        { isMain: 'desc' },
        { type: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({
      message: 'Property media retrieved successfully',
      media
    });
  } catch (error) {
    console.error('Get property media error:', error);
    res.status(500).json({ message: 'Server error retrieving media', error: error.message });
  }
};

/**
 * Delete media
 * @route DELETE /api/media/:id
 */
const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const mediaId = parseInt(id);
    const userId = req.userId; // From auth middleware

    // Find media
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        property: true
      }
    });

    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Check if user has permission
    if (media.property.ownerId !== userId && user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to delete this media' });
    }

    // Extract file path from URL
    const urlParts = media.url.split('/');
    const filePath = urlParts.slice(3).join('/'); // Skip protocol and domain parts

    // Delete file from filesystem if exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await prisma.media.delete({
      where: { id: mediaId }
    });

    // If this was main image, set another image as main
    if (media.isMain && media.type === 'IMAGE') {
      const nextImage = await prisma.media.findFirst({
        where: {
          propertyId: media.propertyId,
          type: 'IMAGE',
          id: { not: mediaId }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (nextImage) {
        await prisma.media.update({
          where: { id: nextImage.id },
          data: { isMain: true }
        });
      }
    }

    res.json({
      message: 'Media deleted successfully'
    });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ message: 'Server error deleting media', error: error.message });
  }
};

/**
 * Update media (e.g., to set as main image)
 * @route PUT /api/media/:id
 */
const updateMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const mediaId = parseInt(id);
    const userId = req.userId; // From auth middleware
    const { isMain } = req.body;

    // Find media
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        property: true
      }
    });

    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Check if user has permission
    if (media.property.ownerId !== userId && user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to update this media' });
    }

    // If setting as main, unset other main images
    if (isMain === true && media.type === 'IMAGE') {
      await prisma.media.updateMany({
        where: { 
          propertyId: media.propertyId,
          type: 'IMAGE',
          isMain: true
        },
        data: { isMain: false }
      });
    }

    // Update media
    const updatedMedia = await prisma.media.update({
      where: { id: mediaId },
      data: { isMain }
    });

    res.json({
      message: 'Media updated successfully',
      media: updatedMedia
    });
  } catch (error) {
    console.error('Update media error:', error);
    res.status(500).json({ message: 'Server error updating media', error: error.message });
  }
};

// Create static file server middleware
const serveMedia = (req, res, next) => {
  const uploadDir = process.env.UPLOAD_DIR || 'uploads';
  const staticMiddleware = express.static(uploadDir);
  
  return staticMiddleware(req, res, next);
};

module.exports = {
  uploadMedia,
  getPropertyMedia,
  deleteMedia,
  updateMedia,
  serveMedia
};
