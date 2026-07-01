/* ===== KITOBMARKAZI — Seed Database from data.js ===== */
const db = require('./db');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

/* ── Import the frontend data directly ── */
// We evaluate data.js in a sandboxed way to extract the constants
const fs = require('fs');
const path = require('path');
const dataJsContent = fs.readFileSync(path.join(__dirname, '..', '..', 'data.js'), 'utf8');

// Extract constants using a minimal sandbox
const sandbox = {};
const fn = new Function(
  'module', 'exports', 'require',
  dataJsContent + '\n' +
  'module.exports = { PUBLISHERS, BOOKS, COMING_SOON, COURIERS, COURIERS_BY_REGION, ' +
  'COURIER_TUMAN_OVERRIDE, GENRES, BOOK_GENRE, PUB_DEFAULT_GENRE, QUIZ, QUIZ_PROFILES };'
);
const mod = { exports: {} };
fn(mod, mod.exports, require);
const DATA = mod.exports;

console.log('🌱 Seeding Kitobmarkazi database...\n');

/* ── 1. Publishers ── */
const insertPub = db.prepare(`
  INSERT OR REPLACE INTO publishers (slug, name, logo, logoText, logoColor, founded, city, description, isTop, sortOrder)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const pubOrder = ["booktopia","yangiasr","zabarjad","akadem","hilol","munir","asaxiy","nido","misbah","huzur","falaq","nasim","yoshkuch","global","sarmoya","bukhara","bestbook","ilmziyo","zukko","gutenberg"];

const insertPubs = db.transaction(() => {
  Object.keys(DATA.PUBLISHERS).forEach((slug) => {
    const p = DATA.PUBLISHERS[slug];
    const order = pubOrder.indexOf(slug);
    insertPub.run(
      slug, p.name, p.logo || null, p.text || null, p.color || null,
      p.founded || null, p.city || null, p.desc || null,
      p.first ? 1 : 0, order >= 0 ? order : 99
    );
  });
});
insertPubs();
console.log(`  ✓ ${Object.keys(DATA.PUBLISHERS).length} publishers`);

/* ── 2. Books ── */
const insertBook = db.prepare(`
  INSERT OR REPLACE INTO books (id, publisherSlug, title, author, price, color, rating, isTop, pages, year, genre)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let bookCount = 0;
const insertBooks = db.transaction(() => {
  Object.keys(DATA.BOOKS).forEach((pubSlug) => {
    DATA.BOOKS[pubSlug].forEach((b) => {
      const genre = DATA.BOOK_GENRE[b.id] || DATA.PUB_DEFAULT_GENRE[pubSlug] || 'roman';
      insertBook.run(
        b.id, pubSlug, b.title, b.author, b.price, b.color || null,
        b.rating || 0, b.top ? 1 : 0, b.pages || null, b.year || null, genre
      );
      bookCount++;
    });
  });
});
insertBooks();
console.log(`  ✓ ${bookCount} books`);

/* ── 3. Coming Soon ── */
const insertCS = db.prepare(`
  INSERT OR REPLACE INTO coming_soon (id, title, author, publisherSlug, bg, releaseDate, label, description)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertComingSoon = db.transaction(() => {
  DATA.COMING_SOON.forEach((a, i) => {
    const d = new Date();
    d.setDate(d.getDate() + (a.offsetDays || 7));
    insertCS.run(
      i + 1, a.title, a.author, a.pubKey, a.bg || null,
      d.toISOString().split('T')[0], a.label || 'Tez kunda', a.desc || null
    );
  });
});
insertComingSoon();
console.log(`  ✓ ${DATA.COMING_SOON.length} coming soon items`);

/* ── 4. Couriers ── */
const insertCourier = db.prepare(`
  INSERT OR REPLACE INTO couriers (slug, name, color, description, price)
  VALUES (?, ?, ?, ?, ?)
`);
const insertCourierRegion = db.prepare(`
  INSERT OR REPLACE INTO courier_regions (courierSlug, region) VALUES (?, ?)
`);
const insertOverride = db.prepare(`
  INSERT OR REPLACE INTO courier_tuman_overrides (region, tuman, courierSlug) VALUES (?, ?, ?)
`);

const insertCouriers = db.transaction(() => {
  Object.keys(DATA.COURIERS).forEach((slug) => {
    const c = DATA.COURIERS[slug];
    insertCourier.run(slug, c.name, c.color || null, c.desc || null, c.price || null);
  });

  Object.keys(DATA.COURIERS_BY_REGION).forEach((region) => {
    if (region === '_default') return;
    DATA.COURIERS_BY_REGION[region].forEach((cSlug) => {
      insertCourierRegion.run(cSlug, region);
    });
  });

  Object.keys(DATA.COURIER_TUMAN_OVERRIDE).forEach((key) => {
    const [region, tuman] = key.split('|');
    DATA.COURIER_TUMAN_OVERRIDE[key].forEach((cSlug) => {
      insertOverride.run(region, tuman, cSlug);
    });
  });
});
insertCouriers();
console.log(`  ✓ ${Object.keys(DATA.COURIERS).length} couriers + region mappings`);

/* ── 5. Default Admin User ── */
const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!existingAdmin) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO users (id, username, passwordHash, displayName, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(uuid(), 'admin', hash, 'Administrator', 'admin');
  console.log('  ✓ Admin user created (username: admin, password: admin123)');
} else {
  console.log('  ✓ Admin user already exists');
}

/* ── 6. Default Settings ── */
const upsertSetting = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
const defaults = {
  'telegram_bot_token': '',
  'telegram_admin_chat_id': '',
  'site_name': 'Kitobmarkazi',
  'site_tagline': 'Uzbek Books. One Platform.',
};
Object.keys(defaults).forEach(k => {
  const existing = db.prepare('SELECT value FROM settings WHERE key = ?').get(k);
  if (!existing) upsertSetting.run(k, defaults[k]);
});
console.log('  ✓ Default settings');

console.log('\n🎉 Seed complete! Database ready at: data/kitobmarkazi.db\n');
