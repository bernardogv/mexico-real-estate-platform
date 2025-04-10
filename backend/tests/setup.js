// Set up environment variables for tests
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.UPLOAD_DIR = 'test-uploads';
process.env.MAX_FILE_SIZE = '5242880'; // 5MB

// Simple console mock that doesn't need afterAll cleanup
console.error = jest.fn();
