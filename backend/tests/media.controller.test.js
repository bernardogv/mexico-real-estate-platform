const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { mediaController } = require('../src/controllers');

// Mock dependencies
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    propertyImage: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn()
    },
    property: {
      findUnique: jest.fn()
    },
    $disconnect: jest.fn()
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

jest.mock('fs', () => ({
  promises: {
    unlink: jest.fn().mockResolvedValue(undefined)
  },
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  createWriteStream: jest.fn().mockReturnValue({
    on: jest.fn().mockImplementation(function(event, callback) {
      if (event === 'finish') {
        callback();
      }
      return this;
    }),
    end: jest.fn()
  })
}));

jest.mock('path', () => ({
  join: jest.fn().mockReturnValue('/mock/path/to/uploads/image.jpg'),
  basename: jest.fn().mockReturnValue('image.jpg'),
  extname: jest.fn().mockReturnValue('.jpg')
}));

// Setup mocks
const mockReq = () => {
  return {
    body: {},
    params: {},
    query: {},
    userId: '1',
    userRole: 'ADMIN',
    file: {
      fieldname: 'image',
      originalname: 'test-image.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      destination: '/tmp',
      filename: 'test-image-1234567890.jpg',
      path: '/tmp/test-image-1234567890.jpg',
      size: 12345
    }
  };
};

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Get instance of mocked PrismaClient
const prisma = new PrismaClient();

