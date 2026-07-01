/* ===== KITOBMARKAZI — Supabase (PostgreSQL) Database Setup ===== */
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
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
      return { changes: res.rowCount };
    }
  })
};

module.exports = db;
