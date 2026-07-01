/* ===== KITOBMARKAZI — API Routes: Publishers ===== */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { adminRequired } = require('../middleware/auth');

/* GET /api/publishers — all publishers sorted */
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, (SELECT COUNT(*) FROM books b WHERE b.publisherSlug = p.slug) AS bookCount
    FROM publishers p ORDER BY p.sortOrder ASC
  `).all();
  res.json(rows);
});

/* GET /api/publishers/:slug — single publisher + its books */
router.get('/:slug', (req, res) => {
  const pub = db.prepare('SELECT * FROM publishers WHERE slug = ?').get(req.params.slug);
  if (!pub) return res.status(404).json({ error: 'Publisher not found' });
  const books = db.prepare('SELECT * FROM books WHERE publisherSlug = ? ORDER BY year DESC, title ASC').all(req.params.slug);
  res.json({ ...pub, books });
});

/* POST /api/publishers — admin: create publisher */
router.post('/', adminRequired, (req, res) => {
  const { slug, name, logo, logoText, logoColor, founded, city, description, isTop, sortOrder } = req.body;
  if (!slug || !name) return res.status(400).json({ error: 'slug and name required' });
  try {
    db.prepare(`INSERT INTO publishers (slug,name,logo,logoText,logoColor,founded,city,description,isTop,sortOrder) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .run(slug, name, logo||null, logoText||null, logoColor||null, founded||null, city||null, description||null, isTop?1:0, sortOrder||99);
    res.status(201).json({ ok: true, slug });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/* PUT /api/publishers/:slug — admin: update publisher */
router.put('/:slug', adminRequired, (req, res) => {
  const { name, logo, logoText, logoColor, founded, city, description, isTop, sortOrder } = req.body;
  const result = db.prepare(`UPDATE publishers SET name=COALESCE(?,name), logo=?, logoText=?, logoColor=?,
    founded=COALESCE(?,founded), city=COALESCE(?,city), description=COALESCE(?,description),
    isTop=COALESCE(?,isTop), sortOrder=COALESCE(?,sortOrder) WHERE slug=?`)
    .run(name, logo||null, logoText||null, logoColor||null, founded, city, description, isTop!==undefined?isTop?1:0:null, sortOrder, req.params.slug);
  if (result.changes === 0) return res.status(404).json({ error: 'Publisher not found' });
  res.json({ ok: true });
});

/* DELETE /api/publishers/:slug — admin: delete publisher */
router.delete('/:slug', adminRequired, (req, res) => {
  db.prepare('DELETE FROM books WHERE publisherSlug = ?').run(req.params.slug);
  const result = db.prepare('DELETE FROM publishers WHERE slug = ?').run(req.params.slug);
  if (result.changes === 0) return res.status(404).json({ error: 'Publisher not found' });
  res.json({ ok: true });
});

module.exports = router;
