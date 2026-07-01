/* ===== KITOBMARKAZI — API Routes: Books ===== */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { adminRequired } = require('../middleware/auth');

/* GET /api/books — paginated, filterable */
router.get('/', (req, res) => {
  const { genre, publisher, sort, top, q, page = 1, limit = 50 } = req.query;
  let where = [];
  let params = [];

  if (genre && genre !== 'all') { where.push('b.genre = ?'); params.push(genre); }
  if (publisher) { where.push('b.publisherSlug = ?'); params.push(publisher); }
  if (top === '1' || top === 'true') { where.push('b.isTop = 1'); }
  if (q) {
    where.push('(b.title LIKE ? OR b.author LIKE ? OR p.name LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  let orderBy = 'b.year DESC, b.title ASC';
  if (sort === 'cheap') orderBy = 'b.price ASC';
  else if (sort === 'rating') orderBy = 'b.rating DESC';
  else if (sort === 'new') orderBy = 'b.year DESC';
  else if (sort === 'title') orderBy = 'b.title ASC';

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const total = db.prepare(`SELECT COUNT(*) as c FROM books b LEFT JOIN publishers p ON b.publisherSlug = p.slug ${whereClause}`).get(...params).c;

  const rows = db.prepare(`
    SELECT b.*, p.name as publisherName, p.logo as publisherLogo, p.logoText, p.logoColor
    FROM books b LEFT JOIN publishers p ON b.publisherSlug = p.slug
    ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({ books: rows, total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) });
});

/* GET /api/books/:pubSlug/:bookId — single book */
router.get('/:pubSlug/:bookId', (req, res) => {
  const book = db.prepare(`
    SELECT b.*, p.name as publisherName, p.logo as publisherLogo, p.logoText, p.logoColor, p.desc as publisherDesc, p.city, p.founded
    FROM books b LEFT JOIN publishers p ON b.publisherSlug = p.slug
    WHERE b.publisherSlug = ? AND b.id = ?
  `).get(req.params.pubSlug, req.params.bookId);
  if (!book) return res.status(404).json({ error: 'Book not found' });

  // Recommendations: same author, then same publisher
  const recs = db.prepare(`
    SELECT b.*, p.name as publisherName FROM books b LEFT JOIN publishers p ON b.publisherSlug = p.slug
    WHERE (b.author = ? OR b.publisherSlug = ?) AND NOT (b.publisherSlug = ? AND b.id = ?)
    ORDER BY CASE WHEN b.author = ? THEN 0 ELSE 1 END, b.rating DESC LIMIT 4
  `).all(book.author, req.params.pubSlug, req.params.pubSlug, req.params.bookId, book.author);

  res.json({ ...book, recommendations: recs });
});

/* POST /api/books — admin: create book */
router.post('/', adminRequired, (req, res) => {
  const { id, publisherSlug, title, author, price, color, rating, isTop, pages, year, genre, description } = req.body;
  if (!id || !publisherSlug || !title || !author || !price) {
    return res.status(400).json({ error: 'id, publisherSlug, title, author, price required' });
  }
  try {
    db.prepare(`INSERT INTO books (id,publisherSlug,title,author,price,color,rating,isTop,pages,year,genre,description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, publisherSlug, title, author, price, color||null, rating||0, isTop?1:0, pages||null, year||null, genre||'roman', description||null);
    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/* PUT /api/books/:pubSlug/:bookId — admin: update book */
router.put('/:pubSlug/:bookId', adminRequired, (req, res) => {
  const { title, author, price, color, rating, isTop, pages, year, genre, description } = req.body;
  const result = db.prepare(`UPDATE books SET
    title=COALESCE(?,title), author=COALESCE(?,author), price=COALESCE(?,price),
    color=COALESCE(?,color), rating=COALESCE(?,rating), isTop=COALESCE(?,isTop),
    pages=COALESCE(?,pages), year=COALESCE(?,year), genre=COALESCE(?,genre), description=COALESCE(?,description)
    WHERE publisherSlug=? AND id=?`)
    .run(title, author, price, color, rating, isTop!==undefined?(isTop?1:0):null, pages, year, genre, description, req.params.pubSlug, req.params.bookId);
  if (result.changes === 0) return res.status(404).json({ error: 'Book not found' });
  res.json({ ok: true });
});

/* DELETE /api/books/:pubSlug/:bookId — admin: delete book */
router.delete('/:pubSlug/:bookId', adminRequired, (req, res) => {
  const result = db.prepare('DELETE FROM books WHERE publisherSlug = ? AND id = ?').run(req.params.pubSlug, req.params.bookId);
  if (result.changes === 0) return res.status(404).json({ error: 'Book not found' });
  res.json({ ok: true });
});

/* GET /api/genres — genre list with counts */
router.get('/meta/genres', (req, res) => {
  const rows = db.prepare('SELECT genre, COUNT(*) as count FROM books GROUP BY genre ORDER BY count DESC').all();
  res.json(rows);
});

/* GET /api/books/:id/reviews — public: get reviews for a book */
router.get('/:id/reviews', (req, res) => {
  const reviews = db.prepare('SELECT * FROM reviews WHERE bookId = ? ORDER BY createdAt DESC').all(req.params.id);
  res.json(reviews);
});

/* POST /api/books/:id/reviews — public: add a review */
router.post('/:id/reviews', (req, res) => {
  const { customerName, rating, comment } = req.body;
  if (!customerName || !rating) return res.status(400).json({ error: 'Name and rating required' });
  db.prepare('INSERT INTO reviews (bookId, customerName, rating, comment) VALUES (?, ?, ?, ?)')
    .run(req.params.id, customerName, rating, comment || '');
  res.status(201).json({ ok: true });
});

/* GET /api/books/admin/reviews — admin: get all reviews */
router.get('/admin/all-reviews', (req, res) => {
  const rows = db.prepare(`SELECT r.*, b.title as bookTitle FROM reviews r LEFT JOIN books b ON r.bookId = b.id ORDER BY r.createdAt DESC`).all();
  res.json(rows);
});

/* DELETE /api/books/admin/reviews/:id — admin: delete a review */
router.delete('/admin/reviews/:id', (req, res) => {
  db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});


module.exports = router;

