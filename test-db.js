const pool = require('./database');

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection successful. Current time:', result.rows[0].now);
    
    // Test classifications table
    const classifications = await pool.query('SELECT * FROM classification LIMIT 1');
    console.log('Classifications table exists with', classifications.rowCount, 'rows');
    
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    // Close the pool to allow the process to exit
    await pool.end();
  }
}

testConnection();
