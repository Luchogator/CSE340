const express = require('express');
const request = require('supertest');
const app = require('./server');

// Test the classification route with ID 3 (Sedan)
describe('GET /inv/classification/3', () => {
  it('should return 200 and render the classification view', async () => {
    const res = await request(app)
      .get('/inv/classification/3')
      .expect('Content-Type', /html/)
      .expect(200);
    
    console.log('Response status:', res.status);
    console.log('Response headers:', res.headers);
    console.log('Response body (first 500 chars):', res.text.substring(0, 500));
  });
});
