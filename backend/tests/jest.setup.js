// This file is loaded by Jest after the test environment is set up
// Here we can use Jest globals like describe, test, expect, etc.

// Set up environment variables for tests
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.UPLOAD_DIR = 'test-uploads';
process.env.MAX_FILE_SIZE = '5242880'; // 5MB

// Mock console methods
console.error = jest.fn();

// Clean up mocks after all tests
afterAll(() => {
  jest.restoreAllMocks();
});
