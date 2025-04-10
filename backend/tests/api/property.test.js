const request = require('supertest');
const app = require('../../src/index');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    property: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    propertyImage: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn()
    },
    user: {
      findUnique: jest.fn()
    },
    $transaction: jest.fn(callback => callback(mPrismaClient)),
    $disconnect: jest.fn()
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('test-token'),
  verify: jest.fn()
}));

const prisma = new PrismaClient();

describe('Property API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default JWT verification (authenticated as agent)
    jwt.verify.mockImplementation((token, secret, callback) => {
      return { userId: '1', userRole: 'AGENT' };
    });
  });

  describe('GET /api/properties', () => {
    test('should get properties with pagination', async () => {
      // Mock properties
      const mockProperties = [
        {
          id: '1',
          title: 'Beautiful House',
          price: 250000,
          location: 'Mexico City',
          userId: '1'
        },
        {
          id: '2',
          title: 'Luxury Apartment',
          price: 180000,
          location: 'Cancun',
          userId: '2'
        }
      ];

      prisma.property.findMany.mockResolvedValue(mockProperties);
      prisma.property.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/properties')
        .query({ page: 1, limit: 10 });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('properties');
      expect(response.body).toHaveProperty('totalProperties', 2);
      expect(response.body).toHaveProperty('totalPages', 1);
      expect(response.body).toHaveProperty('currentPage', 1);
      expect(response.body.properties).toHaveLength(2);
    });

    test('should filter properties by search criteria', async () => {
      // Mock filtered properties
      const mockProperties = [
        {
          id: '1',
          title: 'Beautiful House',
          price: 250000,
          location: 'Mexico City',
          propertyType: 'HOUSE',
          bedrooms: 3,
          bathrooms: 2,
          status: 'FOR_SALE',
          userId: '1'
        }
      ];

      prisma.property.findMany.mockResolvedValue(mockProperties);
      prisma.property.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/properties')
        .query({
          page: 1,
          limit: 10,
          location: 'Mexico City',
          minPrice: 200000,
          maxPrice: 300000,
          propertyType: 'HOUSE',
          bedrooms: 3,
          bathrooms: 2,
          status: 'FOR_SALE'
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('properties');
      expect(response.body).toHaveProperty('totalProperties', 1);
      expect(response.body.properties).toHaveLength(1);
      expect(response.body.properties[0]).toHaveProperty('location', 'Mexico City');
      expect(response.body.properties[0]).toHaveProperty('propertyType', 'HOUSE');
    });
  });

  describe('GET /api/properties/:id', () => {
    test('should get property by ID', async () => {
      // Mock property
      const mockProperty = {
        id: '1',
        title: 'Beautiful House',
        price: 250000,
        location: 'Mexico City',
        description: 'A lovely home',
        propertyType: 'HOUSE',
        bedrooms: 3,
        bathrooms: 2,
        areaSize: 150,
        parkingSpaces: 1,
        status: 'FOR_SALE',
        userId: '1',
        user: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '1234567890'
        },
        images: [
          { id: '1', url: '/uploads/properties/1/image1.jpg' },
          { id: '2', url: '/uploads/properties/1/image2.jpg' }
        ]
      };

      prisma.property.findUnique.mockResolvedValue(mockProperty);

      const response = await request(app).get('/api/properties/1');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('property');
      expect(response.body.property).toHaveProperty('id', '1');
      expect(response.body.property).toHaveProperty('title', 'Beautiful House');
      expect(response.body.property).toHaveProperty('user');
      expect(response.body.property).toHaveProperty('images');
      expect(response.body.property.images).toHaveLength(2);
    });

    test('should return 404 if property not found', async () => {
      prisma.property.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/api/properties/999');

      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('message', 'Property not found');
    });
  });

  describe('POST /api/properties', () => {
    test('should create property when authenticated', async () => {
      // Mock created property
      const mockCreatedProperty = {
        id: '3',
        title: 'New Property',
        price: 300000,
        location: 'Puerto Vallarta',
        description: 'A beautiful beachfront property',
        propertyType: 'APARTMENT',
        bedrooms: 2,
        bathrooms: 2,
        areaSize: 120,
        parkingSpaces: 1,
        status: 'FOR_SALE',
        userId: '1',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prisma.property.create.mockResolvedValue(mockCreatedProperty);
      prisma.$transaction.mockImplementation(callback => {
        return Promise.resolve(mockCreatedProperty);
      });

      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: 'New Property',
          price: 300000,
          location: 'Puerto Vallarta',
          description: 'A beautiful beachfront property',
          propertyType: 'APARTMENT',
          bedrooms: 2,
          bathrooms: 2,
          areaSize: 120,
          parkingSpaces: 1,
          status: 'FOR_SALE',
          imageUrls: ['/uploads/properties/test-image1.jpg', '/uploads/properties/test-image2.jpg']
        });

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('message', 'Property created successfully');
      expect(response.body).toHaveProperty('property');
      expect(response.body.property).toHaveProperty('id', '3');
      expect(response.body.property).toHaveProperty('title', 'New Property');
    });

    test('should return 401 if not authenticated', async () => {
      // Simulate no authentication token
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post('/api/properties')
        .send({
          title: 'New Property',
          price: 300000,
          location: 'Puerto Vallarta'
        });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PUT /api/properties/:id', () => {
    test('should update property as owner', async () => {
      // Mock existing property
      const mockExistingProperty = {
        id: '1',
        title: 'Original Property',
        price: 250000,
        description: 'Original description',
        status: 'FOR_SALE',
        userId: '1' // Same as authenticated user
      };

      // Mock updated property
      const mockUpdatedProperty = {
        ...mockExistingProperty,
        title: 'Updated Property',
        price: 275000,
        description: 'Updated description',
        status: 'SOLD',
        updatedAt: new Date()
      };

      prisma.property.findUnique.mockResolvedValue(mockExistingProperty);
      prisma.property.update.mockResolvedValue(mockUpdatedProperty);

      const response = await request(app)
        .put('/api/properties/1')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: 'Updated Property',
          price: 275000,
          description: 'Updated description',
          status: 'SOLD'
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'Property updated successfully');
      expect(response.body).toHaveProperty('property');
      expect(response.body.property).toHaveProperty('title', 'Updated Property');
      expect(response.body.property).toHaveProperty('status', 'SOLD');
    });

    test('should return 403 if not owner or admin', async () => {
      // Mock existing property (owned by different user)
      const mockExistingProperty = {
        id: '1',
        title: 'Original Property',
        userId: '2' // Different from authenticated user
      };

      prisma.property.findUnique.mockResolvedValue(mockExistingProperty);

      const response = await request(app)
        .put('/api/properties/1')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: 'Unauthorized Update'
        });

      expect(response.statusCode).toBe(403);
      expect(response.body).toHaveProperty('message', 'You do not have permission to update this property');
    });
  });

  describe('DELETE /api/properties/:id', () => {
    test('should delete property as owner', async () => {
      // Mock existing property
      const mockExistingProperty = {
        id: '1',
        title: 'Property To Delete',
        userId: '1' // Same as authenticated user
      };

      prisma.property.findUnique.mockResolvedValue(mockExistingProperty);
      prisma.property.delete.mockResolvedValue(mockExistingProperty);

      const response = await request(app)
        .delete('/api/properties/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'Property deleted successfully');
    });

    test('should return 403 if not owner or admin', async () => {
      // Mock existing property (owned by different user)
      const mockExistingProperty = {
        id: '1',
        title: 'Property To Delete',
        userId: '2' // Different from authenticated user
      };

      prisma.property.findUnique.mockResolvedValue(mockExistingProperty);

      const response = await request(app)
        .delete('/api/properties/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.statusCode).toBe(403);
      expect(response.body).toHaveProperty('message', 'You do not have permission to delete this property');
    });
  });
});
