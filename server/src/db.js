/* ===== KITOBMARKAZI — SQLite Database Setup ===== */
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'kitobmarkazi.db');
const fs = require('fs');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/* ===== Schema ===== */
db.exec(`
  CREATE TABLE IF NOT EXISTS publishers (
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

  CREATE TABLE IF NOT EXISTS books (
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
    PRIMARY KEY (publisherSlug, id)
  );

  CREATE TABLE IF NOT EXISTS coming_soon (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT NOT NULL,
    author        TEXT NOT NULL,
    publisherSlug TEXT REFERENCES publishers(slug),
    bg            TEXT,
    releaseDate   TEXT,
    label         TEXT DEFAULT 'Tez kunda',
    description   TEXT
  );

  CREATE TABLE IF NOT EXISTS couriers (
    slug   TEXT PRIMARY KEY,
    name   TEXT NOT NULL,
    color  TEXT,
    description TEXT,
    price  TEXT
  );

  CREATE TABLE IF NOT EXISTS courier_regions (
    courierSlug TEXT NOT NULL REFERENCES couriers(slug),
    region      TEXT NOT NULL,
    PRIMARY KEY (courierSlug, region)
  );

  CREATE TABLE IF NOT EXISTS courier_tuman_overrides (
    region      TEXT NOT NULL,
    tuman       TEXT NOT NULL,
    courierSlug TEXT NOT NULL REFERENCES couriers(slug),
    PRIMARY KEY (region, tuman, courierSlug)
  );

  CREATE TABLE IF NOT EXISTS promo_codes (
    code        TEXT PRIMARY KEY,
    type        TEXT NOT NULL DEFAULT 'percentage',  -- 'percentage' or 'fixed'
    value       REAL NOT NULL,                       -- percentage (0-100) or fixed amount in UZS
    minOrder    INTEGER DEFAULT 0,
    maxUses     INTEGER DEFAULT 0,                   -- 0 = unlimited
    usedCount   INTEGER DEFAULT 0,
    expiresAt   TEXT,
    isActive    INTEGER DEFAULT 1,
    createdAt   TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id            TEXT PRIMARY KEY,
    orderNumber   TEXT UNIQUE NOT NULL,
    customerName  TEXT NOT NULL,
    customerPhone TEXT NOT NULL,
    region        TEXT NOT NULL,
    tuman         TEXT NOT NULL,
    address       TEXT NOT NULL,
    courierSlug   TEXT REFERENCES couriers(slug),
    payTime       TEXT,          -- 'prepaid' or 'ondelivery'
    payMethod     TEXT,          -- 'payme', 'click', 'uzum'
    promoCode     TEXT,
    discount      INTEGER DEFAULT 0,
    subtotal      INTEGER NOT NULL,
    deliveryFee   INTEGER DEFAULT 0,
    total         INTEGER NOT NULL,
    status        TEXT DEFAULT 'new',  -- new, confirmed, processing, shipped, delivered, cancelled
    note          TEXT,
    createdAt     TEXT DEFAULT (datetime('now')),
    updatedAt     TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId       TEXT NOT NULL REFERENCES orders(id),
    publisherSlug TEXT NOT NULL,
    bookId        TEXT NOT NULL,
    title         TEXT NOT NULL,
    author        TEXT NOT NULL,
    price         INTEGER NOT NULL,
    qty           INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS users (
    id           TEXT PRIMARY KEY,
    username     TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    displayName  TEXT,
    role         TEXT DEFAULT 'admin',
    telegramChatId TEXT,
    createdAt    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_books_genre ON books(genre);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(createdAt);
  CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(orderId);
`);

module.exports = db;
