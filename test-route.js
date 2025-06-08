const express = require('express');
const request = require('supertest');
const app = express();
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const utilities = require('./utils/');
const invController = require('./controllers/invController');

// Basic Express setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Test route
app.get('/test/classification/:id', invController.buildClassificationView);

// Start server
const PORT = 5501;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  
  // Make a test request
  const testId = 3; // Sedan classification
  console.log(`Testing /test/classification/${testId}`);
  
  const req = request(app)
    .get(`/test/classification/${testId}`)
    .expect('Content-Type', /html/)
    .expect(200)
    .end((err, res) => {
      if (err) {
        console.error('Test failed:', err);
        process.exit(1);
      }
      
      console.log('Test passed!');
      console.log('Response length:', res.text.length);
      console.log('First 200 chars of response:', res.text.substring(0, 200));
      
      // Exit after a short delay
      setTimeout(() => process.exit(0), 1000);
    });
});
