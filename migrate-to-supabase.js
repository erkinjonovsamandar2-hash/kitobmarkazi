/* ===== KITOBMARKAZI — SQLite to Supabase Migration ===== */
const Database = require('better-sqlite3');
const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const sqlite = new Database(path.join(__dirname, 'server', 'data', 'kitobmarkazi.db'));
const pg = new Client({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  await pg.connect();
  console.log('Connected to Supabase');

  // 1. Create Tables in Postgres
  await pg.query(`
    DROP TABLE IF EXISTS reviews, order_items, orders, promo_codes, courier_tuman_overrides, courier_regions, couriers, coming_soon, books, publishers, users, settings CASCADE;

    CREATE TABLE publishers (
      slug        TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      logo        TEXT,
      logoText    TEXT,
      logoColor   TEXT,
      founded     TEXT,
      city        TEXT,
      description TEXT,
      isTop       INTEGER DEFAULT 0,
      sortOrder   INTEGER DEFAULT 0
    );

    CREATE TABLE books (
      id            TEXT NOT NULL,
      publisherSlug TEXT NOT NULL REFERENCES publishers(slug),
      title         TEXT NOT NULL,
      author        TEXT NOT NULL,
      price         INTEGER NOT NULL,
      color         TEXT,
      rating        REAL DEFAULT 0,
      isTop         INTEGER DEFAULT 0,
      pages         INTEGER,
      year          INTEGER,
      genre         TEXT,
      description   TEXT,
      stock         INTEGER DEFAULT 10,
      PRIMARY KEY (publisherSlug, id)
    );

    CREATE TABLE coming_soon (
      id            SERIAL PRIMARY KEY,
      title         TEXT NOT NULL,
      author        TEXT NOT NULL,
      publisherSlug TEXT REFERENCES publishers(slug),
      bg            TEXT,
      releaseDate   TEXT,
      label         TEXT DEFAULT 'Tez kunda',
      description   TEXT
    );

    CREATE TABLE couriers (
      slug   TEXT PRIMARY KEY,
      name   TEXT NOT NULL,
      color  TEXT,
      description TEXT,
      price  TEXT
    );

    CREATE TABLE courier_regions (
      courierSlug TEXT NOT NULL REFERENCES couriers(slug),
      region      TEXT NOT NULL,
      PRIMARY KEY (courierSlug, region)
    );

    CREATE TABLE courier_tuman_overrides (
      region      TEXT NOT NULL,
      tuman       TEXT NOT NULL,
      courierSlug TEXT NOT NULL REFERENCES couriers(slug),
      PRIMARY KEY (region, tuman, courierSlug)
    );

    CREATE TABLE promo_codes (
      code        TEXT PRIMARY KEY,
      type        TEXT NOT NULL DEFAULT 'percentage',
      value       REAL NOT NULL,
      minOrder    INTEGER DEFAULT 0,
      maxUses     INTEGER DEFAULT 0,
      usedCount   INTEGER DEFAULT 0,
      expiresAt   TEXT,
      isActive    INTEGER DEFAULT 1,
      createdAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE orders (
      id            TEXT PRIMARY KEY,
      orderNumber   TEXT UNIQUE NOT NULL,
      customerName  TEXT NOT NULL,
      customerPhone TEXT NOT NULL,
      region        TEXT NOT NULL,
      tuman         TEXT NOT NULL,
      address       TEXT NOT NULL,
      courierSlug   TEXT REFERENCES couriers(slug),
      payTime       TEXT,
      payMethod     TEXT,
      promoCode     TEXT,
      discount      INTEGER DEFAULT 0,
      subtotal      INTEGER NOT NULL,
      deliveryFee   INTEGER DEFAULT 0,
      total         INTEGER NOT NULL,
      status        TEXT DEFAULT 'new',
      note          TEXT,
      createdAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE order_items (
      id            SERIAL PRIMARY KEY,
      orderId       TEXT NOT NULL REFERENCES orders(id),
      publisherSlug TEXT NOT NULL,
      bookId        TEXT NOT NULL,
      title         TEXT NOT NULL,
      author        TEXT NOT NULL,
      price         INTEGER NOT NULL,
      qty           INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE users (
      id           TEXT PRIMARY KEY,
      username     TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      displayName  TEXT,
      role         TEXT DEFAULT 'admin',
      telegramChatId TEXT,
      createdAt    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE reviews (
      id SERIAL PRIMARY KEY, 
      bookId TEXT, 
      customerName TEXT, 
      rating INTEGER, 
      comment TEXT, 
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX idx_books_genre ON books(genre);
    CREATE INDEX idx_orders_status ON orders(status);
  `);
  console.log('Tables created in Supabase');

  // 2. Migration Helper
  const migrateTable = async (tableName, cols) => {
    const rows = sqlite.prepare(`SELECT * FROM ${tableName}`).all();
    if (rows.length === 0) return;
    
    console.log(`Migrating ${tableName} (${rows.length} rows)...`);
    const colList = cols.join(', ');
    const valPlaceholders = cols.map((_, i) => '$' + (i + 1)).join(', ');
    
    for (const row of rows) {
      const vals = cols.map(c => row[c]);
      await pg.query(`INSERT INTO ${tableName} (${colList}) VALUES (${valPlaceholders}) ON CONFLICT DO NOTHING`, vals);
    }
  };

  // 3. Migrate each table
  await migrateTable('publishers', ['slug','name','logo','logoText','logoColor','founded','city','description','isTop','sortOrder']);
  await migrateTable('books', ['id','publisherSlug','title','author','price','color','rating','isTop','pages','year','genre','description','stock']);
  await migrateTable('coming_soon', ['title','author','publisherSlug','bg','releaseDate','label','description']);
  await migrateTable('couriers', ['slug','name','color','description','price']);
  await migrateTable('courier_regions', ['courierSlug','region']);
  await migrateTable('courier_tuman_overrides', ['region','tuman','courierSlug']);
  await migrateTable('promo_codes', ['code','type','value','minOrder','maxUses','usedCount','expiresAt','isActive']);
  await migrateTable('orders', ['id','orderNumber','customerName','customerPhone','region','tuman','address','courierSlug','payTime','payMethod','promoCode','discount','subtotal','deliveryFee','total','status','note']);
  await migrateTable('order_items', ['orderId','publisherSlug','bookId','title','author','price','qty']);
  await migrateTable('users', ['id','username','passwordHash','displayName','role','telegramChatId']);
  await migrateTable('settings', ['key','value']);
  await migrateTable('reviews', ['bookId','customerName','rating','comment']);

  console.log('Migration complete! 🎉');
  await pg.end();
}

migrate().catch(e => { console.error(e); process.exit(1); });
