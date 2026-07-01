/* ===== KITOBMARKAZI — Supabase (PostgreSQL) Database Setup ===== */
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set!');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('Unexpected pool error:', err.message);
});

// Helper for synchronous-like API with async/await
const db = {
  query: (text, params) => pool.query(text, params),
  prepare: (text) => ({
    get: async (...params) => {
      const res = await pool.query(text, params);
      return res.rows[0];
    },
    all: async (...params) => {
      const res = await pool.query(text, params);
      return res.rows;
    },
    run: async (...params) => {
      const res = await pool.query(text, params);
      return { changes: res.rowCount, id: res.rows[0] ? res.rows[0].id : null };
    }
  })
};

module.exports = db;
