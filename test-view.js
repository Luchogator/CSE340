const express = require('express');
const request = require('supertest');
const app = require('./server');

// Start the server
const server = app.listen(5501, () => {
  console.log('Test server running on port 5501');
  
  // Make a test request to the classification endpoint
  request(app)
    .get('/inv/classification/3')
    .end((err, res) => {
      if (err) {
        console.error('Error:', err);
        process.exit(1);
      }
      
      console.log('Status:', res.status);
      console.log('Headers:', res.headers);
      console.log('Response (first 500 chars):', res.text.substring(0, 500));
      
      // Close the server
      server.close();
    });
});
