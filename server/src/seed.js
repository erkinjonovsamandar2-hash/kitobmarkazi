/* ===== KITOBMARKAZI — Seed Database from data.js (PostgreSQL) ===== */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const db = require('./db');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

/* ── Import the frontend data directly ── */
const fs = require('fs');
const path = require('path');
const dataJsContent = fs.readFileSync(path.join(__dirname, '..', '..', 'data.js'), 'utf8');

// Extract constants using a minimal sandbox
const sandbox = {};
const fn = new Function(
  'module', 'exports', 'require',
  dataJsContent + '\n' +
  'module.exports = { PUBLISHERS, BOOKS, COMING_SOON, COURIERS, COURIERS_BY_REGION, ' +
  'COURIER_TUMAN_OVERRIDE, GENRES, QUIZ, QUIZ_PROFILES };'
);
const mod = { exports: {} };
fn(mod, mod.exports, require);
const DATA = mod.exports;

async function seed() {
  console.log('🌱 Seeding Kitobmarkazi database (PostgreSQL)...\n');

  /* ── 1. Publishers ── */
  const pubOrder = ["booktopia","yangiasr","zabarjad","akadem","hilol","munir","asaxiy","nido","misbah","huzur","falaq","nasim","yoshkuch","global","sarmoya","bukhara","bestbook","ilmziyo","zukko","gutenberg"];

  for (const slug of Object.keys(DATA.PUBLISHERS)) {
    const p = DATA.PUBLISHERS[slug];
    const order = pubOrder.indexOf(slug);
    await db.query(
      `INSERT INTO publishers (slug, name, logo, "logoText", "logoColor", founded, city, description, "isTop", "sortOrder")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name, logo = EXCLUDED.logo, "logoText" = EXCLUDED."logoText",
         "logoColor" = EXCLUDED."logoColor", founded = EXCLUDED.founded, city = EXCLUDED.city,
         description = EXCLUDED.description, "isTop" = EXCLUDED."isTop", "sortOrder" = EXCLUDED."sortOrder"`,
      [slug, p.name, p.logo || null, p.text || null, p.color || null,
       p.founded || null, p.city || null, p.desc || null,
       p.first ? true : false, order >= 0 ? order : 99]
    );
  }
  console.log(`  ✓ ${Object.keys(DATA.PUBLISHERS).length} publishers`);

  /* ── 2. Books ── */
  let bookCount = 0;
  for (const pubSlug of Object.keys(DATA.BOOKS)) {
    for (const b of DATA.BOOKS[pubSlug]) {
      const genre = (DATA.BOOK_GENRE && DATA.BOOK_GENRE[b.id]) || (DATA.PUB_DEFAULT_GENRE && DATA.PUB_DEFAULT_GENRE[pubSlug]) || 'roman';
      await db.query(
        `INSERT INTO books (id, "publisherSlug", title, author, price, color, rating, "isTop", pages, year, genre)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET
           "publisherSlug" = EXCLUDED."publisherSlug", title = EXCLUDED.title, author = EXCLUDED.author,
           price = EXCLUDED.price, color = EXCLUDED.color, rating = EXCLUDED.rating,
           "isTop" = EXCLUDED."isTop", pages = EXCLUDED.pages, year = EXCLUDED.year, genre = EXCLUDED.genre`,
        [b.id, pubSlug, b.title, b.author, b.price, b.color || null,
         b.rating || 0, b.top ? true : false, b.pages || null, b.year || null, genre]
      );
      bookCount++;
    }
  }
  console.log(`  ✓ ${bookCount} books`);

  /* ── 3. Coming Soon ── */
  // Clear existing coming_soon to avoid stale entries
  await db.query('DELETE FROM coming_soon');
  for (let i = 0; i < DATA.COMING_SOON.length; i++) {
    const a = DATA.COMING_SOON[i];
    const d = new Date();
    d.setDate(d.getDate() + (a.offsetDays || 7));
    await db.query(
      `INSERT INTO coming_soon (id, title, author, "publisherSlug", bg, "releaseDate", label, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [uuid(), a.title, a.author, a.pubKey, a.bg || null,
       d.toISOString().split('T')[0], a.label || 'Tez kunda', a.desc || null]
    );
  }
  console.log(`  ✓ ${DATA.COMING_SOON.length} coming soon items`);

  /* ── 4. Couriers ── */
  for (const slug of Object.keys(DATA.COURIERS)) {
    const c = DATA.COURIERS[slug];
    await db.query(
      `INSERT INTO couriers (slug, name, color, description, price)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name, color = EXCLUDED.color,
         description = EXCLUDED.description, price = EXCLUDED.price`,
      [slug, c.name, c.color || null, c.desc || null, c.price || null]
    );
  }

  // Courier regions
  await db.query('DELETE FROM courier_regions');
  for (const region of Object.keys(DATA.COURIERS_BY_REGION)) {
    if (region === '_default') continue;
    for (const cSlug of DATA.COURIERS_BY_REGION[region]) {
      await db.query(
        `INSERT INTO courier_regions ("courierSlug", region) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [cSlug, region]
      );
    }
  }

  // Tuman overrides
  await db.query('DELETE FROM courier_tuman_overrides');
  for (const key of Object.keys(DATA.COURIER_TUMAN_OVERRIDE)) {
    const [region, tuman] = key.split('|');
    for (const cSlug of DATA.COURIER_TUMAN_OVERRIDE[key]) {
      await db.query(
        `INSERT INTO courier_tuman_overrides (region, tuman, "courierSlug") VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [region, tuman, cSlug]
      );
    }
  }
  console.log(`  ✓ ${Object.keys(DATA.COURIERS).length} couriers + region mappings`);

  /* ── 5. Default Admin User ── */
  const existingAdmin = await db.prepare('SELECT id FROM users WHERE username = $1').get('admin');
  if (!existingAdmin) {
    const hash = bcrypt.hashSync('admin123', 10);
    await db.query(
      `INSERT INTO users (id, username, "passwordHash", "displayName", role)
       VALUES ($1, $2, $3, $4, $5)`,
      [uuid(), 'admin', hash, 'Administrator', 'admin']
    );
    console.log('  ✓ Admin user created (username: admin, password: admin123)');
  } else {
    console.log('  ✓ Admin user already exists');
  }

  /* ── 6. Default Settings ── */
  const defaults = {
    'telegram_bot_token': '',
    'telegram_admin_chat_id': '',
    'site_name': 'Kitobmarkazi',
    'site_tagline': 'Uzbek Books. One Platform.',
  };
  for (const k of Object.keys(defaults)) {
    const existing = await db.prepare('SELECT value FROM settings WHERE key = $1').get(k);
    if (!existing) {
      await db.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
        [k, defaults[k]]
      );
    }
  }
  console.log('  ✓ Default settings');

  console.log('\n🎉 Seed complete! Database seeded to Supabase PostgreSQL.\n');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
