/* ===== KITOBMARKAZI — API Routes: Publishers (Postgres/Supabase) ===== */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { adminRequired } = require('../middleware/auth');

/* GET /api/publishers — all publishers sorted */
router.get('/', async (req, res) => {
  const rows = await db.prepare(`
    SELECT p.*, (SELECT COUNT(*) FROM books b WHERE b."publisherSlug" = p.slug) AS "bookCount"
    FROM publishers p ORDER BY p."sortOrder" ASC
  `).all();
  res.json(rows);
});

/* GET /api/publishers/:slug — single publisher + its books */
router.get('/:slug', async (req, res) => {
  const pub = await db.prepare('SELECT * FROM publishers WHERE slug = $1').get(req.params.slug);
  if (!pub) return res.status(404).json({ error: 'Publisher not found' });
  const books = await db.prepare('SELECT * FROM books WHERE "publisherSlug" = $1 ORDER BY year DESC, title ASC').all(req.params.slug);
  res.json({ ...pub, books });
});

/* POST /api/publishers — admin: create publisher */
router.post('/', adminRequired, async (req, res) => {
  const { slug, name, logo, logoText, logoColor, founded, city, description, isTop, sortOrder } = req.body;
  if (!slug || !name) return res.status(400).json({ error: 'slug and name required' });
  try {
    await db.prepare(`INSERT INTO publishers (slug,name,logo,"logoText","logoColor",founded,city,description,"isTop","sortOrder") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`)
      .run(slug, name, logo||null, logoText||null, logoColor||null, founded||null, city||null, description||null, isTop?1:0, sortOrder||99);
    res.status(201).json({ ok: true, slug });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/* PUT /api/publishers/:slug — admin: update publisher */
router.put('/:slug', adminRequired, async (req, res) => {
  const { name, logo, logoText, logoColor, founded, city, description, isTop, sortOrder } = req.body;
  const result = await db.prepare(`UPDATE publishers SET name=COALESCE($1,name), logo=$2, "logoText"=$3, "logoColor"=$4,
    founded=COALESCE($5,founded), city=COALESCE($6,city), description=COALESCE($7,description),
    "isTop"=COALESCE($8,"isTop"), "sortOrder"=COALESCE($9,"sortOrder") WHERE slug=$10`)
    .run(name, logo||null, logoText||null, logoColor||null, founded, city, description, isTop!==undefined?isTop?1:0:null, sortOrder, req.params.slug);
  
  if (result.changes === 0) return res.status(404).json({ error: 'Publisher not found' });
  res.json({ ok: true });
});

/* DELETE /api/publishers/:slug — admin: delete publisher */
router.delete('/:slug', adminRequired, async (req, res) => {
  await db.prepare('DELETE FROM books WHERE "publisherSlug" = $1').run(req.params.slug);
  const result = await db.prepare('DELETE FROM publishers WHERE slug = $1').run(req.params.slug);
  if (result.changes === 0) return res.status(404).json({ error: 'Publisher not found' });
  res.json({ ok: true });
});

module.exports = router;
