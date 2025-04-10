const request = require('supertest');

// Import app in a way that won't automatically start the server
let app;
jest.mock('../../src/index', () => {
  const originalApp = jest.requireActual('../../src/index');
  app = originalApp;
  return app;
});

describe('API Health Check', () => {
  test('GET /api/health should return UP status', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('status', 'UP');
    expect(response.body).toHaveProperty('version', '0.1.0');
  });

  test('GET /nonexistent should return 404', async () => {
    const response = await request(app).get('/nonexistent');
    
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('message', 'Resource not found');
  });
});
