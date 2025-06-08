// database/index.js
require("dotenv").config();
const { Pool } = require("pg");

let config;
if (process.env.DATABASE_URL) {
  // Production configuration using DATABASE_URL
  config = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  };
} else {
  // Local development configuration
  config = {
    host:     process.env.PGHOST,
    user:     process.env.PGUSER,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port:     process.env.PGPORT || 5432,
    ssl:      process.env.NODE_ENV === "production"
              ? { rejectUnauthorized: false }
              : false,
  };
}

const pool = new Pool(config);

// Test the connection
pool
  .query("SELECT NOW()")
  .then(res => console.log("DB Connected at:", res.rows[0].now))
  .catch(err => console.error("DB Connection Error:", err.stack));

module.exports = pool;
