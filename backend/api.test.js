/**
 * Simple API tests that don't rely on complex setup
 */
const express = require('express');
const request = require('supertest');

// Create a simple Express app for testing
const app = express();

// Add some test endpoints
app.get('/api/test/health', (req, res) => {
  res.status(200).json({ status: 'UP', version: '0.1.0' });
});

app.post('/api/test/echo', express.json(), (req, res) => {
  res.status(200).json({ message: 'Received', body: req.body });
});

app.get('/api/test/error', (req, res) => {
  res.status(500).json({ message: 'Server error' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

describe('API Endpoint Tests', () => {
  test('GET /api/test/health should return UP status', async () => {
    const response = await request(app).get('/api/test/health');
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('status', 'UP');
    expect(response.body).toHaveProperty('version', '0.1.0');
  });

  test('POST /api/test/echo should return request body', async () => {
    const testData = { name: 'test', value: 123 };
    
    const response = await request(app)
      .post('/api/test/echo')
      .send(testData);
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message', 'Received');
    expect(response.body).toHaveProperty('body');
    expect(response.body.body).toEqual(testData);
  });

  test('GET /api/test/error should return 500', async () => {
    const response = await request(app).get('/api/test/error');
    
    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty('message', 'Server error');
  });

  test('GET /nonexistent should return 404', async () => {
    const response = await request(app).get('/nonexistent');
    
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('message', 'Resource not found');
  });
});
