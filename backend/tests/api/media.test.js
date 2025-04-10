const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Import app in a way that won't automatically start the server
let app;
jest.mock('../../src/index', () => {
  const originalApp = jest.requireActual('../../src/index');
  app = originalApp;
  return app;
});

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

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('test-token'),
  verify: jest.fn()
}));

jest.mock('fs', () => ({
  promises: {
    unlink: jest.fn().mockResolvedValue(undefined)
  },
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  createReadStream: jest.fn().mockReturnValue({
    pipe: jest.fn().mockReturnThis(),
    on: jest.fn().mockImplementation(function(event, callback) {
      if (event === 'end') {
        callback();
      }
      return this;
    })
  }),
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
  extname: jest.fn().mockReturnValue('.jpg'),
  dirname: jest.fn().mockReturnValue('/mock/path/to/uploads')
}));

jest.mock('multer', () => {
  const multer = () => ({
    single: jest.fn().mockImplementation(() => {
      return (req, res, next) => {
        req.file = {
          fieldname: 'image',
          originalname: 'test-image.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          destination: '/tmp',
          filename: 'test-image-1234567890.jpg',
          path: '/tmp/test-image-1234567890.jpg',
          size: 12345
        };
        next();
      };
    })
  });
  multer.memoryStorage = jest.fn();
  return multer;
});

const prisma = new PrismaClient();

describe('Media API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default JWT verification (authenticated as agent)
    jwt.verify.mockImplementation(() => {
      return { userId: '1', userRole: 'AGENT' };
    });

    // Mock process.env
    process.env.UPLOAD_DIR = 'uploads';
    process.env.MAX_FILE_SIZE = '5242880'; // 5MB
  });

  describe('GET /api/media/properties/:propertyId/images', () => {
    test('should get property images', async () => {
      // Mock images
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

      const response = await request(app).get('/api/media/properties/1/images');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('images');
      expect(response.body.images).toHaveLength(2);
      expect(response.body.images[0]).toHaveProperty('url', '/uploads/properties/1/image1.jpg');
      expect(response.body.images[1]).toHaveProperty('url', '/uploads/properties/1/image2.jpg');
    });

    test('should return empty array if no images found', async () => {
      prisma.propertyImage.findMany.mockResolvedValue([]);

      const response = await request(app).get('/api/media/properties/1/images');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('images');
      expect(response.body.images).toHaveLength(0);
    });
  });

  describe('POST /api/media/properties/:propertyId/images', () => {
    test('should upload property image when authenticated as owner', async () => {
      // Mock property
      const mockProperty = {
        id: '1',
        title: 'Test Property',
        userId: '1' // Same as authenticated user
      };

      // Mock created image
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

      const response = await request(app)
        .post('/api/media/properties/1/images')
        .set('Authorization', 'Bearer test-token')
        .attach('image', Buffer.from('fake image data'), 'test-image.jpg');

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('message', 'Image uploaded successfully');
      expect(response.body).toHaveProperty('image');
      expect(response.body.image).toHaveProperty('url');
      expect(response.body.image).toHaveProperty('filename');
    });

    test('should return 401 if not authenticated', async () => {
      // Simulate no authentication token
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post('/api/media/properties/1/images')
        .attach('image', Buffer.from('fake image data'), 'test-image.jpg');

      expect(response.statusCode).toBe(401);
    });

    test('should return 404 if property not found', async () => {
      prisma.property.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/media/properties/999/images')
        .set('Authorization', 'Bearer test-token')
        .attach('image', Buffer.from('fake image data'), 'test-image.jpg');

      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('message', 'Property not found');
    });

    test('should return 403 if not owner or admin', async () => {
      // Mock property owned by different user
      const mockProperty = {
        id: '1',
        title: 'Test Property',
        userId: '2' // Different from authenticated user
      };

      prisma.property.findUnique.mockResolvedValue(mockProperty);

      const response = await request(app)
        .post('/api/media/properties/1/images')
        .set('Authorization', 'Bearer test-token')
        .attach('image', Buffer.from('fake image data'), 'test-image.jpg');

      expect(response.statusCode).toBe(403);
      expect(response.body).toHaveProperty('message', 'You do not have permission to upload images for this property');
    });
  });

  describe('DELETE /api/media/images/:id', () => {
    test('should delete image when authenticated as owner', async () => {
      // Mock image
      const mockImage = {
        id: '1',
        propertyId: '1',
        url: '/uploads/properties/1/image1.jpg',
        filename: 'image1.jpg',
        order: 1
      };

      // Mock property
      const mockProperty = {
        id: '1',
        title: 'Test Property',
        userId: '1' // Same as authenticated user
      };

      prisma.propertyImage.findUnique.mockResolvedValue(mockImage);
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.propertyImage.delete.mockResolvedValue(mockImage);

      const response = await request(app)
        .delete('/api/media/images/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'Image deleted successfully');
    });

    test('should return 401 if not authenticated', async () => {
      // Simulate no authentication token
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .delete('/api/media/images/1');

      expect(response.statusCode).toBe(401);
    });

    test('should return 404 if image not found', async () => {
      prisma.propertyImage.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/media/images/999')
        .set('Authorization', 'Bearer test-token');

      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('message', 'Image not found');
    });

    test('should return 404 if property not found', async () => {
      // Mock image
      const mockImage = {
        id: '1',
        propertyId: '999', // Non-existent property
        url: '/uploads/properties/999/image1.jpg',
        filename: 'image1.jpg',
        order: 1
      };

      prisma.propertyImage.findUnique.mockResolvedValue(mockImage);
      prisma.property.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/media/images/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('message', 'Property not found');
    });

    test('should return 403 if not owner or admin', async () => {
      // Mock image
      const mockImage = {
        id: '1',
        propertyId: '1',
        url: '/uploads/properties/1/image1.jpg',
        filename: 'image1.jpg',
        order: 1
      };

      // Mock property owned by different user
      const mockProperty = {
        id: '1',
        title: 'Test Property',
        userId: '2' // Different from authenticated user
      };

      prisma.propertyImage.findUnique.mockResolvedValue(mockImage);
      prisma.property.findUnique.mockResolvedValue(mockProperty);

      const response = await request(app)
        .delete('/api/media/images/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.statusCode).toBe(403);
      expect(response.body).toHaveProperty('message', 'You do not have permission to delete this image');
    });
  });
});
