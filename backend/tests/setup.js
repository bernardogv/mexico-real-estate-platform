// Set up environment variables for tests
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.UPLOAD_DIR = 'test-uploads';
process.env.MAX_FILE_SIZE = '5242880'; // 5MB

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
console.error = jest.fn();

// Clean up after tests
afterAll(() => {
  // Restore original console methods
  console.error = originalConsoleError;
});
