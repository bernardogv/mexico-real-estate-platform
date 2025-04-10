const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
    user: {
      findUnique: jest.fn(),
      create: jest.fn()
    },
    $disconnect: jest.fn()
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('test-salt'),
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('test-token'),
  verify: jest.fn()
}));

const prisma = new PrismaClient();

describe('Auth API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      // Mock user doesn't exist check
      prisma.user.findUnique.mockResolvedValue(null);
      
      // Mock user creation
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      prisma.user.create.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          phone: '1234567890',
          language: 'SPANISH'
        });

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id', '1');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    test('should return 400 if user already exists', async () => {
      // Mock user exists check
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'existing@example.com'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          firstName: 'Existing',
          lastName: 'User',
          phone: '1234567890'
        });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('message', 'User already exists with this email');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login successfully with valid credentials', async () => {
      // Mock user exists check
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER'
      };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      
      // Mock password check
      bcrypt.compare.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id', '1');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    test('should return 401 if user does not exist', async () => {
      // Mock user doesn't exist check
      prisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test('should return 401 if password is incorrect', async () => {
      // Mock user exists check
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed-password'
      };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      
      // Mock password check (fails)
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.statusCode).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    test('should return user profile when authenticated', async () => {
      // Mock JWT verification
      jwt.verify.mockImplementation(() => {
        return { userId: '1' };
      });

      // Mock user exists check
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        phone: '1234567890',
        language: 'SPANISH',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer test-token');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'User profile retrieved successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', '1');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).toHaveProperty('firstName', 'Test');
      expect(response.body.user).toHaveProperty('lastName', 'User');
    });

    test('should return 401 if not authenticated', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    test('should refresh token when authenticated', async () => {
      // Mock JWT verification
      jwt.verify.mockImplementation(() => {
        return { userId: '1' };
      });

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .set('Authorization', 'Bearer test-token');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message', 'Token refreshed successfully');
      expect(response.body).toHaveProperty('token');
    });

    test('should return 401 if not authenticated', async () => {
      const response = await request(app).post('/api/auth/refresh-token');

      expect(response.statusCode).toBe(401);
    });
  });
});
