const { Pool } = require("pg");
require("dotenv").config(); // To use .env file for environment variables

let pool;

// Check if DATABASE_URL environment variable is set (common for Render)
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Necessary for Render connections
  });
} else {
  // Fallback for local development if DATABASE_URL is not set
  // You might need to create a .env file with PGUSER, PGHOST, PGPASSWORD, PGDATABASE, PGPORT
  // Or configure these directly if you prefer, but .env is safer
  pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
  });
}

module.exports = {
  query: (text, params) => pool.query(text, params),
};
