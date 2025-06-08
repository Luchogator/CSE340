const { Pool } = require('pg');
require('dotenv').config();

let config;

// If DATABASE_URL is set (e.g. on Render), use it with SSL
if (process.env.DATABASE_URL) {
  config = {
    connectionString: process.env.DATABASE_URL,
    ssl: { 
      rejectUnauthorized: false 
    }
  };
} else {
  // Otherwise, fall back to individual PG credentials from .env
  config = {
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
}

// Log the database connection details (without password)
console.log('Connecting to database:', {
  host: config.host || new URL(config.connectionString).hostname,
  database: config.database || new URL(config.connectionString).pathname.slice(1),
  user: config.user || new URL(config.connectionString).username,
  port: config.port || new URL(config.connectionString).port
});

const pool = new Pool(config);

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

module.exports = pool;
