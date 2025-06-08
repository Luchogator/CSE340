const { Pool } = require('pg');
require('dotenv').config();

let config;

// If DATABASE_URL is set (e.g. on Render), use it with SSL
if (process.env.DATABASE_URL) {
  config = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  };
} else {
  // Otherwise, fall back to individual PG credentials from .env
  config = {
    host:     process.env.PGHOST,
    user:     process.env.PGUSER,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port:     process.env.PGPORT
  };
}

const pool = new Pool(config);

module.exports = pool;