describe('Media Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.UPLOAD_DIR = 'uploads';
  });

  describe('uploadPropertyImage', () => {
    test('should upload property image successfully as owner', async () => {
      // Arrange
      const req = mockReq();
      req.params.propertyId = '1';
      const res = mockRes();

      // Mock existing property owned by user
      const mockProperty = {
        id: '1',
        title: 'Test Property',
        userId: req.userId // Same as request userId
      };

      const mockImage = {
        id: '1',
        propertyId: '1',
        url: '/uploads/properties/1/test-image-1234567890.jpg',
        filename: 'test-image-1234567890.jpg',
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.propertyImage.create.mockResolvedValue(mockImage);

      // Act
      await mediaController.uploadPropertyImage(req, res);

      // Assert
      expect(prisma.property.findUnique).toHaveBeenCalledWith({
        where: { id: req.params.propertyId }
      });
      expect(prisma.propertyImage.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          propertyId: req.params.propertyId,
          url: expect.any(String),
          filename: expect.any(String)
        })
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Image uploaded successfully',
        image: mockImage
      });
    });

    test('should upload property image successfully as admin', async () => {
      // Arrange
      const req = mockReq();
      req.userRole = 'ADMIN';
      req.userId = '99'; // Different from property owner
      req.params.propertyId = '1';
      const res = mockRes();

      // Mock existing property owned by another user
      const mockProperty = {
        id: '1',
        title: 'Test Property',
        userId: '1' // Different from req.userId
      };

      const mockImage = {
        id: '2',
        propertyId: '1',
        url: '/uploads/properties/1/test-image-1234567890.jpg',
        filename: 'test-image-1234567890.jpg',
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.propertyImage.create.mockResolvedValue(mockImage);

      // Act
      await mediaController.uploadPropertyImage(req, res);

      // Assert
      expect(prisma.property.findUnique).toHaveBeenCalledWith({
        where: { id: req.params.propertyId }
      });
      expect(prisma.propertyImage.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Image uploaded successfully',
        image: mockImage
      });
    });

    test('should return 400 if no file is uploaded', async () => {
      // Arrange
      const req = mockReq();
      req.file = undefined; // No file uploaded
      req.params.propertyId = '1';
      const res = mockRes();

      // Act
      await mediaController.uploadPropertyImage(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No image file uploaded'
      });
      expect(prisma.property.findUnique).not.toHaveBeenCalled();
    });

    test('should return 404 if property not found', async () => {
      // Arrange
      const req = mockReq();
      req.params.propertyId = '999';
      const res = mockRes();

      prisma.property.findUnique.mockResolvedValue(null);

      // Act
      await mediaController.uploadPropertyImage(req, res);

      // Assert
      expect(prisma.property.findUnique).toHaveBeenCalledWith({
        where: { id: req.params.propertyId }
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Property not found'
      });
    });

    test('should return 403 if non-owner non-admin tries to upload image', async () => {
      // Arrange
      const req = mockReq();
      req.userRole = 'AGENT';
      req.userId = '2';
      req.params.propertyId = '1';
      const res = mockRes();

      // Mock existing property owned by different user
      const mockProperty = {
        id: '1',
        title: 'Test Property',
        userId: '1' // Different from req.userId
      };

      prisma.property.findUnique.mockResolvedValue(mockProperty);

      // Act
      await mediaController.uploadPropertyImage(req, res);

      // Assert
      expect(prisma.property.findUnique).toHaveBeenCalledWith({
        where: { id: req.params.propertyId }
      });
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'You do not have permission to upload images for this property'
      });
    });

    test('should return 400 if invalid file type', async () => {
      // Arrange
      const req = mockReq();
      req.file.mimetype = 'application/pdf'; // Invalid mimetype
      req.params.propertyId = '1';
      const res = mockRes();

      // Mock existing property owned by user
      const mockProperty = {
        id: '1',
        title: 'Test Property',
        userId: req.userId
      };

      prisma.property.findUnique.mockResolvedValue(mockProperty);

      // Act
      await mediaController.uploadPropertyImage(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid file type. Only image files are allowed'
      });
    });

    test('should handle server error during image upload', async () => {
      // Arrange
      const req = mockReq();
      req.params.propertyId = '1';
      const res = mockRes();
      const testError = new Error('Test error');

      // Mock existing property owned by user
      const mockProperty = {
        id: '1',
        title: 'Test Property',
        userId: req.userId
      };

      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.propertyImage.create.mockRejectedValue(testError);

      // Act
      await mediaController.uploadPropertyImage(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error uploading image',
        error: testError.message
      });
    });
  });

  describe('getPropertyImages', () => {
    test('should get property images successfully', async () => {
      // Arrange
      const req = mockReq();
      req.params.propertyId = '1';
      const res = mockRes();

      const mockImages = [
        {
          id: '1',
          propertyId: '1',
          url: '/uploads/properties/1/image1.jpg',
          filename: 'image1.jpg',
          order: 1
        },
        {
          id: '2',
          propertyId: '1',
          url: '/uploads/properties/1/image2.jpg',
          filename: 'image2.jpg',
          order: 2
        }
      ];

      prisma.propertyImage.findMany.mockResolvedValue(mockImages);

      // Act
      await mediaController.getPropertyImages(req, res);

      // Assert
      expect(prisma.propertyImage.findMany).toHaveBeenCalledWith({
        where: { propertyId: req.params.propertyId },
        orderBy: { order: 'asc' }
      });
      expect(res.json).toHaveBeenCalledWith({
        images: mockImages
      });
    });

    test('should return empty array if no images found', async () => {
      // Arrange
      const req = mockReq();
      req.params.propertyId = '1';
      const res = mockRes();

      prisma.propertyImage.findMany.mockResolvedValue([]);

      // Act
      await mediaController.getPropertyImages(req, res);

      // Assert
      expect(prisma.propertyImage.findMany).toHaveBeenCalledWith({
        where: { propertyId: req.params.propertyId },
        orderBy: { order: 'asc' }
      });
      expect(res.json).toHaveBeenCalledWith({
        images: []
      });
    });

    test('should handle server error when getting property images', async () => {
      // Arrange
      const req = mockReq();
      req.params.propertyId = '1';
      const res = mockRes();
      const testError = new Error('Test error');

      prisma.propertyImage.findMany.mockRejectedValue(testError);

      // Act
      await mediaController.getPropertyImages(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error fetching property images',
        error: testError.message
      });
    });
  });

  describe('deletePropertyImage', () => {
    test('should delete property image successfully as owner', async () => {
      // Arrange
      const req = mockReq();
      req.params.id = '1';
      const res = mockRes();

      const mockImage = {
        id: '1',
        propertyId: '1',
        url: '/uploads/properties/1/image1.jpg',
        filename: 'image1.jpg',
        order: 1
      };

      const mockProperty = {
        id: '1',
        title: 'Test Property',
        userId: req.userId // Same as request userId
      };

      prisma.propertyImage.findUnique.mockResolvedValue(mockImage);
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.propertyImage.delete.mockResolvedValue(mockImage);

      // Act
      await mediaController.deletePropertyImage(req, res);

      // Assert
      expect(prisma.propertyImage.findUnique).toHaveBeenCalledWith({
        where: { id: req.params.id }
      });
      expect(prisma.property.findUnique).toHaveBeenCalledWith({
        where: { id: mockImage.propertyId }
      });
      expect(prisma.propertyImage.delete).toHaveBeenCalledWith({
        where: { id: req.params.id }
      });
      expect(fs.promises.unlink).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Image deleted successfully'
      });
    });

    test('should delete property image successfully as admin', async () => {
      // Arrange
      const req = mockReq();
      req.userRole = 'ADMIN';
      req.userId = '99'; // Different from property owner
      req.params.id = '1';
      const res = mockRes();

      const mockImage = {
        id: '1',
        propertyId: '1',
        url: '/uploads/properties/1/image1.jpg',
        filename: 'image1.jpg',
        order: 1
      };

      const mockProperty = {
        id: '1',
        title: 'Test Property',
        userId: '1' // Different from req.userId
      };

      prisma.propertyImage.findUnique.mockResolvedValue(mockImage);
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.propertyImage.delete.mockResolvedValue(mockImage);

      // Act
      await mediaController.deletePropertyImage(req, res);

      // Assert
      expect(prisma.propertyImage.findUnique).toHaveBeenCalledWith({
        where: { id: req.params.id }
      });
      expect(prisma.property.findUnique).toHaveBeenCalledWith({
        where: { id: mockImage.propertyId }
      });
      expect(prisma.propertyImage.delete).toHaveBeenCalledWith({
        where: { id: req.params.id }
      });
      expect(fs.promises.unlink).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Image deleted successfully'
      });
    });

    test('should return 404 if image not found', async () => {
      // Arrange
      const req = mockReq();
      req.params.id = '999';
      const res = mockRes();

      prisma.propertyImage.findUnique.mockResolvedValue(null);

      // Act
      await mediaController.deletePropertyImage(req, res);

      // Assert
      expect(prisma.propertyImage.findUnique).toHaveBeenCalledWith({
        where: { id: req.params.id }
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Image not found'
      });
      expect(prisma.property.findUnique).not.toHaveBeenCalled();
      expect(prisma.propertyImage.delete).not.toHaveBeenCalled();
    });

    test('should return 404 if property not found', async () => {
      // Arrange
      const req = mockReq();
      req.params.id = '1';
      const res = mockRes();

      const mockImage = {
        id: '1',
        propertyId: '999', // Non-existent property
        url: '/uploads/properties/999/image1.jpg',
        filename: 'image1.jpg',
        order: 1
      };

      prisma.propertyImage.findUnique.mockResolvedValue(mockImage);
      prisma.property.findUnique.mockResolvedValue(null);

      // Act
      await mediaController.deletePropertyImage(req, res);

      // Assert
      expect(prisma.propertyImage.findUnique).toHaveBeenCalledWith({
        where: { id: req.params.id }
      });
      expect(prisma.property.findUnique).toHaveBeenCalledWith({
        where: { id: mockImage.propertyId }
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Property not found'
      });
      expect(prisma.propertyImage.delete).not.toHaveBeenCalled();
    });

    test('should return 403 if non-owner non-admin tries to delete image', async () => {
      // Arrange
      const req = mockReq();
      req.userRole = 'AGENT';
      req.userId = '2';
      req.params.id = '1';
      const res = mockRes();

      const mockImage = {
        id: '1',
        propertyId: '1',
        url: '/uploads/properties/1/image1.jpg',
        filename: 'image1.jpg',
        order: 1
      };

      const mockProperty = {
        id: '1',
        title: 'Test Property',
        userId: '1' // Different from req.userId
      };

      prisma.propertyImage.findUnique.mockResolvedValue(mockImage);
      prisma.property.findUnique.mockResolvedValue(mockProperty);

      // Act
      await mediaController.deletePropertyImage(req, res);

      // Assert
      expect(prisma.propertyImage.findUnique).toHaveBeenCalledWith({
        where: { id: req.params.id }
      });
      expect(prisma.property.findUnique).toHaveBeenCalledWith({
        where: { id: mockImage.propertyId }
      });
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'You do not have permission to delete this image'
      });
      expect(prisma.propertyImage.delete).not.toHaveBeenCalled();
    });

    test('should handle server error during image deletion', async () => {
      // Arrange
      const req = mockReq();
      req.params.id = '1';
      const res = mockRes();
      const testError = new Error('Test error');

      const mockImage = {
        id: '1',
        propertyId: '1',
        url: '/uploads/properties/1/image1.jpg',
        filename: 'image1.jpg',
        order: 1
      };

      const mockProperty = {
        id: '1',
        title: 'Test Property',
        userId: req.userId
      };

      prisma.propertyImage.findUnique.mockResolvedValue(mockImage);
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.propertyImage.delete.mockRejectedValue(testError);

      // Act
      await mediaController.deletePropertyImage(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error deleting image',
        error: testError.message
      });
    });

    test('should handle file system error gracefully', async () => {
      // Arrange
      const req = mockReq();
      req.params.id = '1';
      const res = mockRes();
      const fsError = new Error('File system error');

      const mockImage = {
        id: '1',
        propertyId: '1',
        url: '/uploads/properties/1/image1.jpg',
        filename: 'image1.jpg',
        order: 1
      };

      const mockProperty = {
        id: '1',
        title: 'Test Property',
        userId: req.userId
      };

      prisma.propertyImage.findUnique.mockResolvedValue(mockImage);
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.propertyImage.delete.mockResolvedValue(mockImage);
      fs.promises.unlink.mockRejectedValue(fsError);

      // Act
      await mediaController.deletePropertyImage(req, res);

      // Assert
      expect(prisma.propertyImage.delete).toHaveBeenCalledWith({
        where: { id: req.params.id }
      });
      expect(fs.promises.unlink).toHaveBeenCalled();
      // Despite file system error, the database record was deleted successfully
      expect(res.json).toHaveBeenCalledWith({
        message: 'Image deleted successfully',
        warning: 'Image file could not be deleted from storage'
      });
    });
  });
});
