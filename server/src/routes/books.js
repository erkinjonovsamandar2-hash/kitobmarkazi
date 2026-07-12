/* ===== KITOBMARKAZI — API Routes: Books (Postgres/Supabase) ===== */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { adminRequired } = require('../middleware/auth');

/* GET /api/books — paginated, filterable */
router.get('/', async (req, res) => {
  try {
    const { genre, publisher, sort, top, q, page = 1, limit = 50 } = req.query;
    let where = [];
    let params = [];

    if (genre && genre !== 'all') { where.push(`b.genre = $${params.length + 1}`); params.push(genre); }
    if (publisher) { where.push(`b."publisherSlug" = $${params.length + 1}`); params.push(publisher); }
    if (top === '1' || top === 'true') { where.push('b."isTop" = 1'); }
    if (q) {
      const like = `%${q}%`;
      where.push(`(b.title ILIKE $${params.length + 1} OR b.author ILIKE $${params.length + 2} OR p.name ILIKE $${params.length + 3})`);
      params.push(like, like, like);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    let orderBy = 'b.year DESC, b.title ASC';
    if (sort === 'cheap') orderBy = 'b.price ASC';
    else if (sort === 'rating') orderBy = 'b.rating DESC';
    else if (sort === 'new') orderBy = 'b.year DESC';
    else if (sort === 'title') orderBy = 'b.title ASC';

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const totalRes = await db.prepare(`SELECT COUNT(*) as c FROM books b LEFT JOIN publishers p ON b."publisherSlug" = p.slug ${whereClause}`).get(...params);
    const total = parseInt(totalRes.c);

    const rows = await db.prepare(`
      SELECT b.*, p.name as "publisherName", p.logo as "publisherLogo", p."logoText", p."logoColor"
      FROM books b LEFT JOIN publishers p ON b."publisherSlug" = p.slug
      ${whereClause} ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `).all(...params, parseInt(limit), offset);

    res.json({ books: rows, total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) });
  } catch(e) {
    console.error('Books GET error:', e);
    res.status(500).json({ error: e.message });
  }
});

/* GET /api/books/:pubSlug/:bookId — single book */
router.get('/:pubSlug/:bookId', async (req, res) => {
  try {
    const book = await db.prepare(`
      SELECT b.*, p.name as "publisherName", p.logo as "publisherLogo", p."logoText", p."logoColor", p.description as "publisherDesc", p.city, p.founded
      FROM books b LEFT JOIN publishers p ON b."publisherSlug" = p.slug
      WHERE b."publisherSlug" = $1 AND b.id = $2
    `).get(req.params.pubSlug, req.params.bookId);
    
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const recs = await db.prepare(`
      SELECT b.*, p.name as "publisherName" FROM books b LEFT JOIN publishers p ON b."publisherSlug" = p.slug
      WHERE (b.author = $1 OR b."publisherSlug" = $2) AND NOT (b."publisherSlug" = $3 AND b.id = $4)
      ORDER BY CASE WHEN b.author = $5 THEN 0 ELSE 1 END, b.rating DESC LIMIT 4
    `).all(book.author, req.params.pubSlug, req.params.pubSlug, req.params.bookId, book.author);

    res.json({ ...book, recommendations: recs });
  } catch(e) {
    console.error('Book detail error:', e);
    res.status(500).json({ error: e.message });
  }
});

/* POST /api/books — admin: create book */
router.post('/', adminRequired, async (req, res) => {
  const { id, publisherSlug, title, author, price, color, rating, isTop, pages, year, genre, description, cover } = req.body;
  if (!id || !publisherSlug || !title || !author || !price) {
    return res.status(400).json({ error: 'id, publisherSlug, title, author, price required' });
  }
  try {
    await db.prepare(`INSERT INTO books (id,"publisherSlug",title,author,price,color,rating,"isTop",pages,year,genre,description,cover) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`)
      .run(id, publisherSlug, title, author, price, color||null, rating||0, isTop?1:0, pages||null, year||null, genre||'roman', description||null, cover||null);
    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/* PUT /api/books/:pubSlug/:bookId — admin: update book */
router.put('/:pubSlug/:bookId', adminRequired, async (req, res) => {
  try {
    const { title, author, price, color, rating, isTop, pages, year, genre, description, cover } = req.body;
    const result = await db.prepare(`UPDATE books SET
      title=COALESCE($1,title), author=COALESCE($2,author), price=COALESCE($3,price),
      color=COALESCE($4,color), rating=COALESCE($5,rating), "isTop"=COALESCE($6,"isTop"),
      pages=COALESCE($7,pages), year=COALESCE($8,year), genre=COALESCE($9,genre), description=COALESCE($10,description),
      cover=COALESCE($11,cover)
      WHERE "publisherSlug"=$12 AND id=$13`)
      .run(title, author, price, color, rating, isTop!==undefined?(isTop?1:0):null, pages, year, genre, description, cover, req.params.pubSlug, req.params.bookId);
    
    if (result.changes === 0) return res.status(404).json({ error: 'Book not found' });
    res.json({ ok: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

/* DELETE /api/books/:pubSlug/:bookId */
router.delete('/:pubSlug/:bookId', adminRequired, async (req, res) => {
  const result = await db.prepare('DELETE FROM books WHERE "publisherSlug" = $1 AND id = $2').run(req.params.pubSlug, req.params.bookId);
  if (result.changes === 0) return res.status(404).json({ error: 'Book not found' });
  res.json({ ok: true });
});

/* GET /api/books/meta/genres */
router.get('/meta/genres', async (req, res) => {
  const rows = await db.prepare('SELECT genre, COUNT(*) as count FROM books GROUP BY genre ORDER BY count DESC').all();
  res.json(rows);
});

/* GET /api/books/:id/reviews */
router.get('/:id/reviews', async (req, res) => {
  const reviews = await db.prepare('SELECT * FROM reviews WHERE "bookId" = $1 ORDER BY "createdAt" DESC').all(req.params.id);
  res.json(reviews);
});

/* POST /api/books/:id/reviews */
router.post('/:id/reviews', async (req, res) => {
  const { customerName, rating, comment } = req.body;
  if (!customerName || !rating) return res.status(400).json({ error: 'Name and rating required' });
  await db.prepare('INSERT INTO reviews ("bookId", "customerName", rating, comment) VALUES ($1, $2, $3, $4)')
    .run(req.params.id, customerName, rating, comment || '');
  res.status(201).json({ ok: true });
});

/* GET /api/books/admin/all-reviews */
router.get('/admin/all-reviews', adminRequired, async (req, res) => {
  const rows = await db.prepare(`SELECT r.*, b.title as "bookTitle" FROM reviews r LEFT JOIN books b ON r."bookId" = b.id ORDER BY r."createdAt" DESC`).all();
  res.json(rows);
});

/* DELETE /api/books/admin/reviews/:id */
router.delete('/admin/reviews/:id', adminRequired, async (req, res) => {
  await db.prepare('DELETE FROM reviews WHERE id = $1').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
