/* ===== KITOBMARKAZI — Supabase (PostgreSQL) / Local SQLite Database Setup ===== */
const { Pool } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');

let useSqlite = false;
let sqliteDb = null;
let pool = null;

function initDb() {
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ DATABASE_URL is not set. Defaulting to local SQLite.');
    useSqlite = true;
  } else {
    try {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        },
        connectionTimeoutMillis: 5000 // fail fast if database is unreachable/paused
      });
      
      pool.on('error', (err) => {
        console.error('Unexpected pg pool error:', err.message);
      });
    } catch (e) {
      console.error('Failed to initialize PostgreSQL pool:', e.message);
      useSqlite = true;
    }
  }

  if (useSqlite) {
    loadSqliteFallback();
  }
}

function loadSqliteFallback() {
  if (sqliteDb) return;
  try {
    const dbPath = path.join(__dirname, '..', 'data', 'kitobmarkazi.db');
    console.log(`🔌 Initializing SQLite connection at: ${dbPath}`);
    sqliteDb = new Database(dbPath);
    sqliteDb.pragma('journal_mode = WAL');
    useSqlite = true;
    console.log('✅ SQLite fallback initialized successfully.');
  } catch (e) {
    console.error('FATAL: Failed to initialize SQLite fallback:', e.message);
  }
}

// Translate SQL queries from PG syntax to SQLite syntax
function translateSql(sql) {
  if (!useSqlite) return sql;
  
  let newSql = sql;
  
  // Replace ILIKE with LIKE
  newSql = newSql.replace(/\bILIKE\b/gi, 'LIKE');
  
  // Replace DATE("createdAt") with date("createdAt")
  newSql = newSql.replace(/DATE\("createdAt"\)/gi, 'date("createdAt")');
  
  // Replace CURRENT_DATE with date('now')
  newSql = newSql.replace(/\bCURRENT_DATE\b/gi, "date('now')");
  
  // Replace NOW() with datetime('now')
  newSql = newSql.replace(/\bNOW\(\)/gi, "datetime('now')");
  
  // Replace complex interval logic for orders by day
  // "createdAt" >= CURRENT_TIMESTAMP - (INTERVAL '1 day' * $1)
  // in SQLite: datetime("createdAt") >= datetime('now', '-' || ? || ' day')
  newSql = newSql.replace(
    /"createdAt"\s*>=\s*CURRENT_TIMESTAMP\s*-\s*\(INTERVAL\s*'1 day'\s*\*\s*(\$\d+|\?)\)/gi,
    'datetime("createdAt") >= datetime(\'now\', \'-\' || $1 || \' day\')'
  );
  
  // "createdAt" >= CURRENT_TIMESTAMP - INTERVAL '7 days'
  // in SQLite: datetime("createdAt") >= datetime('now', '-7 days')
  newSql = newSql.replace(
    /"createdAt"\s*>=\s*CURRENT_TIMESTAMP\s*-\s*INTERVAL\s*'7 days'/gi,
    'datetime("createdAt") >= datetime(\'now\', \'-7 days\')'
  );

  // parameter replacement ($1 -> ?, $2 -> ?, etc.)
  newSql = newSql.replace(/\$\d+/g, '?');

  return newSql;
}

initDb();

const db = {
  query: async (text, params) => {
    if (useSqlite) {
      try {
        const sql = translateSql(text);
        const stmt = sqliteDb.prepare(sql);
        const rows = stmt.all(params || []);
        return { rows };
      } catch (e) {
        console.error('SQLite query error:', e.message, '\nSQL:', text);
        throw e;
      }
    } else {
      try {
        return await pool.query(text, params);
      } catch (e) {
        // If Postgres fails (e.g. paused database), fall back dynamically to SQLite for future calls
        if (e.message.includes('tenant/user') || e.message.includes('ENOTFOUND') || e.code === 'ECONNREFUSED') {
          console.warn('⚠️ PostgreSQL connection failed. Dynamically falling back to SQLite...');
          loadSqliteFallback();
          // Retry query using SQLite
          const sql = translateSql(text);
          const stmt = sqliteDb.prepare(sql);
          const rows = stmt.all(params || []);
          return { rows };
        }
        throw e;
      }
    }
  },
  prepare: (text) => {
    return {
      get: async (...params) => {
        if (useSqlite) {
          try {
            const sql = translateSql(text);
            const stmt = sqliteDb.prepare(sql);
            return stmt.get(...params);
          } catch (e) {
            console.error('SQLite prepare.get error:', e.message, '\nSQL:', text);
            throw e;
          }
        } else {
          try {
            const res = await pool.query(text, params);
            return res.rows[0];
          } catch (e) {
            if (e.message.includes('tenant/user') || e.message.includes('ENOTFOUND') || e.code === 'ECONNREFUSED') {
              console.warn('⚠️ PostgreSQL connection failed. Dynamically falling back to SQLite...');
              loadSqliteFallback();
              // Retry query using SQLite
              const sql = translateSql(text);
              const stmt = sqliteDb.prepare(sql);
              return stmt.get(...params);
            }
            throw e;
          }
        }
      },
      all: async (...params) => {
        if (useSqlite) {
          try {
            const sql = translateSql(text);
            const stmt = sqliteDb.prepare(sql);
            return stmt.all(...params);
          } catch (e) {
            console.error('SQLite prepare.all error:', e.message, '\nSQL:', text);
            throw e;
          }
        } else {
          try {
            const res = await pool.query(text, params);
            return res.rows;
          } catch (e) {
            if (e.message.includes('tenant/user') || e.message.includes('ENOTFOUND') || e.code === 'ECONNREFUSED') {
              console.warn('⚠️ PostgreSQL connection failed. Dynamically falling back to SQLite...');
              loadSqliteFallback();
              // Retry query using SQLite
              const sql = translateSql(text);
              const stmt = sqliteDb.prepare(sql);
              return stmt.all(...params);
            }
            throw e;
          }
        }
      },
      run: async (...params) => {
        if (useSqlite) {
          try {
            const sql = translateSql(text);
            const stmt = sqliteDb.prepare(sql);
            const res = stmt.run(...params);
            return { changes: res.changes, id: res.lastInsertRowid };
          } catch (e) {
            console.error('SQLite prepare.run error:', e.message, '\nSQL:', text);
            throw e;
          }
        } else {
          try {
            const res = await pool.query(text, params);
            return { changes: res.rowCount, id: res.rows[0] ? res.rows[0].id : null };
          } catch (e) {
            if (e.message.includes('tenant/user') || e.message.includes('ENOTFOUND') || e.code === 'ECONNREFUSED') {
              console.warn('⚠️ PostgreSQL connection failed. Dynamically falling back to SQLite...');
              loadSqliteFallback();
              // Retry query using SQLite
              const sql = translateSql(text);
              const stmt = sqliteDb.prepare(sql);
              const res = stmt.run(...params);
              return { changes: res.changes, id: res.lastInsertRowid };
            }
            throw e;
          }
        }
      }
    };
  }
};

module.exports = db;
