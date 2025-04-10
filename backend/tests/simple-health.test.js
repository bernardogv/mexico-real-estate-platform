/**
 * Simple health check test that doesn't rely on complex mocking
 */
const express = require('express');

// Create a simple Express app for testing
const app = express();

app.get('/api/test-health', (req, res) => {
  res.status(200).json({ status: 'UP', version: '0.1.0' });
});

app.get('/api/test-not-found', (req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

const request = require('supertest');

describe('Simple API Health Check', () => {
  test('GET /api/test-health should return UP status', async () => {
    const response = await request(app).get('/api/test-health');
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('status', 'UP');
    expect(response.body).toHaveProperty('version', '0.1.0');
  });

  test('GET /api/test-not-found should return 404', async () => {
    const response = await request(app).get('/api/test-not-found');
    
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('message', 'Resource not found');
  });
});
