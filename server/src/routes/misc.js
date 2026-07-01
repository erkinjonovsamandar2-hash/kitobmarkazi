/* ===== KITOBMARKAZI — API Routes: Settings + Coming Soon + Couriers (Postgres/Supabase) ===== */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { adminRequired } = require('../middleware/auth');

/* ── Settings ── */
router.get('/settings', adminRequired, async (req, res) => {
  const rows = await db.prepare('SELECT * FROM settings').all();
  const obj = {};
  rows.forEach(r => { obj[r.key] = r.value; });
  res.json(obj);
});

router.put('/settings', adminRequired, async (req, res) => {
  try {
    for (const k of Object.keys(req.body)) {
      await db.prepare("INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value")
        .run(k, req.body[k]);
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/* ── Coming Soon ── */
router.get('/coming-soon', async (req, res) => {
  const rows = await db.prepare(`
    SELECT cs.*, p.name as "publisherName", p.logo as "publisherLogo", p.logoText as "logoText", p.logoColor as "logoColor"
    FROM coming_soon cs LEFT JOIN publishers p ON cs."publisherSlug" = p.slug
    ORDER BY cs."releaseDate" ASC
  `).all();
  res.json(rows);
});

router.post('/coming-soon', adminRequired, async (req, res) => {
  const { title, author, publisherSlug, bg, releaseDate, label, description } = req.body;
  if (!title || !author) return res.status(400).json({ error: 'title and author required' });
  const result = await db.prepare(`INSERT INTO coming_soon (title, author, "publisherSlug", bg, "releaseDate", label, description)
    VALUES ($1, $2, $3, $4, $5, $6, $7)`)
    .run(title, author, publisherSlug||null, bg||null, releaseDate||null, label||'Tez kunda', description||null);
  res.status(201).json({ ok: true, id: result.id });
});

router.delete('/coming-soon/:id', adminRequired, async (req, res) => {
  await db.prepare('DELETE FROM coming_soon WHERE id = $1').run(req.params.id);
  res.json({ ok: true });
});

/* ── Couriers ── */
router.get('/couriers', async (req, res) => {
  const { region, tuman } = req.query;
  if (!region) {
    const all = await db.prepare('SELECT * FROM couriers').all();
    return res.json(all);
  }

  if (tuman) {
    const overrides = await db.prepare('SELECT "courierSlug" FROM courier_tuman_overrides WHERE region = $1 AND tuman = $2').all(region, tuman);
    if (overrides.length > 0) {
      const slugs = overrides.map(r => r.courierSlug);
      // Constructing IN clause
      const placeholders = slugs.map((_, i) => '$' + (i + 1)).join(',');
      const couriers = await db.prepare(`SELECT * FROM couriers WHERE slug IN (${placeholders})`).all(...slugs);
      return res.json(couriers);
    }
  }

  const regionCouriers = await db.prepare(`
    SELECT c.* FROM couriers c
    JOIN courier_regions cr ON c.slug = cr."courierSlug"
    WHERE cr.region = $1
  `).all(region);

  if (regionCouriers.length > 0) return res.json(regionCouriers);

  const defaults = await db.prepare("SELECT c.* FROM couriers c JOIN courier_regions cr ON c.slug = cr.\"courierSlug\" WHERE cr.region = '_default'").all();
  res.json(defaults.length > 0 ? defaults : await db.prepare('SELECT * FROM couriers').all());
});

/* ── Search ── */
router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json({ books: [], publishers: [] });
  const like = `%${q}%`;

  const books = await db.prepare(`
    SELECT b.*, p.name as "publisherName" FROM books b
    LEFT JOIN publishers p ON b."publisherSlug" = p.slug
    WHERE b.title ILIKE $1 OR b.author ILIKE $2 LIMIT 8
  `).all(like, like);

  const publishers = await db.prepare(`SELECT * FROM publishers WHERE name ILIKE $1 LIMIT 4`).all(like);

  res.json({ books, publishers });
});

module.exports = router;
