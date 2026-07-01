/* ===== KITOBMARKAZI — API Routes: Settings + Coming Soon + Couriers ===== */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { adminRequired } = require('../middleware/auth');

/* ── Settings ── */
router.get('/settings', adminRequired, (req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all();
  const obj = {};
  rows.forEach(r => { obj[r.key] = r.value; });
  res.json(obj);
});

router.put('/settings', adminRequired, (req, res) => {
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const update = db.transaction(() => {
    Object.keys(req.body).forEach(k => { stmt.run(k, req.body[k]); });
  });
  update();
  res.json({ ok: true });
});

/* ── Coming Soon ── */
router.get('/coming-soon', (req, res) => {
  const rows = db.prepare(`
    SELECT cs.*, p.name as publisherName, p.logo as publisherLogo, p.logoText, p.logoColor
    FROM coming_soon cs LEFT JOIN publishers p ON cs.publisherSlug = p.slug
    ORDER BY cs.releaseDate ASC
  `).all();
  res.json(rows);
});

router.post('/coming-soon', adminRequired, (req, res) => {
  const { title, author, publisherSlug, bg, releaseDate, label, description } = req.body;
  if (!title || !author) return res.status(400).json({ error: 'title and author required' });
  const result = db.prepare(`INSERT INTO coming_soon (title, author, publisherSlug, bg, releaseDate, label, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(title, author, publisherSlug||null, bg||null, releaseDate||null, label||'Tez kunda', description||null);
  res.status(201).json({ ok: true, id: result.lastInsertRowid });
});

router.delete('/coming-soon/:id', adminRequired, (req, res) => {
  db.prepare('DELETE FROM coming_soon WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* ── Couriers ── */
router.get('/couriers', (req, res) => {
  const { region, tuman } = req.query;
  if (!region) {
    const all = db.prepare('SELECT * FROM couriers').all();
    return res.json(all);
  }

  // Check tuman override first
  if (tuman) {
    const overrides = db.prepare('SELECT courierSlug FROM courier_tuman_overrides WHERE region = ? AND tuman = ?').all(region, tuman);
    if (overrides.length > 0) {
      const slugs = overrides.map(r => r.courierSlug);
      const couriers = db.prepare(`SELECT * FROM couriers WHERE slug IN (${slugs.map(() => '?').join(',')})`).all(...slugs);
      return res.json(couriers);
    }
  }

  // Region-based
  const regionCouriers = db.prepare(`
    SELECT c.* FROM couriers c
    JOIN courier_regions cr ON c.slug = cr.courierSlug
    WHERE cr.region = ?
  `).all(region);

  if (regionCouriers.length > 0) return res.json(regionCouriers);

  // Default fallback
  const defaults = db.prepare("SELECT c.* FROM couriers c JOIN courier_regions cr ON c.slug = cr.courierSlug WHERE cr.region = '_default'").all();
  res.json(defaults.length > 0 ? defaults : db.prepare('SELECT * FROM couriers').all());
});

/* ── Search ── */
router.get('/search', (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json({ books: [], publishers: [] });
  const like = `%${q}%`;

  const books = db.prepare(`
    SELECT b.*, p.name as publisherName FROM books b
    LEFT JOIN publishers p ON b.publisherSlug = p.slug
    WHERE b.title LIKE ? OR b.author LIKE ? LIMIT 8
  `).all(like, like);

  const publishers = db.prepare(`SELECT * FROM publishers WHERE name LIKE ? LIMIT 4`).all(like);

  res.json({ books, publishers });
});

module.exports = router;
