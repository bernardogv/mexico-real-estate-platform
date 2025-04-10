/**
 * Minimal controller tests that don't rely on complex setup
 */
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Setup environment variables needed for tests
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';

// Mock dependencies inline - no external setup files
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    $disconnect: jest.fn()
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'test-token'),
  verify: jest.fn()
}));

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('test-salt'),
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn()
}));

// Setup request/response mocks
const mockReq = () => ({
  body: {},
  params: {},
  userId: '1'
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Import controllers directly
const { authController } = require('./src/controllers');

describe('Auth Controller Tests', () => {
  let prisma;
  
  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
  });

  describe('getMe', () => {
    test('should return user profile when user exists', async () => {
      // Arrange
      const req = mockReq();
      const res = mockRes();

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER'
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      // Act
      await authController.getMe(req, res);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: req.userId },
        select: expect.any(Object)
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'User profile retrieved successfully',
        user: mockUser
      });
    });

    test('should return 404 if user not found', async () => {
      // Arrange
      const req = mockReq();
      const res = mockRes();

      prisma.user.findUnique.mockResolvedValue(null);

      // Act
      await authController.getMe(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User not found'
      });
    });
  });

  describe('login', () => {
    test('should login successfully with valid credentials', async () => {
      // Arrange
      const req = mockReq();
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      const res = mockRes();

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER'
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      // Act
      await authController.login(req, res);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: req.body.email }
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(req.body.password, mockUser.passwordHash);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Login successful',
        user: expect.any(Object),
        token: 'test-token'
      });
    });
  });
});
